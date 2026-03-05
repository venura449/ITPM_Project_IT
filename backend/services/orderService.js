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

/**
 * FIFO Time-Slot Scheduling Algorithm
 *
 * 1. Fetch all paid orders (optionally filtered by merchandise).
 * 2. Sort by createdAt ASC  →  First-In, First-Out order.
 * 3. Divide into groups of `itemsPerSlot`.
 * 4. Each group gets a time slot = startDate + (groupIndex × slotDurationMs).
 * 5. Persist via a single bulkWrite for efficiency.
 */
const assignTimeSlots = async ({ startDate, slotDurationMinutes, itemsPerSlot, merchandiseId }) => {
    if (!startDate) throw new Error('Start date is required');
    const items = Math.max(1, parseInt(itemsPerSlot) || 1);
    const duration = Math.max(1, parseInt(slotDurationMinutes) || 30);

    const query = { paymentStatus: 'paid' };
    if (merchandiseId) query.merchandise = merchandiseId;

    // Step 1 & 2: fetch and sort FIFO
    const orders = await Order.find(query).sort('createdAt');

    // Step 3 & 4: compute slot for each order
    const start = new Date(startDate);
    const slotMs = duration * 60 * 1000;

    const bulkOps = orders.map((order, i) => {
        const slotIndex = Math.floor(i / items);
        const slotTime = new Date(start.getTime() + slotIndex * slotMs);
        return {
            updateOne: {
                filter: { _id: order._id },
                update: { $set: { timeSlot: slotTime } },
            },
        };
    });

    // Step 5: persist
    if (bulkOps.length > 0) await Order.bulkWrite(bulkOps);

    return Order.find(query)
        .populate('student', 'name email')
        .populate('merchandise', 'title faculty event imageUrl')
        .sort({ timeSlot: 1, createdAt: 1 });
};

// Return all paid orders (optionally filtered) sorted by timeSlot then createdAt
const slotOrders = async (merchandiseId) => {
    const query = { paymentStatus: 'paid' };
    if (merchandiseId) query.merchandise = merchandiseId;
    return Order.find(query)
        .populate('student', 'name email')
        .populate('merchandise', 'title faculty event imageUrl')
        .sort({ timeSlot: 1, createdAt: 1 });
};

module.exports = { purchase, myOrders, myUncollectedCount, markCollected, allOrders, assignTimeSlots, slotOrders };
