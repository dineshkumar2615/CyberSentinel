const crypto = require('crypto');
async function run() {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode('akash_key'));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    console.log(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
}
run();
