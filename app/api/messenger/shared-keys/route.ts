import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import KeyExchangeModel from '../../../../lib/models/KeyExchange';
import { auth } from '../../../../auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            console.warn('[GET /api/messenger/shared-keys] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const normalizedEmail = session.user.email.toLowerCase().trim();
        console.log(`[GET /api/messenger/shared-keys] Fetching keys for: ${normalizedEmail}`);

        // Fetch pending keys shared WITH the current user
        const keys = await KeyExchangeModel.find({
            toUser: normalizedEmail,
            status: 'pending'
        }).sort({ updatedAt: -1 });

        return NextResponse.json({ keys });
    } catch (err) {
        console.error('Fetch shared keys error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
