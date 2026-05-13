import mongoose from 'mongoose';
import crypto from 'crypto';

const MONGODB_URI = 'mongodb+srv://dinesh026150:MongoDB2615@cybersentinal.cxrq6ea.mongodb.net/cybersentinel?appName=CyberSentinal';

const SecureMessageSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const SecureMessage = mongoose.model('SecureMessage', SecureMessageSchema, 'securemessages');
const User = mongoose.model('User', UserSchema, 'users');

async function debug() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all favorites for dinesh
    const user = await User.findOne({ email: 'dinesh@gmail.com' }).lean();
    const favorites = user?.favorites || [];
    
    console.log('=== FAVORITES ===');
    for (const fav of favorites) {
        const channelId = crypto.createHash('sha256').update(fav.key).digest('hex');
        const matches = channelId === fav.channelId;
        console.log(`Alias: "${fav.alias}"`);
        console.log(`  key (first 20): ${fav.key?.substring(0, 20)}`);
        console.log(`  stored channelId: ${fav.channelId}`);
        console.log(`  recomputed channelId: ${channelId}`);
        console.log(`  ✅ MATCH: ${matches}`);
        
        // Find messages for this channel
        const msgs = await SecureMessage.countDocuments({ channelId: fav.channelId });
        const recomputedMsgs = await SecureMessage.countDocuments({ channelId });
        console.log(`  Messages in DB (by stored channelId): ${msgs}`);
        console.log(`  Messages in DB (by recomputed channelId): ${recomputedMsgs}`);
        console.log('');
    }

    // Show ALL distinct channelIds in the messages collection
    const channels = await SecureMessage.aggregate([
        { $group: { _id: '$channelId', count: { $sum: 1 }, lastTimestamp: { $max: '$timestamp' } } },
        { $sort: { lastTimestamp: -1 } }
    ]);
    
    console.log('=== ALL CHANNELS WITH MESSAGES ===');
    channels.forEach(c => {
        const isFav = favorites.some(f => f.channelId === c._id);
        console.log(`channelId: ${c._id} | count: ${c.count} | ${isFav ? '⭐ IS A FAVORITE' : '(not a favorite)'}`);
    });

    await mongoose.disconnect();
}

debug().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
