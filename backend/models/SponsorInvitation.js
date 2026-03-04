const mongoose = require('mongoose');

const sponsorInvitationSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        sponsorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        respondedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

sponsorInvitationSchema.index({ event: 1, sponsorUser: 1 }, { unique: true });

module.exports = mongoose.model('SponsorInvitation', sponsorInvitationSchema);
