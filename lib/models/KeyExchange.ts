import mongoose from 'mongoose';

const KeyExchangeSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        index: true,
    },
    fromUser: {
        type: String,
        required: true,
    },
    toUser: {
        type: String,
        required: true,
    },
    encryptionKey: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
}, {
    timestamps: true,
});

// Index for efficient queries
KeyExchangeSchema.index({ toUser: 1, status: 1 });
KeyExchangeSchema.index({ chatId: 1 });

// Auto-delete expired key exchanges
KeyExchangeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const KeyExchangeModel = mongoose.models.KeyExchange || mongoose.model('KeyExchange', KeyExchangeSchema);

export default KeyExchangeModel;
