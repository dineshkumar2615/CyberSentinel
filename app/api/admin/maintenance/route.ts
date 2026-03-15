import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSettings from '@/lib/models/SystemSettings';
import { auth } from '@/auth';

export async function GET() {
    await dbConnect();
    const settings = await SystemSettings.findOne({}) || await SystemSettings.create({});
    return NextResponse.json(settings);
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { isMaintenanceMode, maintenanceMessage, maintenanceStart, maintenanceEnd } = await request.json();
        await dbConnect();

        const settings = await SystemSettings.findOneAndUpdate(
            {},
            {
                isMaintenanceMode,
                maintenanceMessage,
                maintenanceStart,
                maintenanceEnd,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
