const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        sponsorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true, min: 1 },
        note: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
