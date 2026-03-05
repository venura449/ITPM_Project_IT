const svc = require('../services/sponsorService');

const ok = (res, data, code = 200) => res.status(code).json(data);
const fail = (res, err) => res.status(400).json({ message: err.message });

exports.createSponsor = async (req, res) => {
    try { ok(res, await svc.createSponsor(req.body), 201); } catch (e) { fail(res, e); }
};
exports.getAll = async (req, res) => {
    try { ok(res, await svc.getAll()); } catch (e) { fail(res, e); }
};
exports.getById = async (req, res) => {
    try { ok(res, await svc.getById(req.params.id)); } catch (e) { fail(res, e); }
};
exports.update = async (req, res) => {
    try { ok(res, await svc.update(req.params.id, req.body)); } catch (e) { fail(res, e); }
};
exports.remove = async (req, res) => {
    try { await svc.remove(req.params.id); res.status(204).end(); } catch (e) { fail(res, e); }
};
exports.matchEvent = async (req, res) => {
    try { ok(res, await svc.matchEventToSponsors(req.params.eventId)); } catch (e) { fail(res, e); }
};
exports.autoMatch = async (req, res) => {
    try { ok(res, await svc.autoMatchAll()); } catch (e) { fail(res, e); }
};
exports.getAllInvitations = async (req, res) => {
    try { ok(res, await svc.getAllInvitations()); } catch (e) { fail(res, e); }
};
exports.getMyInvitations = async (req, res) => {
    try { ok(res, await svc.getInvitationsForSponsor(req.user._id)); } catch (e) { fail(res, e); }
};
exports.respondInvitation = async (req, res) => {
    try { ok(res, await svc.respondToInvitation(req.user._id, req.params.id, req.body.status)); } catch (e) { fail(res, e); }
};
exports.donate = async (req, res) => {
    try { ok(res, await svc.donate(req.user._id, req.body.eventId, req.body.amount, req.body.note), 201); } catch (e) { fail(res, e); }
};
exports.getMyDonations = async (req, res) => {
    try { ok(res, await svc.getMyDonations(req.user._id)); } catch (e) { fail(res, e); }
};
exports.getEventDonations = async (req, res) => {
    try { ok(res, await svc.getDonationsForEvent(req.params.eventId)); } catch (e) { fail(res, e); }
};
exports.getAllDonations = async (req, res) => {
    try { ok(res, await svc.getAllDonations()); } catch (e) { fail(res, e); }
};
exports.getMyProfile = async (req, res) => {
    try { ok(res, await svc.getBySponsorUserId(req.user._id)); } catch (e) { fail(res, e); }
};
exports.selfInvite = async (req, res) => {
    try { ok(res, await svc.selfInvite(req.user._id, req.params.eventId), 201); } catch (e) { fail(res, e); }
};
exports.getEventTotals = async (req, res) => {
    try { ok(res, await svc.getEventTotals()); } catch (e) { fail(res, e); }
};
