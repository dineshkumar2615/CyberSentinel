import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import KeyExchangeModel from '@/lib/models/KeyExchange';

// GET: Fetch pending key exchanges for current user
export async function GET() {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pendingKeys = await KeyExchangeModel.find({
            toUser: session.user.email,
            status: 'pending',
        }).sort({ createdAt: -1 }).lean();

        return NextResponse.json(pendingKeys.map(ke => ({
            id: ke._id,
            chatId: ke.chatId,
            fromUser: ke.fromUser,
            createdAt: ke.createdAt,
        })));
    } catch (error) {
        console.error('Error fetching pending keys:', error);
        return NextResponse.json([]);
    }
}

// POST: Accept key exchange
export async function POST(request: Request) {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { keyExchangeId } = body;

        // Find and update key exchange
        const keyExchange = await KeyExchangeModel.findOneAndUpdate(
            {
                _id: keyExchangeId,
                toUser: session.user.email,
                status: 'pending',
            },
            { status: 'accepted' },
            { new: true }
        );

        if (!keyExchange) {
            return NextResponse.json({ error: 'Key exchange not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            chatId: keyExchange.chatId,
            encryptionKey: keyExchange.encryptionKey,
            fromUser: keyExchange.fromUser,
        });
    } catch (error) {
        console.error('Error accepting key:', error);
        return NextResponse.json({ error: 'Failed to accept key' }, { status: 500 });
    }
}

// DELETE: Reject key exchange
export async function DELETE(request: Request) {
    try {
        await dbConnect();

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const keyExchangeId = searchParams.get('id');

        await KeyExchangeModel.findOneAndUpdate(
            {
                _id: keyExchangeId,
                toUser: session.user.email,
            },
            { status: 'rejected' }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting key:', error);
        return NextResponse.json({ error: 'Failed to reject key' }, { status: 500 });
    }
}
