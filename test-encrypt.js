const crypto = require('crypto');
async function run() {
    const keyStr = 'akash_key';
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    
    const key = await crypto.subtle.importKey('raw', hashBuffer, 'AES-GCM', false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode('This is a brand new test message');
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    
    const ivB64 = Buffer.from(iv).toString('base64');
    const encB64 = Buffer.from(encrypted).toString('base64');
    console.log(ivB64 + ':' + encB64);
}
run();
