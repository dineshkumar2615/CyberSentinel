import { NextResponse } from 'next/server';
import { performFullSync } from '@/lib/sync-service';

export async function POST() {
    const result = await performFullSync();

    if (result.success) {
        return NextResponse.json({
            success: true,
            message: `Sync complete. ${result.totalCount} new threats ingested (${result.newsCount} from news, ${result.cisaCount} from CISA).`,
            count: result.totalCount
        });
    } else {
        return NextResponse.json({ success: false, error: result.error || 'Failed to sync threat data' }, { status: 500 });
    }
}
