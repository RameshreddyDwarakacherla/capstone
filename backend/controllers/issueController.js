const Issue = require('../models/Issue');
const User = require('../models/User');
const aiService = require('../utils/aiService');
const { reverseGeocode, validateCoordinates } = require('../utils/geocoding');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

// Create new issue
const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      address
    } = req.body;

    // Validate coordinates
    if (!validateCoordinates(location.coordinates[0], location.coordinates[1])) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Process uploaded images
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          let imageData;
          
          // Handle Cloudinary upload (production) vs local upload (development)
          if (file.path && file.path.includes('cloudinary')) {
            // Cloudinary upload
            imageData = {
              url: file.path,
              publicId: file.filename,
              originalName: file.originalname,
              size: file.size
            };
          } else {
            // Local upload - upload to Cloudinary if configured
            if (process.env.CLOUDINARY_CLOUD_NAME) {
              const cloudinaryResult = await uploadImage(file.path);
              imageData = {
                url: cloudinaryResult.url,
                publicId: cloudinaryResult.publicId,
                originalName: file.originalname,
                size: file.size
              };
            } else {
              // Keep local file
              imageData = {
                url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
                publicId: file.filename,
                originalName: file.originalname,
                size: file.size
              };
            }
          }

          // Generate AI description for the image
          if (aiService.isAvailable()) {
            try {
              const aiDescription = await aiService.generateImageDescription(imageData.url);
              imageData.aiDescription = aiDescription;
            } catch (aiError) {
              console.error('AI description generation failed:', aiError);
              imageData.aiDescription = 'AI description unavailable';
            }
          }

          processedImages.push(imageData);
        } catch (imageError) {
          console.error('Image processing error:', imageError);
          // Don't let image processing errors stop issue creation
        }
      }
    }

    // Get address from coordinates if not provided
    let finalAddress = address;
    if (!address || (!address.street && !address.city)) {
      try {
        finalAddress = await reverseGeocode(
          location.coordinates[0], // longitude
          location.coordinates[1]  // latitude
        );
      } catch (geocodeError) {
        console.error('Reverse geocoding failed:', geocodeError);
        finalAddress = address || {};
      }
    }

    // Create issue object
    const issueData = {
      title,
      description,
      category,
      priority: priority || 'medium',
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
      address: finalAddress,
      images: processedImages,
      reportedBy: req.user._id,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        reportingMethod: 'web'
      }
    };

    // Get AI analysis if available and images exist
    if (aiService.isAvailable() && processedImages.length > 0) {
      try {
        const aiAnalysis = await aiService.analyzeImage(processedImages[0].url);
        if (aiAnalysis) {
          issueData.aiAnalysis = aiAnalysis;
          
          // Use AI suggested category if current category is 'other'
          if (category === 'other' && aiAnalysis.suggestedCategory && aiAnalysis.suggestedCategory !== 'other') {
            issueData.category = aiAnalysis.suggestedCategory;
          }
          
          // Update priority based on AI analysis if not explicitly set
          if (!priority || priority === 'medium') {
            const estimatedPriority = await aiService.estimatePriority(
              issueData.category, 
              description, 
              aiAnalysis
            );
            issueData.priority = estimatedPriority;
          }
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        // Don't let AI failures stop issue creation
      }
    }

    // Create and save issue
    const issue = new Issue(issueData);
    await issue.save();

    // Populate the response with user data
    await issue.populate('reportedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Create issue error:', error);
    
    // Clean up uploaded images if issue creation fails
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          if (file.filename && process.env.CLOUDINARY_CLOUD_NAME) {
            await deleteImage(file.filename);
          }
        } catch (cleanupError) {
          console.error('Image cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all issues with filtering and pagination
const getIssues = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      reportedBy,
      assignedTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude,
      longitude,
      radius = 5000, // 5km default
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (reportedBy) filter.reportedBy = reportedBy;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Only show public issues to regular users, unless they're viewing their own
    if (req.user.role !== 'admin') {
      filter.$or = [
        { isPublic: true },
        { reportedBy: req.user._id }
      ];
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Pagination - allow higher limits for admins
    const pageNum = Math.max(1, parseInt(page));
    const maxLimit = req.user.role === 'admin' ? 1000 : 100;
    const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let issues, totalCount;

    // Handle geospatial queries separately since $near doesn't work with sort
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusMeters = parseInt(radius);

      if (validateCoordinates(lng, lat)) {
        // Use $geoWithin for location filtering when we need custom sorting
        const geoFilter = {
          ...filter,
          location: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radiusMeters / 6378137] // radius in radians
            }
          }
        };

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute geospatial query
        [issues, totalCount] = await Promise.all([
          Issue.find(geoFilter)
            .populate('reportedBy', 'firstName lastName email')
            .populate('assignedTo', 'firstName lastName email')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean(),
          Issue.countDocuments(geoFilter)
        ]);
      } else {
        // Invalid coordinates, return empty results
        issues = [];
        totalCount = 0;
      }
    } else {
      // Regular query without geospatial filtering
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute regular query
      [issues, totalCount] = await Promise.all([
        Issue.find(filter)
          .populate('reportedBy', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Issue.countDocuments(filter)
      ]);
    }

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
    console.error('Get issues error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get single issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const issue = await Issue.findById(id)
      .populate('reportedBy', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('adminNotes.addedBy', 'firstName lastName')
      .populate('statusHistory.changedBy', 'firstName lastName');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        !issue.isPublic && 
        !issue.reportedBy._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Filter admin notes for non-admin users
    if (req.user.role !== 'admin') {
      issue.adminNotes = issue.adminNotes.filter(note => note.isPublic);
    }

    res.json({
      success: true,
      data: { issue }
    });
  } catch (error) {
    console.error('Get issue by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update issue (admin only)
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedTo,
      adminNote,
      isPublic,
      estimatedResolutionTime
    } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Update fields
    if (status && status !== issue.status) {
      issue.status = status;
    }
    
    if (priority) {
      issue.priority = priority;
    }
    
    if (assignedTo) {
      // Verify assignedTo user exists and is admin
      const assignee = await User.findById(assignedTo);
      if (!assignee || assignee.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Invalid assignee - user must be an admin'
        });
      }
      issue.assignedTo = assignedTo;
    }
    
    if (isPublic !== undefined) {
      issue.isPublic = isPublic;
    }
    
    if (estimatedResolutionTime) {
      issue.estimatedResolutionTime = estimatedResolutionTime;
    }

    // Add admin note if provided
    if (adminNote && adminNote.trim()) {
      issue.adminNotes.push({
        note: adminNote.trim(),
        addedBy: req.user._id,
        isPublic: req.body.noteIsPublic || false
      });
    }

    await issue.save();

    // Populate response
    await issue.populate([
      { path: 'reportedBy', select: 'firstName lastName email' },
      { path: 'assignedTo', select: 'firstName lastName email' },
      { path: 'adminNotes.addedBy', select: 'firstName lastName' }
    ]);

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete issue (admin only)
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Delete associated images from cloud storage
    if (issue.images && issue.images.length > 0) {
      for (const image of issue.images) {
        try {
          if (image.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
            await deleteImage(image.publicId);
          }
        } catch (imageError) {
          console.error('Image deletion error:', imageError);
          // Continue with issue deletion even if image deletion fails
        }
      }
    }

    await Issue.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vote on issue
const voteOnIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up', 'down', or 'remove'

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Users can't vote on their own issues
    if (issue.reportedBy.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own issue'
      });
    }

    await issue.vote(req.user._id, voteType);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        upvotes: issue.upvoteCount,
        downvotes: issue.downvoteCount,
        totalVotes: issue.totalVotes
      }
    });
  } catch (error) {
    console.error('Vote on issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get issue statistics (admin only)
const getIssueStats = async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          pendingIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolvedIssues: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          urgentIssues: {
            $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
          },
          highPriorityIssues: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Issue.aggregate([
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

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalIssues: 0,
          pendingIssues: 0,
          inProgressIssues: 0,
          resolvedIssues: 0,
          urgentIssues: 0,
          highPriorityIssues: 0
        },
        byCategory: categoryStats,
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteOnIssue,
  getIssueStats
};