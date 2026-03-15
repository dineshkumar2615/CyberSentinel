import { NextResponse } from 'next/server';
import { ingestCISAThreats, ingestMediaNews } from '@/lib/ingestion-engine';

export async function POST() {
    try {
        const cisaCount = await ingestCISAThreats();
        const newsCount = await ingestMediaNews();

        const totalCount = cisaCount + newsCount;

        return NextResponse.json({
            success: true,
            message: `Sync complete. ${totalCount} new threats ingested (${newsCount} from news, ${cisaCount} from CISA).`,
            count: totalCount
        });
    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to sync threat data' }, { status: 500 });
    }
}
