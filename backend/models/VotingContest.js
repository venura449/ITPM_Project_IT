const mongoose = require('mongoose');

const votingContestSchema = new mongoose.Schema(
    {
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
        contestants: [
            {
                number: { type: Number, required: true },
                name:   { type: String, required: true, trim: true },
            },
        ],
        status: { type: String, enum: ['draft', 'open', 'closed'], default: 'draft' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('VotingContest', votingContestSchema);
