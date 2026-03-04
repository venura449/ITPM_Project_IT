const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All authenticated users — published events
router.get('/', protect, ctrl.listPublished);
router.get('/my-registrations', protect, ctrl.myRegistrations);

// Admin: view all
router.get('/all', protect, restrictTo('admin'), ctrl.listAll);

// OC + Admin: manage events
router.get('/pending', protect, restrictTo('oc', 'admin'), ctrl.listPending);
router.get('/approved', protect, restrictTo('oc', 'admin'), ctrl.listApproved);
router.post('/', protect, restrictTo('oc', 'admin'), ctrl.create);
router.put('/:id', protect, restrictTo('oc', 'admin'), ctrl.update);
router.delete('/:id', protect, restrictTo('oc', 'admin'), ctrl.remove);

// Admin-only approval workflow
router.put('/:id/approve', protect, restrictTo('admin'), ctrl.approve);
router.put('/:id/publish', protect, restrictTo('admin'), ctrl.publish);
router.put('/:id/unpublish', protect, restrictTo('admin'), ctrl.unpublish);

// Registration — any authenticated user
router.post('/:id/register', protect, ctrl.register);
router.delete('/:id/register', protect, ctrl.unregister);
router.get('/:id/registrations', protect, restrictTo('oc', 'admin'), ctrl.registrations);

module.exports = router;
