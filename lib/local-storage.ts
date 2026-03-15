/**
 * Local Storage for Secure Messenger
 * Stores chat history encrypted with the Session Key itself
 * (So you can only read history if you re-enter the correct Key)
 */

import { encryptMessage, decryptMessage } from './encryption';

const STORAGE_PREFIX = 'secure_messenger_v1_';

export interface ChatSession {
    messages: ChatMessage[];
    lastUpdated: number;
}

export interface ChatMessage {
    id: string;
    sender: 'me' | 'them';
    text: string;
    timestamp: number;
    senderId?: string;
    isDecrypted?: boolean;
}

/**
 * hashKey - Creates a deterministic ID from the session key
 * to use as the localStorage key. This way, the key is not stored raw,
 * but valid keys maps to the same storage slot.
 */
async function hashKey(keyBase64: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(keyBase64);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Save chat history (Encrypts the whole history with the session key)
 */
export async function saveSession(keyBase64: string, messages: ChatMessage[]) {
    try {
        const id = await hashKey(keyBase64);
        const data = JSON.stringify({ messages, lastUpdated: Date.now() });

        // We encrypt the storage content with the key itself!
        // This ensures even if someone dumps localStorage, they can't read it
        // without the key (which is not stored).
        const encryptedData = await encryptMessage(data, keyBase64);

        localStorage.setItem(STORAGE_PREFIX + id, encryptedData);
        return true;
    } catch (e) {
        console.error('Save failed', e);
        return false;
    }
}

/**
 * Load chat history
 */
export async function loadSession(keyBase64: string): Promise<ChatSession | null> {
    try {
        const id = await hashKey(keyBase64);
        const encryptedData = localStorage.getItem(STORAGE_PREFIX + id);

        if (!encryptedData) return null;

        const decryptedJson = await decryptMessage(encryptedData, keyBase64);
        return JSON.parse(decryptedJson) as ChatSession;
    } catch (e) {
        console.error('Load failed (Key might be wrong)', e);
        return null; // Implicitly returns null if key is wrong (decryption fails)
    }
}

/**
 * Delete session
 */
export async function deleteSession(keyBase64: string) {
    const id = await hashKey(keyBase64);
    localStorage.removeItem(STORAGE_PREFIX + id);
}

/**
 * Clear all messenger data
 */
/**
 * Clear all messenger data
 */
export function nukeAllData() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            localStorage.removeItem(key);
        }
    }
    localStorage.removeItem('secure_messenger_favs');
}

// --- Favorites Management ---

export interface FavoriteSession {
    key: string;
    alias: string;
    addedAt: number;
}

const FAV_STORAGE_KEY = 'secure_messenger_favs';

// Helper to get localStorage favorites
function getLocalFavorites(): FavoriteSession[] {
    try {
        const data = localStorage.getItem(FAV_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Helper to save to localStorage
function saveLocalFavorites(favs: FavoriteSession[]) {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
}

// Get favorites - uses API if authenticated, localStorage otherwise
export async function getFavorites(isAuthenticated: boolean = false): Promise<FavoriteSession[]> {
    if (isAuthenticated) {
        try {
            const response = await fetch('/api/favorites');
            if (response.ok) {
                const data = await response.json();
                return data.favorites.map((fav: any) => ({
                    key: fav.key,
                    alias: fav.alias,
                    addedAt: new Date(fav.addedAt).getTime()
                }));
            }
        } catch (error) {
            console.error('Failed to fetch favorites from API:', error);
        }
    }
    return getLocalFavorites();
}

// Save favorite - uses API if authenticated, localStorage otherwise
export async function saveFavorite(key: string, alias?: string, isAuthenticated: boolean = false): Promise<boolean> {
    const favoriteAlias = alias || `Session ${key.substring(0, 6)}...`;

    if (isAuthenticated) {
        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, alias: favoriteAlias })
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to save favorite to API:', error);
            return false;
        }
    }

    // Fallback to localStorage
    const favs = getLocalFavorites();
    if (favs.some(f => f.key === key)) return true; // Already exists

    const newFav: FavoriteSession = {
        key,
        alias: favoriteAlias,
        addedAt: Date.now()
    };

    saveLocalFavorites([...favs, newFav]);
    return true;
}

// Remove favorite - uses API if authenticated, localStorage otherwise
export async function removeFavorite(key: string, isAuthenticated: boolean = false): Promise<boolean> {
    if (isAuthenticated) {
        try {
            const response = await fetch(`/api/favorites?key=${encodeURIComponent(key)}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to remove favorite from API:', error);
            return false;
        }
    }

    // Fallback to localStorage
    const favs = getLocalFavorites();
    const filtered = favs.filter(f => f.key !== key);
    saveLocalFavorites(filtered);
    return true;
}

// Check if a key is favorited
export async function isFavorite(key: string, isAuthenticated: boolean = false): Promise<boolean> {
    const favs = await getFavorites(isAuthenticated);
    return favs.some(f => f.key === key);
}
