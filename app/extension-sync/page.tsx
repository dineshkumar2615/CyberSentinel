'use client';

import { useEffect } from 'react';
import { saveSession, loadSession } from '@/lib/local-storage';

export default function ExtensionSyncPage() {
    useEffect(() => {
        const syncKeys = async () => {
            try {
                const sessionRes = await fetch('/api/auth/session');
                const sessionData = await sessionRes.json();
                
                if (sessionData?.user?.email) {
                    const favRes = await fetch('/api/favorites');
                    const favData = await favRes.json();
                    
                    if (favData.favorites && window.parent) {
                        window.parent.postMessage({
                            type: 'CYBER_KEYS_SYNC',
                            payload: {
                                favorites: favData.favorites,
                                email: sessionData.user.email
                            }
                        }, '*');
                    }
                }
            } catch (err) {
                console.error('Failed to sync favorites to extension:', err);
            }
        };
        syncKeys();

        const handleMessage = async (e: MessageEvent) => {
            // We expect a specific format from the extension
            if (e.data && e.data.type === 'CYBER_SYNC_MESSAGE') {
                try {
                    let { username, key, tag, alias, ciphertext, isMe, message: legacyMessage } = e.data.payload;
                    
                    if (!key) return;

                    // Fallback for extremely old cached extensions
                    if (!ciphertext && legacyMessage) {
                        ciphertext = legacyMessage.text;
                        isMe = legacyMessage.sender === 'me';
                    }

                    if (!ciphertext) return;

                    const formattedAlias = `${tag === 'whatsapp' ? 'WhatsApp' : tag === 'instagram' ? 'Instagram' : 'Web'} - ${alias || 'Session'}`;
                    
                    // Fallback to active web session if username wasn't provided by extension
                    if (!username) {
                        try {
                            const sessionRes = await fetch('/api/auth/session');
                            const sessionData = await sessionRes.json();
                            if (sessionData?.user?.email) {
                                username = sessionData.user.email;
                            }
                        } catch (e) {}
                    }

                    // 1. Send data to backend for DB persistence (Required because iframe localStorage is partitioned!)
                    if (username) {
                        try {
                            await fetch('/api/extension/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    username,
                                    key,
                                    alias: formattedAlias,
                                    ciphertext,
                                    isMe
                                })
                            });
                        } catch (apiError) {
                            console.error('Failed to sync to DB:', apiError);
                        }
                    }
                    
                    // Acknowledge receipt
                    if (window.parent) {
                        window.parent.postMessage({ type: 'CYBER_SYNC_ACK' }, '*');
                    }
                } catch (error) {
                    console.error('CyberSync Error:', error);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return null; // Silent iframe
}
