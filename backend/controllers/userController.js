const User = require('../models/User');
const Issue = require('../models/Issue');

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const {
      role,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Text search
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password -refreshTokens')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's issue statistics
    const issueStats = await Issue.aggregate([
      { $match: { reportedBy: user._id } },
      {
        $group: {
          _id: null,
          totalReported: { $sum: 1 },
          pendingIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          resolvedIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    const userWithStats = {
      ...user.toObject(),
      issueStats: issueStats[0] || {
        totalReported: 0,
        pendingIssues: 0,
        resolvedIssues: 0
      }
    };

    res.json({
      success: true,
      data: { user: userWithStats }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password updates through this endpoint
    delete updates.password;
    delete updates.refreshTokens;

    // Fields that can be updated by admin
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'address', 'role', 
      'isActive', 'isEmailVerified', 'preferences'
    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Activate/Deactivate user (admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const activeAdminCount = await User.countDocuments({ 
        role: 'admin', 
        isActive: true 
      });
      
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last active admin'
        });
      }
    }

    user.isActive = !user.isActive;
    
    // Clear refresh tokens when deactivating
    if (!user.isActive) {
      user.refreshTokens = [];
    }
    
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { 
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ 
        role: 'admin', 
        isActive: true 
      });
      
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin'
        });
      }
    }

    // Check if user has reported issues
    const issueCount = await Issue.countDocuments({ reportedBy: id });
    
    if (issueCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user who has reported ${issueCount} issue(s). Consider deactivating instead.`
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user statistics (admin only)
const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          regularUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyRegistrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const recentUsers = await User.find()
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          regularUsers: 0,
          verifiedUsers: 0
        },
        monthlyRegistrations,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's own issues
const getUserIssues = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    
    // Regular users can only view their own issues unless they're admin
    if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      status,
      category,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { reportedBy: userId };
    
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [issues, totalCount] = await Promise.all([
      Issue.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Issue.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user issues',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user preferences
 * @route PATCH /api/users/me/preferences
 * @access Private
 */
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications } = req.body;

    // Validate input
    if (!notifications) {
      return res.status(400).json({
        success: false,
        message: 'Notification preferences are required'
      });
    }

    // Find user and update preferences
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update notification preferences
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  getUserIssues,
  updateUserPreferences
};