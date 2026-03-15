import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
    isMaintenanceMode: {
        type: Boolean,
        default: false,
    },
    maintenanceMessage: {
        type: String,
        default: "System upgrade in progress. CyberSentinel will be back online shortly.",
    },
    maintenanceStart: {
        type: Date,
        default: null,
    },
    maintenanceEnd: {
        type: Date,
        default: null,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
