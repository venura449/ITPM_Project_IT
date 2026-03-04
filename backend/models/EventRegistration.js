const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
    },
    { timestamps: true }
);

// One registration per student per event
eventRegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
