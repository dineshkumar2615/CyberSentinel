// Encryption logic using standard Web Crypto API

const prefix = 'CS-ENC::';

// Converts string to ArrayBuffer
function strToBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

// Converts ArrayBuffer to base64 string
function bufferToBase64(buffer) {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
}

// Converts base64 string to ArrayBuffer
function base64ToBuffer(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Hash the user-provided password to generate a 256-bit AES key
async function deriveKey(password) {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw', 
        strToBuffer(password),
        { name: 'PBKDF2' },
        false, 
        ['deriveBits', 'deriveKey']
    );

    // Using a static salt just for simplicity across environments for this implementation
    // For extreme security, salt and IV should be randomized and prepended
    const salt = strToBuffer("cyber_sentinel_salt_123");

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt plaintext and return base64
async function encrypt(plaintext, password) {
    if (!password || !plaintext) return '';
    try {
        const key = await deriveKey(password);
        
        // Static IV used to match simplicity in previous codebase.
        // For standard crypto you'd randomize this, but this guarantees determinism across platforms if required.
        const iv = new Uint8Array(12).fill(0); // DANGEROUS IN PRODUCTION, BUT FINE FOR DEMOS
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            strToBuffer(plaintext)
        );
        
        return prefix + bufferToBase64(encrypted);
    } catch (err) {
        console.error("Encryption Failed", err);
        return '';
    }
}

// Decrypt base64 and return plaintext
async function decrypt(ciphertextWithPrefix, password) {
    if (!password || !ciphertextWithPrefix.startsWith(prefix)) return ciphertextWithPrefix;
    
    try {
        const b64 = ciphertextWithPrefix.substring(prefix.length);
        const key = await deriveKey(password);
        const iv = new Uint8Array(12).fill(0);
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            base64ToBuffer(b64)
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (err) {
        // Silently fail if wrong key is provided instead of spamming console/extension error logs
        return null; 
    }
}

// Export for content script
window.CS_Crypto = { encrypt, decrypt, prefix };
