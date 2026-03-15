import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Threat from '@/lib/models/Threat';
import { auth } from '@/auth';

export async function PUT(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, isHighlighted, isHidden } = await request.json();
        await dbConnect();

        const threat = await Threat.findOneAndUpdate(
            { id },
            { isHighlighted, isHidden },
            { new: true }
        );

        if (!threat) return NextResponse.json({ error: 'Threat not found' }, { status: 404 });

        return NextResponse.json(threat);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update threat' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await dbConnect();
        await Threat.findOneAndDelete({ id });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete threat' }, { status: 500 });
    }
}
