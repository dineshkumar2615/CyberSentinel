import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SecureMessage from '@/lib/models/SecureMessage';

export async function POST(request: Request) {
    try {
        const { channelId, senderId, encryptedPayload } = await request.json();
        
        if (!channelId || !senderId || !encryptedPayload) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const message = await SecureMessage.create({
            channelId,
            senderId,
            encryptedPayload,
            timestamp: Date.now()
        });

        // Offline Notifications: Notify users who have favorited this channel
        try {
            const User = (await import('@/lib/models/User')).default;
            
            // Find users who have this channelId in their favorites
            // We exclude the sender if senderId is an email/userId (deviceIds are harder to filter against accounts but we try)
            const targetUsers = await User.find({
                'favorites.channelId': channelId,
                email: { $ne: senderId } // Only works if senderId is user email
            });

            if (targetUsers.length > 0) {
                const notification = {
                    title: 'New Encrypted Message',
                    message: `Incoming transmission on favorited channel ${channelId.substring(0, 8)}...`,
                    channelId,
                    timestamp: new Date(),
                    read: false
                };

                await User.updateMany(
                    { _id: { $in: targetUsers.map(u => u._id) } },
                    { $push: { notifications: notification } }
                );
            }
        } catch (notifyError) {
            console.error('Failed to trigger notifications:', notifyError);
            // Don't fail the message send if notification fails
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
        await dbConnect();

        const messages = await SecureMessage.find({
            channelId,
            timestamp: { $gt: since }
        }).sort({ timestamp: 1 }).limit(100);

        return NextResponse.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching secure messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
