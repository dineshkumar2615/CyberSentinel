import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import SecureMessage from '../../../../lib/models/SecureMessage';
import User from '../../../../lib/models/User';
import { auth } from '../../../../auth';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const normalizedSenderEmail = session.user.email.toLowerCase().trim();

        const { channelId, senderId, senderEmail, encryptedPayload, clientMessageId, tag } = await request.json();
        const normalizedRequestSenderEmail = (senderEmail || session.user.email).toLowerCase().trim();
        
        if (!channelId || !senderId || !encryptedPayload) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const message = await SecureMessage.create({
            channelId,
            senderId,
            encryptedPayload,
            clientMessageId,
            timestamp: Date.now(),
            tag: tag || 'app'
        });

        // Offline Notifications
        try {
            const targetUsers = await User.find({
                'favorites.channelId': channelId,
                email: { $ne: normalizedRequestSenderEmail }
            });

            if (targetUsers.length > 0) {
                for (const targetUser of targetUsers) {
                    const favorite = targetUser.favorites.find((f: any) => f.channelId === channelId);
                    const chatName = favorite?.alias || `Channel ${channelId.substring(0, 8)}...`;
                    
                    const notification = {
                        type: 'messenger',
                        title: 'New Encrypted Message',
                        message: `Incoming transmission on favorited chat: ${chatName}`,
                        channelId,
                        timestamp: new Date(),
                        read: false
                    };

                    await User.updateOne(
                        { _id: targetUser._id },
                        { $push: { notifications: notification } }
                    );
                }
            }
        } catch (notifyError) {
            console.error('Failed to trigger notifications:', notifyError);
        }

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Error saving secure message:', error);
        return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const since = parseInt(searchParams.get('since') || '0', 10);

    if (!channelId) {
        return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
    }

    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const tag = searchParams.get('tag');
        const query: any = {
            channelId,
            timestamp: { $gt: since }
        };

        if (tag) {
            query.tag = tag;
        }

        const messages = await SecureMessage.find(query).sort({ timestamp: 1 }).limit(100);

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching secure messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
