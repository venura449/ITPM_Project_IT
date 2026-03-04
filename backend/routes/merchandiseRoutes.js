const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/merchandiseController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public (authenticated) — all roles can view published items
router.get('/', protect, ctrl.listPublished);

// OC + admin — manage packs
router.get('/pending', protect, restrictTo('oc', 'admin'), ctrl.listPending);
router.get('/approved', protect, restrictTo('oc', 'admin'), ctrl.listApproved);
router.post('/', protect, restrictTo('oc', 'admin'), ctrl.create);
router.put('/:id/approve', protect, restrictTo('admin'), ctrl.approve);
router.put('/:id/publish', protect, restrictTo('oc', 'admin'), ctrl.publish);
router.put('/:id/unpublish', protect, restrictTo('oc', 'admin'), ctrl.unpublish);
router.put('/:id', protect, restrictTo('oc', 'admin'), ctrl.update);
router.delete('/:id', protect, restrictTo('oc', 'admin'), ctrl.remove);

module.exports = router;
