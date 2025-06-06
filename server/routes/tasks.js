const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { 
  authenticate, 
  authorize, 
  checkResourceOwnership 
} = require('../middleware/auth');
const { 
  validateTaskCreation, 
  validateTaskUpdate, 
  validateTaskQuery, 
  handleValidationErrors 
} = require('../middleware/validation');

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/', 
  authenticate, 
  taskController.handleFileUpload, 
  validateTaskCreation, 
  handleValidationErrors, 
  taskController.createTask
);

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get(
  '/', 
  authenticate, 
  validateTaskQuery, 
  handleValidationErrors, 
  taskController.getAllTasks
);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get(
  '/:id', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  taskController.getTaskById
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put(
  '/:id', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  validateTaskUpdate, 
  handleValidationErrors, 
  taskController.updateTask
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete(
  '/:id', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  taskController.deleteTask
);

// @route   POST /api/tasks/:id/attachments
// @desc    Upload attachments to task
// @access  Private
router.post(
  '/:id/attachments', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  taskController.handleFileUpload, 
  taskController.uploadAttachments
);

// @route   GET /api/tasks/:id/attachments/:filename
// @desc    Download attachment
// @access  Private
router.get(
  '/:id/attachments/:filename', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  taskController.downloadAttachment
);

// @route   DELETE /api/tasks/:id/attachments/:filename
// @desc    Delete attachment
// @access  Private
router.delete(
  '/:id/attachments/:filename', 
  authenticate, 
  checkResourceOwnership('createdBy'), 
  taskController.deleteAttachment
);

module.exports = router;