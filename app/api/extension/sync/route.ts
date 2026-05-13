import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import SecureMessage from '@/lib/models/SecureMessage';
import { getChannelId } from '@/lib/encryption_backend';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, key, alias, ciphertext, isMe, tag } = body;

        if (!username || !key || !ciphertext) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // 1. Find user by username (name or email, case-insensitive)
        const user = await User.findOne({ 
            $or: [
                { name: new RegExp(`^${username}$`, 'i') }, 
                { email: new RegExp(`^${username}$`, 'i') }
            ] 
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const channelId = getChannelId(key);

        // 2. Add to favorites if not exists
        const exists = user.favorites?.some((fav: any) => fav.key === key);
        if (!exists) {
            user.favorites = user.favorites || [];
            user.favorites.push({
                key,
                alias,
                channelId,
                addedAt: new Date(),
                platform: tag || 'web'
            });
            await user.save();
        }

        // 3. Save the message to SecureMessage collection
        // Since we are preserving Zero-Knowledge, we only store the ciphertext!
        // Calculate senderId (hash of email) to match Secure Messenger's deviceId logic
        const senderId = crypto.createHash('sha256').update(user.email.toLowerCase()).digest('hex');

        await SecureMessage.create({
            channelId,
            senderId: isMe ? senderId : 'external-user',
            encryptedPayload: ciphertext,
            clientMessageId: `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: Date.now(),
            tag: tag || 'web'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Extension Sync Error:', error);
        return NextResponse.json({ error: 'Failed to sync' }, { status: 500 });
    }
}
