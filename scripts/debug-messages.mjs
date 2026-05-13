import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://dinesh026150:MongoDB2615@cybersentinal.cxrq6ea.mongodb.net/cybersentinel?appName=CyberSentinal';

const SecureMessageSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const SecureMessage = mongoose.model('SecureMessage', SecureMessageSchema, 'securemessages');
const User = mongoose.model('User', UserSchema, 'users');

async function debug() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check SecureMessage collection
    const totalMessages = await SecureMessage.countDocuments();
    console.log(`\n📬 Total SecureMessages in DB: ${totalMessages}`);

    if (totalMessages > 0) {
        const msgs = await SecureMessage.find({}).sort({ timestamp: -1 }).limit(5).lean();
        console.log('\n🔍 Last 5 messages:');
        msgs.forEach((m, i) => {
            console.log(`\n--- Message ${i+1} ---`);
            console.log('  channelId:', m.channelId);
            console.log('  senderId:', m.senderId);
            console.log('  tag:', m.tag);
            console.log('  timestamp:', m.timestamp);
            console.log('  payload (first 30):', m.encryptedPayload?.substring(0, 30) + '...');
        });
    }

    // Check users with favorites
    const users = await User.find({ 'favorites.0': { $exists: true } }).lean();
    console.log(`\n👤 Users with favorites: ${users.length}`);
    users.forEach(u => {
        console.log(`\n  Email: ${u.email}`);
        (u.favorites || []).forEach((f, i) => {
            console.log(`    Fav ${i+1}: alias="${f.alias}" key="${f.key?.substring(0,10)}..." channelId="${f.channelId?.substring(0,16)}..."`);
        });
    });

    await mongoose.disconnect();
}

debug().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
