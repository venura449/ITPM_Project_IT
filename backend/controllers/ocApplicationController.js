const svc = require('../services/ocApplicationService');

const getMyScore = async (req, res) => {
    try {
        const score = await svc.computeScore(req.user._id);
        res.json(score);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const apply = async (req, res) => {
    try {
        const app = await svc.apply(req.user._id, req.body);
        res.status(201).json(app);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const myApplications = async (req, res) => {
    try {
        const apps = await svc.myApplications(req.user._id);
        res.json(apps);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const allApplications = async (req, res) => {
    try {
        const apps = await svc.allApplications();
        res.json(apps);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

const updateStatus = async (req, res) => {
    try {
        const app = await svc.updateStatus(req.params.id, req.body, req.user._id);
        res.json(app);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

module.exports = { getMyScore, apply, myApplications, allApplications, updateStatus };
