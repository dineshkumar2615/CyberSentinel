import crypto from 'crypto';

/**
 * Creates a deterministic ID from the session key (Base64)
 * to use as the channel descriptor in the database.
 * This is the server-side version of hashKey from local-storage.ts
 */
export function getChannelId(keyBase64: string): string {
    return crypto.createHash('sha256').update(keyBase64).digest('hex');
}
