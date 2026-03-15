import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import ScanHistory from '@/lib/models/ScanHistory';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const history = await ScanHistory.find({ userId: session.user.id })
            .sort({ timestamp: -1 })
            .limit(50);

        return NextResponse.json(history);
    } catch (error) {
        console.error('History Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, clearAll } = await request.json();
        await dbConnect();

        if (clearAll) {
            await ScanHistory.deleteMany({ userId: session.user.id });
            return NextResponse.json({ success: true, message: 'History cleared' });
        }

        if (id) {
            await ScanHistory.deleteOne({ _id: id, userId: session.user.id });
            return NextResponse.json({ success: true, message: 'Item deleted' });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('History Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
