const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sponsorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Admin — sponsor CRUD
router.get('/', protect, restrictTo('admin'), ctrl.getAll);
router.post('/', protect, restrictTo('admin'), ctrl.createSponsor);
router.get('/invitations', protect, restrictTo('admin'), ctrl.getAllInvitations);
router.post('/auto-match', protect, restrictTo('admin'), ctrl.autoMatch);
router.post('/match/:eventId', protect, restrictTo('admin'), ctrl.matchEvent);
router.get('/all-donations', protect, restrictTo('admin'), ctrl.getAllDonations);
router.get('/event-donations/:eventId', protect, restrictTo('oc', 'admin'), ctrl.getEventDonations);
router.get('/:id', protect, restrictTo('admin'), ctrl.getById);
router.put('/:id', protect, restrictTo('admin'), ctrl.update);
router.delete('/:id', protect, restrictTo('admin'), ctrl.remove);

// Sponsor — their own routes
router.get('/me/profile', protect, restrictTo('sponsor'), ctrl.getMyProfile);
router.get('/me/invitations', protect, restrictTo('sponsor'), ctrl.getMyInvitations);
router.put('/me/invitations/:id/respond', protect, restrictTo('sponsor'), ctrl.respondInvitation);
router.post('/me/donate', protect, restrictTo('sponsor'), ctrl.donate);
router.get('/me/donations', protect, restrictTo('sponsor'), ctrl.getMyDonations);
router.post('/me/self-invite/:eventId', protect, restrictTo('sponsor'), ctrl.selfInvite);
router.get('/me/event-totals', protect, restrictTo('sponsor'), ctrl.getEventTotals);

module.exports = router;
