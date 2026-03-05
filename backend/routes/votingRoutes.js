const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/votingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Must be BEFORE /:eventId to avoid being matched as a param
router.get('/contexts', protect, ctrl.getAllContexts);

// Admin — manage voting sessions
router.get('/:eventId',       protect, restrictTo('admin', 'oc'), ctrl.getContest);
router.post('/:eventId',      protect, restrictTo('admin'),       ctrl.saveContestants);
router.put('/:eventId/open',  protect, restrictTo('admin'),       ctrl.openVoting);
router.put('/:eventId/close', protect, restrictTo('admin'),       ctrl.closeVoting);

// Any authenticated user — cast vote
router.post('/:eventId/vote', protect, ctrl.castVote);

module.exports = router;
