import mongoose from 'mongoose';

const ScanHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    url: { type: String, required: true },
    riskScore: { type: Number, required: true },
    status: { type: String, required: true, enum: ['safe', 'suspicious', 'danger'] },
    flags: [{ type: String }],
    tld: { type: String },
    hosting: { type: String },
    ssl: { type: Boolean },
    timestamp: { type: Date, default: Date.now },
    visualAnalysis: {
        uuid: { type: String },
        screenshot: { type: String },
        screenshotData: { type: String },
        message: { type: String }
    }
});

// Avoid re-compilation of model in development
export default mongoose.models.ScanHistory || mongoose.model('ScanHistory', ScanHistorySchema);
