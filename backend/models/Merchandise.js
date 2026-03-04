const mongoose = require('mongoose');

const sizeItemSchema = new mongoose.Schema(
    { size: { type: String, required: true }, quantity: { type: Number, required: true, min: 0 } },
    { _id: false }
);

const merchandiseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        faculty: { type: String, required: true, trim: true },
        event: { type: String, required: true, trim: true },
        batchYear: { type: Number, required: true },
        description: { type: String, required: true, trim: true },
        imageUrl: { type: String, trim: true, default: '' },
        sizeChart: { type: [sizeItemSchema], required: true },
        price: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['pending', 'approved', 'published'], default: 'pending' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Merchandise', merchandiseSchema);
