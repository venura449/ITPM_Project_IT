const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        location: { type: String, required: true, trim: true },
        faculty: {
            type: String,
            required: true,
            enum: ['Computing', 'Engineering', 'Business', 'Architecture', 'Humanities', 'Other'],
        },
        category: {
            type: String,
            required: true,
            enum: ['Sport', 'Workshop', 'Night / Cultural', 'Competition', 'Other'],
        },
        imageUrl: { type: String, trim: true, default: '' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'published'],
            default: 'pending',
        },
        budgetGoal:     { type: Number,  default: 0 },
        votingEnabled:  { type: Boolean, default: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
