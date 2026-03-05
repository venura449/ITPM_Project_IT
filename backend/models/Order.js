const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        merchandise: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchandise', required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        totalAmount: { type: Number, required: true },
        paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
        paymentReference: { type: String, default: '' },
        collected: { type: Boolean, default: false },
        timeSlot: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
