/**
 * Secure Messenger Encryption Utilities
 * Uses Web Crypto API for AES-256-GCM encryption
 * Zero-knowledge: Keys are generated client-side and never stored
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// --- Key Generation ---

/**
 * Generate a new random AES-256 key
 * @returns Base64 encoded key
 */
export async function generateSessionKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
        {
            name: ALGORITHM,
            length: KEY_LENGTH,
        },
        true,
        ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
}

// --- Encryption / Decryption ---

/**
 * Encrypts a message with the provided session key
 * @returns Format: "iv:ciphertext" (Base64)
 */
export async function encryptMessage(
    plaintext: string,
    keyBase64: string
): Promise<string> {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await importKey(keyBase64);
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            key,
            data
        );

        return `${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(encrypted)}`;
    } catch (error) {
        console.error('Encryption Failed:', error);
        throw new Error('Encryption failed. Key might be invalid.');
    }
}

/**
 * Decrypts a message with the provided session key
 * @param encryptedPayload "iv:ciphertext"
 */
export async function decryptMessage(
    encryptedPayload: string,
    keyBase64: string
): Promise<string> {
    try {
        const [ivBase64, ciphertextBase64] = encryptedPayload.trim().split(':');
        if (!ivBase64 || !ciphertextBase64) throw new Error('Invalid payload format');

        const iv = base64ToArrayBuffer(ivBase64);
        const ciphertext = base64ToArrayBuffer(ciphertextBase64);
        const key = await importKey(keyBase64);

        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption Failed:', error);
        throw new Error('Decryption failed. Wrong key or corrupted data.');
    }
}

// --- Helpers ---

async function importKey(base64Key: string): Promise<CryptoKey> {
    const keyBuffer = base64ToArrayBuffer(base64Key);
    return crypto.subtle.importKey(
        'raw',
        keyBuffer,
        ALGORITHM,
        false,
        ['encrypt', 'decrypt']
    );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
}
