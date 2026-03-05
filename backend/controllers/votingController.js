const svc = require('../services/votingService');

const ok   = (res, data, code = 200) => res.status(code).json(data);
const fail = (res, err) => res.status(400).json({ message: err.message });

exports.getContest      = async (req, res) => { try { ok(res, await svc.getResults(req.params.eventId)); } catch (e) { fail(res, e); } };
exports.saveContestants = async (req, res) => { try { ok(res, await svc.saveContestants(req.params.eventId, req.body.contestants)); } catch (e) { fail(res, e); } };
exports.openVoting      = async (req, res) => { try { ok(res, await svc.openVoting(req.params.eventId)); } catch (e) { fail(res, e); } };
exports.closeVoting     = async (req, res) => { try { ok(res, await svc.closeVoting(req.params.eventId)); } catch (e) { fail(res, e); } };
exports.getAllContexts   = async (req, res) => { try { ok(res, await svc.getAllContexts(req.user._id)); } catch (e) { fail(res, e); } };
exports.castVote        = async (req, res) => { try { ok(res, await svc.castVote(req.user._id, req.params.eventId, req.body.contestantNumber), 201); } catch (e) { fail(res, e); } };
