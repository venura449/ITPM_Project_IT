const Order = require('../models/Order');
const Merchandise = require('../models/Merchandise');

const purchase = async (studentId, { merchandiseId, size, quantity = 1 }) => {
    if (!merchandiseId || !size) throw new Error('Merchandise and size are required');
    const item = await Merchandise.findById(merchandiseId);
    if (!item || item.status !== 'published') throw new Error('Merchandise not available');

    const sizeEntry = item.sizeChart.find(s => s.size === size);
    if (!sizeEntry) throw new Error('Selected size not available');
    if (sizeEntry.quantity < quantity) throw new Error('Insufficient stock for selected size');

    // Deduct stock
    sizeEntry.quantity -= quantity;
    await item.save();

    const paymentReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const order = await Order.create({
        student: studentId,
        merchandise: merchandiseId,
        size,
        quantity,
        totalAmount: item.price * quantity,
        paymentStatus: 'paid',
        paymentReference,
        collected: false,
    });
    return Order.findById(order._id).populate('merchandise', 'title faculty event price imageUrl');
};

const myOrders = async (studentId) =>
    Order.find({ student: studentId })
        .populate('merchandise', 'title faculty event price imageUrl')
        .sort('-createdAt');

const myUncollectedCount = async (studentId) =>
    Order.countDocuments({ student: studentId, paymentStatus: 'paid', collected: false });

const markCollected = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    order.collected = true;
    await order.save();
    return order;
};

const allOrders = async () =>
    Order.find()
        .populate('student', 'name email')
        .populate('merchandise', 'title faculty event')
        .sort('-createdAt');

module.exports = { purchase, myOrders, myUncollectedCount, markCollected, allOrders };
