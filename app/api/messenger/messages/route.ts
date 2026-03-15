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
