const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ocApplicationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Participant routes
router.get('/my-score', protect, ctrl.getMyScore);
router.post('/', protect, restrictTo('participant'), ctrl.apply);
router.get('/my', protect, ctrl.myApplications);

// Admin / OC routes
router.get('/', protect, restrictTo('admin', 'oc'), ctrl.allApplications);
router.put('/:id/status', protect, restrictTo('admin', 'oc'), ctrl.updateStatus);

module.exports = router;
