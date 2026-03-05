const mongoose = require('mongoose');

const scoreBreakdownSchema = new mongoose.Schema(
    {
        accountAgeScore: { type: Number, default: 0 },
        merchandiseScore: { type: Number, default: 0 },
        loginStreakScore: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    { _id: false }
);

const ocApplicationSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        eventName: { type: String, required: true, trim: true },
        motivation: { type: String, required: true, trim: true },
        score: { type: Number, required: true },
        scoreBreakdown: { type: scoreBreakdownSchema, required: true },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewNote: { type: String, default: '' },
    },
    { timestamps: true }
);

// One active (pending) application per student per event
ocApplicationSchema.index({ student: 1, eventName: 1 });

module.exports = mongoose.model('OCApplication', ocApplicationSchema);
