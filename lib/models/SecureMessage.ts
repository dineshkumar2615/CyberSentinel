import mongoose from 'mongoose';

const SecureMessageSchema = new mongoose.Schema({
    channelId: {
        type: String,
        required: true,
        index: true,
    },
    senderId: {
        type: String,
        required: true,
    },
    encryptedPayload: {
        type: String,
        required: true,
    },
    clientMessageId: {
        type: String,
        index: true,
    },
    timestamp: {
        type: Number,
        default: () => Date.now(),
    }
});

// Auto-delete messages after 24 hours to ensure perfect forward secrecy
SecureMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

const SecureMessageModel = mongoose.models.SecureMessage || mongoose.model('SecureMessage', SecureMessageSchema);

export default SecureMessageModel;
