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

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, screenshotData, persistRemote, uuid } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let dataToUpdate: any = {};
        
        if (screenshotData) {
            dataToUpdate['visualAnalysis.screenshotData'] = screenshotData;
        } else if (persistRemote && uuid) {
            try {
                // Fetch from urlscan on the server where CORS is not an issue
                const imageUrl = `https://urlscan.io/screenshots/${uuid}.png`;
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                    const buffer = await imgRes.arrayBuffer();
                    const base64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
                    dataToUpdate['visualAnalysis.screenshotData'] = base64;
                }
            } catch (e) {
                console.error('Remote persistence failed:', e);
            }
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        await dbConnect();
        const updated = await ScanHistory.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: dataToUpdate },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('History Patch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
