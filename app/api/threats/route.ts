import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import ThreatModel from '../../../lib/models/Threat';

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const days = searchParams.get('days');

        let query = {};
        if (days && days !== 'all') {
            // Extract numbers only to handle "7d", "30d" etc
            const numDays = parseInt(days.replace(/\D/g, '')) || 30;
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - numDays);
            query = { timestamp: { $gte: dateLimit.toISOString() } };
        } else if (days === 'all') {
            query = {};
        } else {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 30);
            query = { timestamp: { $gte: dateLimit.toISOString() } };
        }

        const threats = await ThreatModel.find(query).sort({ timestamp: -1 });
        return NextResponse.json(threats);
    } catch (error: any) {
        console.error('CRITICAL_API_ERROR [GET /api/threats]:', {
            message: error.message,
            stack: error.stack,
            query: request.url
        });
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
