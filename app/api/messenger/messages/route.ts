import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SecureMessage from '@/lib/models/SecureMessage';

export async function POST(request: Request) {
    try {
        const { channelId, senderId, senderEmail, encryptedPayload } = await request.json();
        
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
            // Exclude the specific user who sent it via their email
            const targetUsers = await User.find({
                'favorites.channelId': channelId,
                email: { $ne: senderEmail }
            });

            if (targetUsers.length > 0) {
                // Personalize notifications for each user based on their specific alias
                for (const targetUser of targetUsers) {
                    const favorite = targetUser.favorites.find((f: any) => f.channelId === channelId);
                    const chatName = favorite?.alias || `Channel ${channelId.substring(0, 8)}...`;
                    
                    const notification = {
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
