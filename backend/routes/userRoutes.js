const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/', protect, restrictTo('admin'), ctrl.listUsers);
router.get('/:id', protect, restrictTo('admin'), ctrl.getUser);
router.put('/:id', protect, restrictTo('admin'), ctrl.updateUser);
router.delete('/:id', protect, restrictTo('admin'), ctrl.deleteUser);

module.exports = router;
