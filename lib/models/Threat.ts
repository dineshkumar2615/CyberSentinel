import mongoose from 'mongoose';

const ThreatSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    imageUrl: { type: String },
    source: { type: String, required: true },
    referenceLink: { type: String },
    timestamp: { type: String, required: true },
    affectedSystems: [{ type: String }],
    prevention: [{
        title: { type: String, required: true },
        description: { type: String, required: true }
    }],
    recoverySteps: [{
        title: { type: String, required: true },
        description: { type: String, required: true }
    }],
    causes: [{
        title: { type: String, required: true },
        description: { type: String, required: true }
    }],
    risks: [{
        title: { type: String, required: true },
        description: { type: String, required: true }
    }],
    usefulVotes: { type: Number, default: 0 },
    confidenceScore: { type: Number },
    sourceType: { type: String, enum: ['mock', 'news', 'twitter', 'alienvault', 'portal'], default: 'mock' },
    originalId: { type: String, unique: true, sparse: true },
    isHighlighted: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }
});

// Check if the model already exists before creating a new one
export default mongoose.models.Threat || mongoose.model('Threat', ThreatSchema);
