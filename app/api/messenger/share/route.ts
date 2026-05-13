import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import KeyExchangeModel from '../../../../lib/models/KeyExchange';
import User from '../../../../lib/models/User';
import { auth } from '../../../../auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { key, recipientEmail } = await req.json();
        if (!key || !recipientEmail) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const normalizedRecipient = recipientEmail.toLowerCase().trim();
        const normalizedSender = session.user.email.toLowerCase().trim();

        await dbConnect();

        await dbConnect();

        // Create a unique chatId that includes direction
        const chatId = `${normalizedSender}_to_${normalizedRecipient}`;

        const exchange = await KeyExchangeModel.findOneAndUpdate(
            { chatId },
            {
                fromUser: normalizedSender,
                toUser: normalizedRecipient,
                encryptionKey: key,
                status: 'pending',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            { upsert: true, new: true }
        );

        // Send a notification to the recipient so it appears in their global bell dropdown
        await User.updateOne(
            { email: normalizedRecipient },
            {
                $push: {
                    notifications: {
                        type: 'handshake',
                        title: 'New Key Received',
                        message: `${normalizedSender} has shared a Secure Messenger key with you.`,
                        timestamp: new Date(),
                        read: false
                    }
                }
            }
        );

        return NextResponse.json({ success: true, data: exchange });
    } catch (err) {
        console.error('Share key error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
