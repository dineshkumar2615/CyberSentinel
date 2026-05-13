const mongoose = require('mongoose');
const SecureMessage = require('./lib/models/SecureMessage').default;
const dbConnect = require('./lib/db').default;

async function run() {
    await dbConnect();
    const msgs = await SecureMessage.find().sort({ timestamp: -1 }).limit(10);
    console.log(JSON.stringify(msgs, null, 2));
    process.exit(0);
}
run();
