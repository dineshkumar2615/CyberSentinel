import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import KeyExchangeModel from '../../../../lib/models/KeyExchange';
import { auth } from '../../../../auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { key } = await req.json();
        if (!key) {
            return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        }

        const normalizedEmail = session.user.email.toLowerCase().trim();

        await dbConnect();

        // Mark any pending exchange with this key for THIS user as accepted
        await KeyExchangeModel.updateMany(
            { encryptionKey: key, toUser: normalizedEmail, status: 'pending' },
            { status: 'accepted' }
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Accept key error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
