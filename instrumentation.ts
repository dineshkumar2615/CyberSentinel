export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // We use dynamic import to avoid issues with database connections 
        // and models during the early boot phase
        const { performFullSync } = await import('./lib/sync-service');
        
        console.log('----------------------------------------------------');
        console.log('🛡️  CyberSentinel Server Starting...');
        console.log('🛡️  Triggering automatic threat synchronization...');
        console.log('----------------------------------------------------');
        
        // Run in background to avoid blocking server start
        performFullSync().catch(err => {
            console.error('[Instrumentation] Background sync failed:', err);
        });
    }
}
