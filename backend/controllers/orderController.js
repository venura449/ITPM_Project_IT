const OrderService = require('../services/orderService');

const purchase = async (req, res) => {
    try {
        const order = await OrderService.purchase(req.user._id, req.body);
        res.status(201).json(order);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const myOrders = async (req, res) => {
    try {
        const orders = await OrderService.myOrders(req.user._id);
        res.json(orders);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const myUncollectedCount = async (req, res) => {
    try {
        const count = await OrderService.myUncollectedCount(req.user._id);
        res.json({ count });
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const markCollected = async (req, res) => {
    try {
        const order = await OrderService.markCollected(req.params.id);
        res.json(order);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const allOrders = async (req, res) => {
    try {
        const orders = await OrderService.allOrders();
        res.json(orders);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const assignTimeSlots = async (req, res) => {
    try {
        const orders = await OrderService.assignTimeSlots(req.body);
        res.json(orders);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const slotOrders = async (req, res) => {
    try {
        const { merchandiseId } = req.query;
        const orders = await OrderService.slotOrders(merchandiseId);
        res.json(orders);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { purchase, myOrders, myUncollectedCount, markCollected, allOrders, assignTimeSlots, slotOrders };
