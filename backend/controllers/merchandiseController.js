const MerchandiseService = require('../services/merchandiseService');

const listPublished = async (req, res) => {
    try {
        const items = await MerchandiseService.getPublished(req.query);
        res.json(items);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const listPending = async (req, res) => {
    try {
        const items = await MerchandiseService.getPending();
        res.json(items);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const listApproved = async (req, res) => {
    try {
        const items = await MerchandiseService.getApproved();
        res.json(items);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const create = async (req, res) => {
    try {
        const item = await MerchandiseService.create(req.user._id, req.body);
        res.status(201).json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const approve = async (req, res) => {
    try {
        const item = await MerchandiseService.approve(req.user._id, req.params.id);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const publish = async (req, res) => {
    try {
        const item = await MerchandiseService.publish(req.user._id, req.params.id);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const unpublish = async (req, res) => {
    try {
        const item = await MerchandiseService.unpublish(req.user._id, req.params.id);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const remove = async (req, res) => {
    try {
        await MerchandiseService.remove(req.user._id, req.user.role, req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const update = async (req, res) => {
    try {
        const item = await MerchandiseService.update(req.user._id, req.user.role, req.params.id, req.body);
        res.json(item);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { listPublished, listPending, listApproved, create, update, approve, publish, unpublish, remove };
