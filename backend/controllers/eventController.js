const svc = require('../services/eventService');

const ok = (res, data, status = 200) => res.status(status).json(data);
const fail = (res, err) => res.status(400).json({ message: err.message });

exports.listPublished = async (req, res) => {
    try { ok(res, await svc.getPublished(req.query)); } catch (e) { fail(res, e); }
};
exports.listPending = async (req, res) => {
    try { ok(res, await svc.getPending()); } catch (e) { fail(res, e); }
};
exports.listApproved = async (req, res) => {
    try { ok(res, await svc.getApproved()); } catch (e) { fail(res, e); }
};
exports.listAll = async (req, res) => {
    try { ok(res, await svc.getAll()); } catch (e) { fail(res, e); }
};
exports.create = async (req, res) => {
    try { ok(res, await svc.create(req.user._id, req.body), 201); } catch (e) { fail(res, e); }
};
exports.approve = async (req, res) => {
    try { ok(res, await svc.approve(req.user._id, req.params.id)); } catch (e) { fail(res, e); }
};
exports.publish = async (req, res) => {
    try { ok(res, await svc.publish(req.user._id, req.params.id)); } catch (e) { fail(res, e); }
};
exports.unpublish = async (req, res) => {
    try { ok(res, await svc.unpublish(req.user._id, req.params.id)); } catch (e) { fail(res, e); }
};
exports.update = async (req, res) => {
    try { ok(res, await svc.update(req.user._id, req.user.role, req.params.id, req.body)); } catch (e) { fail(res, e); }
};
exports.remove = async (req, res) => {
    try { await svc.remove(req.user._id, req.user.role, req.params.id); res.status(204).end(); } catch (e) { fail(res, e); }
};

// Registration
exports.register = async (req, res) => {
    try { ok(res, await svc.register(req.user._id, req.params.id), 201); } catch (e) { fail(res, e); }
};
exports.unregister = async (req, res) => {
    try { ok(res, await svc.unregister(req.user._id, req.params.id)); } catch (e) { fail(res, e); }
};
exports.registrations = async (req, res) => {
    try { ok(res, await svc.getRegistrationsByEvent(req.params.id)); } catch (e) { fail(res, e); }
};
exports.myRegistrations = async (req, res) => {
    try { ok(res, await svc.getMyRegistrations(req.user._id)); } catch (e) { fail(res, e); }
};
