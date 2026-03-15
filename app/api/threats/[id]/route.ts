import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ThreatModel from '@/lib/models/Threat';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const threat = await ThreatModel.findOneAndUpdate(
            { id: id },
            { $inc: { usefulVotes: 1 } },
            { new: true }
        );

        if (!threat) {
            return NextResponse.json({ success: false, error: 'Threat not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: threat });
    } catch (error) {
        console.error('Error updating vote:', error);
        return NextResponse.json({ success: false, error: 'Failed to update vote' }, { status: 500 });
    }
}
