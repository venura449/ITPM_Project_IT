const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        company: { type: String, required: true, trim: true },
        website: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        categories: [{ type: String }],
        donationBudget: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);
