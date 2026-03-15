import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ThreatModel from '@/lib/models/Threat';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const days = searchParams.get('days');

        let query = {};
        if (days) {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - parseInt(days));
            query = { timestamp: { $gte: dateLimit.toISOString() } };
        } else {
            // Default: 7 days as requested for the main platform view
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 7);
            query = { timestamp: { $gte: dateLimit.toISOString() } };
        }

        const threats = await ThreatModel.find(query).sort({ timestamp: -1 });
        return NextResponse.json(threats);
    } catch (error) {
        console.error('Error fetching threats:', error);
        // Return empty array as fallback instead of error to prevent UI crashes
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();
        const threat = await ThreatModel.create(data);
        return NextResponse.json({ success: true, data: threat }, { status: 201 });
    } catch (error) {
        console.error('Error creating threat:', error);
        return NextResponse.json({ success: false, error: 'Failed to create threat' }, { status: 500 });
    }
}
