const Task = require('../models/Task');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for PDF only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 3 // Max 3 files
  },
  fileFilter
}).array('attachments', 3);

// Middleware to handle file upload
exports.handleFileUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    next();
  });
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, tags, estimatedHours, actualHours } = req.body;
    
    // Verify assigned user exists
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Assigned user not found'
        });
      }
    }

    const taskData = {
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate,
      assignedTo,
      createdBy: req.user._id,
      tags: tags || [],
      estimatedHours: estimatedHours || 0,
      actualHours: actualHours || 0
    };

    // Add attachments if uploaded
    if (req.files && req.files.length > 0) {
      taskData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
      }));
    }

    const task = await Task.create(taskData);
    
    // Populate the created task
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      status: 'success',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error in createTask:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating task'
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, sort, order, page = 1, limit = 10, assignedTo, createdBy } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;
    
    // Build sort
    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest first
    }
    
    // Pagination
    const skip = (page - 1) * parseInt(limit);
    
    const tasks = await Task.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    const total = await Task.countDocuments(filter);
    
    res.json({
      status: 'success',
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks
    });
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching tasks'
    });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    res.json({
      status: 'success',
      task
    });
  } catch (error) {
    console.error('Error in getTaskById:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo, tags, estimatedHours, actualHours } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    // Verify assigned user exists if assignedTo is being updated
    if (assignedTo && assignedTo !== task.assignedTo?.toString()) {
      const user = await User.findById(assignedTo);
      if (!user) {
        return res.status(400).json({
          status: 'error',
          message: 'Assigned user not found'
        });
      }
    }
    
    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (tags !== undefined) task.tags = tags;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    
    // Update the updatedAt field
    task.updatedAt = new Date();
    
    await task.save();
    
    // Populate the updated task
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error in updateTask:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    // Delete attachments from filesystem
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(attachment => {
        const filePath = path.resolve(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', attachment.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${attachment.filename}`);
          } catch (fileError) {
            console.error(`Error deleting file ${attachment.filename}:`, fileError);
          }
        }
      });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteTask:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting task'
    });
  }
};

// @desc    Upload attachments to task
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }
    
    // Check attachment limit
    const currentAttachments = task.attachments ? task.attachments.length : 0;
    if (currentAttachments + req.files.length > 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum of 3 attachments allowed per task'
      });
    }
    
    // Add new attachments
    const newAttachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype
    }));
    
    if (!task.attachments) {
      task.attachments = [];
    }
    
    task.attachments.push(...newAttachments);
    task.updatedAt = new Date();
    await task.save();
    
    // Populate the updated task
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      status: 'success',
      message: 'Attachments uploaded successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error in uploadAttachments:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while uploading attachments'
    });
  }
};

// @desc    Download attachment
// @route   GET /api/tasks/:id/attachments/:filename
// @access  Private
exports.downloadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    const attachment = task.attachments.find(
      att => att.filename === req.params.filename
    );
    
    if (!attachment) {
      return res.status(404).json({
        status: 'error',
        message: 'Attachment not found'
      });
    }
    
    const filePath = path.resolve(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 'error',
        message: 'File not found on server'
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    
    res.download(filePath, attachment.originalName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Error downloading file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in downloadAttachment:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Server error while downloading attachment'
      });
    }
  }
};

// @desc    Delete attachment
// @route   DELETE /api/tasks/:id/attachments/:filename
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    const attachmentIndex = task.attachments.findIndex(
      att => att.filename === req.params.filename
    );
    
    if (attachmentIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Attachment not found'
      });
    }
    
    // Remove file from filesystem
    const attachment = task.attachments[attachmentIndex];
    const filePath = path.resolve(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${attachment.filename}`);
      } catch (fileError) {
        console.error(`Error deleting file ${attachment.filename}:`, fileError);
      }
    }
    
    // Remove from task
    task.attachments.splice(attachmentIndex, 1);
    task.updatedAt = new Date();
    await task.save();
    
    // Populate the updated task
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({
      status: 'success',
      message: 'Attachment deleted successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error in deleteAttachment:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting attachment'
    });
  }
};