import { ingestCISAThreats, ingestMediaNews } from './ingestion-engine';

export async function performFullSync() {
    console.log('[SyncService] Starting full threat synchronization...');
    try {
        const cisaCount = await ingestCISAThreats();
        const newsCount = await ingestMediaNews();
        
        const totalCount = cisaCount + newsCount;
        console.log(`[SyncService] Sync complete. ${totalCount} new threats ingested.`);
        
        return {
            success: true,
            cisaCount,
            newsCount,
            totalCount
        };
    } catch (error) {
        console.error('[SyncService] Sync failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
