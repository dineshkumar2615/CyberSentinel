'use client';

import { useEffect, useRef } from 'react';

// 5 minute cooldown (in milliseconds)
const SYNC_COOLDOWN = 5 * 60 * 1000;

export default function SyncManager() {
    const lastSyncRef = useRef<number>(0);

    useEffect(() => {
        const triggerSync = async () => {
            const now = Date.now();
            
            // Check if we already synced recently in this session 
            // (or if another tab/instance did, though this is per-client-instance)
            const lastSync = localStorage.getItem('last_threat_sync');
            if (lastSync && now - parseInt(lastSync) < SYNC_COOLDOWN) {
                console.log('[SyncManager] Skipping sync: Last sync was less than 5 minutes ago.');
                return;
            }

            console.log('[SyncManager] Website reloaded. Initiating background sync...');
            
            try {
                const response = await fetch('/api/threats/sync', { method: 'POST' });
                if (response.ok) {
                    localStorage.setItem('last_threat_sync', now.toString());
                    console.log('[SyncManager] Background sync successful.');
                }
            } catch (error) {
                console.error('[SyncManager] Background sync failed:', error);
            }
        };

        // Delay the sync slightly to prioritize initial page load
        const timer = setTimeout(triggerSync, 3000);
        return () => clearTimeout(timer);
    }, []);

    // This component renders nothing
    return null;
}
