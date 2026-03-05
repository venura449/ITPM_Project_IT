const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, ctrl.purchase);
router.get('/my', protect, ctrl.myOrders);
router.get('/my/uncollected', protect, ctrl.myUncollectedCount);
router.get('/all', protect, restrictTo('admin', 'oc'), ctrl.allOrders);
router.get('/slots', protect, restrictTo('admin', 'oc'), ctrl.slotOrders);
router.post('/assign-slots', protect, restrictTo('admin', 'oc'), ctrl.assignTimeSlots);
router.put('/:id/collect', protect, restrictTo('admin', 'oc'), ctrl.markCollected);

module.exports = router;
