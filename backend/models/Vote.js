const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
    {
        event:             { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        voter:             { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
        contestantNumber:  { type: Number, required: true },
    },
    { timestamps: true }
);

voteSchema.index({ event: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
