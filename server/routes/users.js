const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { 
  authenticate, 
  authorize, 
  checkResourceOwnership 
} = require('../middleware/auth');
const { 
  validateUserUpdate, 
  handleValidationErrors 
} = require('../middleware/validation');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin or Owner
router.get('/:id', authenticate, checkResourceOwnership('_id'), userController.getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin or Owner
router.put(
  '/:id', 
  authenticate, 
  checkResourceOwnership('_id'), 
  validateUserUpdate, 
  handleValidationErrors, 
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

module.exports = router;