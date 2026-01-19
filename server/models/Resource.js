const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const resourceSchema = new mongoose.Schema({
  // Resource Title
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // CRITICAL: Exam Context (Resource is strictly exam-scoped)
  exam: {
    type: String,
    required: [true, 'Exam is required'],
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
  },

  // Subject Reference (ObjectId)
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },

  // Subject Name (denormalized for faster filtering)
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },

  // Topic Reference (ObjectId)
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },

  // Topic Name (denormalized for faster filtering)
  topicName: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true
  },

  // Created By (User reference)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },

  // Resource Type
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: {
      values: ['PDF', 'Image', 'Link', 'Video'],
      message: '{VALUE} is not a valid resource type'
    }
  },

  // Resource Content
  content: {
    // For PDFs and Images (Cloudinary)
    url: String,
    publicId: String,
    
    // For external links (YouTube, Drive, Blogs)
    externalLink: String,
    
    // File metadata
    fileName: String,
    fileSize: Number, // in bytes
    mimeType: String,
    
    // Thumbnail (for PDFs/Videos)
    thumbnailUrl: String
  },

  // System Tags (Controlled by admin)
  systemTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],

  // User Tags (CRITICAL: Max 3 tags)
  userTags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    validate: {
      validator: function(tags) {
        return tags.length <= 3;
      },
      message: 'Cannot add more than 3 user tags'
    }
  },

  // Rating System
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Individual Ratings (for tracking who rated)
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    ratedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Saved By Users
  saveCount: {
    type: Number,
    default: 0,
    min: 0
  },

  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Usage Statistics
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Comments on Resource (as per PROJECT_RULES)
  comments: [{
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },

  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },

  isHidden: {
    type: Boolean,
    default: false
  },

  // Verification (admin-verified resources)
  isVerified: {
    type: Boolean,
    default: false
  },

  verifiedAt: {
    type: Date
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  strict: true,
  collection: 'resources'
});

// ==================== INDEXES ====================

// CRITICAL: Exam-scoped queries (most important)
resourceSchema.index({ exam: 1, createdAt: -1 });
resourceSchema.index({ exam: 1, subject: 1, topic: 1 });
resourceSchema.index({ exam: 1, subjectName: 1 });
resourceSchema.index({ exam: 1, topicName: 1 });
resourceSchema.index({ exam: 1, type: 1 });

// Rating and popularity
resourceSchema.index({ 'rating.average': -1 });
resourceSchema.index({ saveCount: -1 });
resourceSchema.index({ downloadCount: -1 });

// User queries
resourceSchema.index({ createdBy: 1, createdAt: -1 });

// Tag search
resourceSchema.index({ userTags: 1 });

// Verification
resourceSchema.index({ isVerified: 1 });

// Moderation
resourceSchema.index({ isHidden: 1 });

// ==================== MIDDLEWARE ====================

// CRITICAL: Validate that resource's exam matches subject and topic
resourceSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('exam') || this.isModified('subject') || this.isModified('topic')) {
    try {
      const Subject = mongoose.model('Subject');
      const Topic = mongoose.model('Topic');
      
      const [subject, topic] = await Promise.all([
        Subject.findById(this.subject),
        Topic.findById(this.topic)
      ]);
      
      if (!subject) {
        return next(new Error('Subject not found'));
      }
      
      if (!topic) {
        return next(new Error('Topic not found'));
      }
      
      // Validate exam matches subject
      if (subject.exam !== this.exam) {
        return next(new Error(`Resource exam (${this.exam}) must match subject exam (${subject.exam})`));
      }
      
      // Validate exam matches topic
      if (topic.exam !== this.exam) {
        return next(new Error(`Resource exam (${this.exam}) must match topic exam (${topic.exam})`));
      }
      
      // Validate topic belongs to subject
      if (topic.subject.toString() !== this.subject.toString()) {
        return next(new Error('Topic does not belong to the selected subject'));
      }
      
      // Auto-populate denormalized fields
      this.subjectName = subject.name;
      this.topicName = topic.name;
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Validate content based on type
resourceSchema.pre('save', function(next) {
  if (this.isModified('type') || this.isModified('content')) {
    if (this.type === 'Link' || this.type === 'Video') {
      if (!this.content.externalLink) {
        return next(new Error('External link is required for Link/Video type'));
      }
    } else {
      if (!this.content.url || !this.content.publicId) {
        return next(new Error('Cloudinary URL and publicId are required for PDF/Image type'));
      }
    }
  }
  next();
});

// ==================== INSTANCE METHODS ====================

// Add rating
resourceSchema.methods.addRating = function(userId, ratingValue) {
  // Validate rating value
  if (ratingValue < 1 || ratingValue > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const userIdStr = userId.toString();
  
  // Check if user already rated
  const existingRatingIndex = this.ratings.findIndex(
    r => r.user.toString() === userIdStr
  );
  
  if (existingRatingIndex > -1) {
    // Update existing rating
    const oldRating = this.ratings[existingRatingIndex].rating;
    this.rating.total = this.rating.total - oldRating + ratingValue;
    this.ratings[existingRatingIndex].rating = ratingValue;
    this.ratings[existingRatingIndex].ratedAt = Date.now();
  } else {
    // Add new rating
    this.rating.total += ratingValue;
    this.rating.count += 1;
    this.ratings.push({
      user: userId,
      rating: ratingValue
    });
  }
  
  // Calculate average
  this.rating.average = this.rating.total / this.rating.count;
  
  return this.save();
};

// Get user's rating
resourceSchema.methods.getUserRating = function(userId) {
  const userIdStr = userId.toString();
  const userRating = this.ratings.find(r => r.user.toString() === userIdStr);
  return userRating ? userRating.rating : null;
};

// Toggle save
resourceSchema.methods.toggleSave = function(userId) {
  const userIdStr = userId.toString();
  const index = this.savedBy.findIndex(id => id.toString() === userIdStr);
  
  if (index > -1) {
    // Unsave
    this.savedBy.splice(index, 1);
    this.saveCount = Math.max(0, this.saveCount - 1);
  } else {
    // Save
    this.savedBy.push(userId);
    this.saveCount += 1;
  }
  
  return this.save();
};

// Check if user has saved
resourceSchema.methods.isSavedByUser = function(userId) {
  const userIdStr = userId.toString();
  return this.savedBy.some(id => id.toString() === userIdStr);
};

// Increment view count
resourceSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

// Increment download count
resourceSchema.methods.incrementDownloads = function() {
  this.downloadCount += 1;
  return this.save();
};

// Add comment
resourceSchema.methods.addComment = function(userId, content, isAnonymous = false) {
  this.comments.push({
    commentedBy: userId,
    content,
    isAnonymous
  });
  this.commentCount += 1;
  return this.save();
};

// Remove comment
resourceSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
  this.commentCount = Math.max(0, this.comments.length);
  return this.save();
};

// Verify resource (admin only)
resourceSchema.methods.verify = function(adminId) {
  this.isVerified = true;
  this.verifiedAt = Date.now();
  this.verifiedBy = adminId;
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get resources by exam (CRITICAL: Main query method)
resourceSchema.statics.getByExam = function(exam, options = {}) {
  const { 
    subject, 
    topic, 
    type,
    sortBy = '-createdAt', 
    limit = 20, 
    skip = 0 
  } = options;
  
  const query = { exam, isHidden: false };
  
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (type) query.type = type;
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level credibilityScore')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Get user's resources
resourceSchema.statics.getByUser = function(userId, options = {}) {
  const { exam, limit = 20, skip = 0 } = options;
  const query = { createdBy: userId };
  
  if (exam) query.exam = exam;
  
  return this.find(query)
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-createdAt')
    .limit(limit)
    .skip(skip);
};

// Search resources by exam (CRITICAL: Exam-scoped search)
resourceSchema.statics.searchByExam = function(exam, searchTerm, options = {}) {
  const { subject, topic, type, limit = 20, skip = 0 } = options;
  
  const query = {
    exam,
    isHidden: false,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { userTags: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (type) query.type = type;
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-rating.average')
    .limit(limit)
    .skip(skip);
};

// Get top-rated resources
resourceSchema.statics.getTopRated = function(exam, limit = 10) {
  return this.find({ 
    exam, 
    isHidden: false,
    'rating.count': { $gte: 3 } // Minimum 3 ratings
  })
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-rating.average')
    .limit(limit);
};

// Get most saved resources
resourceSchema.statics.getMostSaved = function(exam, limit = 10) {
  return this.find({ exam, isHidden: false })
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-saveCount')
    .limit(limit);
};

// Get verified resources
resourceSchema.statics.getVerified = function(exam, options = {}) {
  const { subject, topic, limit = 20, skip = 0 } = options;
  const query = { exam, isVerified: true, isHidden: false };
  
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-rating.average')
    .limit(limit)
    .skip(skip);
};

// Get user's saved resources
resourceSchema.statics.getSavedByUser = function(userId, exam) {
  const query = { savedBy: userId };
  if (exam) query.exam = exam;
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-createdAt');
};

// ==================== VIRTUAL PROPERTIES ====================

// Popularity score (for ranking)
resourceSchema.virtual('popularityScore').get(function() {
  return (this.rating.average * 10) + (this.saveCount * 2) + (this.downloadCount * 0.5);
});

// URL path
resourceSchema.virtual('path').get(function() {
  return `/resources/${this._id}`;
});

// File size in MB (for display)
resourceSchema.virtual('fileSizeMB').get(function() {
  if (this.content.fileSize) {
    return (this.content.fileSize / (1024 * 1024)).toFixed(2);
  }
  return null;
});

// Ensure virtuals are included in JSON
resourceSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.savedBy; // Don't expose who saved it
    delete ret.ratings; // Don't expose individual ratings
    return ret;
  }
});

resourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema);
