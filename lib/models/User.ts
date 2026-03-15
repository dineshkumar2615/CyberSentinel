import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    image: {
        type: String,
    },
    lastLogin: {
        type: Date,
    },
    contacts: [{
        type: String, // Email addresses of contacts
    }],
    deviceKey: {
        type: String, // For encrypting local storage
        default: null,
    },
    favorites: [{
        key: {
            type: String,
            required: true,
        },
        alias: {
            type: String,
            required: true,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    savedThreats: [{
        threatId: {
            type: String, // Reference to Threat model's id field
            required: true,
        },
        savedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
