const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Issue description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Issue category is required'],
    enum: [
      'pothole',
      'street_light',
      'drainage',
      'traffic_signal',
      'road_damage',
      'sidewalk',
      'graffiti',
      'garbage',
      'water_leak',
      'park_maintenance',
      'noise_complaint',
      'other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected', 'duplicate'],
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' },
    formatted: String // Full formatted address
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // Cloudinary public ID for deletion
    originalName: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    aiDescription: String // AI-generated description of the image
  }],
  aiAnalysis: {
    description: String, // AI-generated description
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    suggestedCategory: String,
    confidence: Number, // AI confidence score (0-1)
    processedAt: Date,
    sentiment: {
      overall: String, // negative, somewhat_negative, neutral, somewhat_positive, positive
      urgency: Number, // 0-1 score
      safety: Number,  // 0-1 score
      impact: Number   // 0-1 score
    },
    damageDepth: {
      estimatedDepth: Number, // in centimeters
      confidence: Number,    // 0-1 score
      unit: String,          // cm, inches, etc.
      damageAssessment: String // Brief assessment of damage severity
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: [{
    note: {
      type: String,
      required: true,
      maxlength: [1000, 'Admin note cannot exceed 1000 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false // Whether the note is visible to the reporter
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected', 'duplicate'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  votes: {
    upvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    downvotes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  estimatedResolutionTime: {
    type: Number, // in hours
    min: 1,
    max: 8760 // 1 year
  },
  actualResolutionTime: Number, // in hours
  resolvedAt: Date,
  tags: [String],
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: String,
    reportingMethod: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin'],
      default: 'web'
    },
    duplicateDetection: {
      hasDuplicates: Boolean,
      confidence: Number, // 0-1 score
      potentialDuplicates: [{
        issueId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Issue'
        },
        similarity: Number, // 0-1 score
        isDuplicate: Boolean
      }]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Compound indexes for better query performance
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ reportedBy: 1, createdAt: -1 });
issueSchema.index({ assignedTo: 1, status: 1 });
issueSchema.index({ priority: 1, status: 1 });

// Virtual for vote counts
issueSchema.virtual('upvoteCount').get(function() {
  return this.votes.upvotes.length;
});

issueSchema.virtual('downvoteCount').get(function() {
  return this.votes.downvotes.length;
});

issueSchema.virtual('totalVotes').get(function() {
  return this.upvoteCount + this.downvoteCount;
});

// Virtual for issue age in days
issueSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status history
issueSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    // Use _updatedBy if available (from admin updates), otherwise fallback to assignedTo or reportedBy
    const changedBy = this._updatedBy || this.assignedTo || this.reportedBy;
    
    this.statusHistory.push({
      status: this.status,
      changedBy: changedBy,
      changedAt: new Date(),
      reason: this.statusNotes || undefined
    });
    
    // Clean up temporary field
    if (this._updatedBy) {
      this._updatedBy = undefined;
    }
    
    if (this.status === 'resolved') {
      this.resolvedAt = new Date();
      if (this.createdAt) {
        this.actualResolutionTime = Math.floor(
          (this.resolvedAt - this.createdAt) / (1000 * 60 * 60)
        );
      }
    }
  }
  next();
});

// Static method to find issues near a location
issueSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    }
  });
};

// Static method to find issues by status
issueSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('reportedBy', 'firstName lastName email');
};

// Instance method to add admin note
issueSchema.methods.addAdminNote = function(note, adminId, isPublic = false) {
  this.adminNotes.push({
    note,
    addedBy: adminId,
    isPublic
  });
  return this.save();
};

// Instance method to vote on issue
issueSchema.methods.vote = function(userId, voteType) {
  // Remove any existing votes by this user
  this.votes.upvotes = this.votes.upvotes.filter(
    vote => !vote.user.equals(userId)
  );
  this.votes.downvotes = this.votes.downvotes.filter(
    vote => !vote.user.equals(userId)
  );
  
  // Add new vote
  if (voteType === 'up') {
    this.votes.upvotes.push({ user: userId });
  } else if (voteType === 'down') {
    this.votes.downvotes.push({ user: userId });
  }
  
  return this.save();
};

module.exports = mongoose.model('Issue', issueSchema);
