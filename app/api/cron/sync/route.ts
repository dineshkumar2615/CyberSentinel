import { NextResponse } from 'next/server';
import { ingestMediaNews } from '@/lib/ingestion-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple security check (should match an ENV variable in production)
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newsCount = await ingestMediaNews();

        return NextResponse.json({
            success: true,
            message: 'Real-time sync complete',
            stats: {
                news_ingested: newsCount,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Core Sync Error:', error);
        return NextResponse.json({ error: error.message || 'Sync Failed' }, { status: 500 });
    }
}
