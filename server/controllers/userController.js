const User = require('../models/User');
const Task = require('../models/Task');
const { handleValidationErrors } = require('../middleware/validation');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Owner
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or Owner
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (role && req.user.role === 'admin') user.role = role;
    if (typeof isActive !== 'undefined' && req.user.role === 'admin') user.isActive = isActive;

    await user.save();

    res.json({
      status: 'success',
      user
    });
  } catch (error) {
    handleValidationErrors(error, req, res, () => {});
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Attempting to delete user with ID:', userId);

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('Found user:', user.name, user.email);

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    // Try to reassign tasks assigned to this user (if Task model exists)
    try {
      const Task = require('../models/Task');
      const updateResult = await Task.updateMany(
        { assignedTo: user._id },
        { $set: { assignedTo: null } }
      );
      console.log('Tasks updated:', updateResult.modifiedCount);
    } catch (taskError) {
      console.log('Task model not found or error updating tasks:', taskError.message);
      // Continue with user deletion even if task update fails
    }

    // Delete the user using findByIdAndDelete
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found or already deleted'
      });
    }

    console.log('User deleted successfully:', deletedUser.name);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Server error: ' + error.message
    });
  }
};