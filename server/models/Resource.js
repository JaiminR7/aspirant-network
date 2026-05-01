const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');
const { ALL_ALLOWED_COMMENT_TEXTS, toAllowedCommentText } = require('../constants/allowedComments');

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

  // Owner (canonical key expected by API clients/scripts)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },

  // Created By (legacy/backward-compatibility reference)
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

  // System Tags (Controlled by admin) - Predefined tag strings
  systemTags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'System tag cannot exceed 30 characters']
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
      validator: function (tags) {
        return tags.length <= 3;
      },
      message: 'Cannot add more than 3 user tags'
    }
  },

  // Aggregate Rating (denormalized from ResourceRating collection)
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

  // Voting System
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Usage Statistics
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
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      enum: {
        values: ALL_ALLOWED_COMMENT_TEXTS,
        message: 'Comment text must be from the approved whitelist'
      }
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
resourceSchema.index({ user: 1, createdAt: -1 });
resourceSchema.index({ createdBy: 1, createdAt: -1 });

// Tag search
resourceSchema.index({ userTags: 1 });

// Verification
resourceSchema.index({ isVerified: 1 });

// Moderation
resourceSchema.index({ isHidden: 1 });

// ==================== MIDDLEWARE ====================

// CRITICAL: Validate that resource's exam matches subject and topic
resourceSchema.pre('save', async function () {
  // Keep ownership keys in sync and reject owner-less documents.
  if (!this.user && this.createdBy) {
    this.user = this.createdBy;
  }
  if (!this.createdBy && this.user) {
    this.createdBy = this.user;
  }
  if (!this.user || !this.createdBy) {
    throw new Error('Resource owner is required');
  }

  if (this.isNew || this.isModified('exam') || this.isModified('subject') || this.isModified('topic')) {
    const Subject = mongoose.model('Subject');
    const Topic = mongoose.model('Topic');

    const [subject, topic] = await Promise.all([
      Subject.findById(this.subject),
      Topic.findById(this.topic)
    ]);

    if (!subject) {
      throw new Error('Subject not found');
    }

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Validate exam matches subject
    if (subject.exam !== this.exam) {
      throw new Error(`Resource exam (${this.exam}) must match subject exam (${subject.exam})`);
    }

    // Validate exam matches topic
    if (topic.exam !== this.exam) {
      throw new Error(`Resource exam (${this.exam}) must match topic exam (${topic.exam})`);
    }

    // Validate topic belongs to subject
    if (topic.subject.toString() !== this.subject.toString()) {
      throw new Error('Topic does not belong to the selected subject');
    }

    // Auto-populate denormalized fields
    this.subjectName = subject.name;
    this.topicName = topic.name;
  }
});

// Validate content based on type
resourceSchema.pre('save', function () {
  if (this.isModified('type') || this.isModified('content')) {
    if (this.type === 'Link' || this.type === 'Video') {
      if (!this.content.externalLink) {
        throw new Error('External link is required for Link/Video type');
      }
    } else {
      if (!this.content.url || !this.content.publicId) {
        throw new Error('Cloudinary URL and publicId are required for PDF/Image type');
      }
    }
  }
});

// ==================== INSTANCE METHODS ====================

// Toggle save
resourceSchema.methods.toggleSave = function (userId) {
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
resourceSchema.methods.isSavedByUser = function (userId) {
  const userIdStr = userId.toString();
  return this.savedBy.some(id => id.toString() === userIdStr);
};

// Increment download count
resourceSchema.methods.incrementDownloads = function () {
  this.downloadCount += 1;
  return this.save();
};

// Add comment
resourceSchema.methods.addComment = function (userId, content, isAnonymous = false) {
  const normalizedContent = String(content || '').trim().replace(/\s+/g, ' ');
  const canonicalContent = toAllowedCommentText(normalizedContent);

  if (!canonicalContent) {
    throw new Error('Comment content is required');
  }

  if (this.comments.length >= 10) {
    throw new Error('A resource can have at most 10 comments');
  }

  const userIdStr = userId.toString();
  const hasUserComment = this.comments.some((comment) => comment.commentedBy.toString() === userIdStr);
  if (hasUserComment) {
    throw new Error('User has already commented on this resource');
  }

  const hasDuplicateText = this.comments.some(
    (comment) => String(comment.content || '').trim() === canonicalContent
  );
  if (hasDuplicateText) {
    throw new Error('Duplicate comment text is not allowed');
  }

  this.comments.push({
    commentedBy: userId,
    content: canonicalContent,
    isAnonymous
  });
  this.commentCount += 1;
  return this.save();
};

// Remove comment
resourceSchema.methods.removeComment = function (commentId) {
  this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
  this.commentCount = Math.max(0, this.comments.length);
  return this.save();
};

// Verify resource (admin only)
resourceSchema.methods.verify = function (adminId) {
  this.isVerified = true;
  this.verifiedAt = Date.now();
  this.verifiedBy = adminId;
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get resources by exam (CRITICAL: Main query method)
resourceSchema.statics.getByExam = function (exam, options = {}) {
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
resourceSchema.statics.getByUser = function (userId, options = {}) {
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
resourceSchema.statics.searchByExam = function (exam, searchTerm, options = {}) {
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
resourceSchema.statics.getTopRated = function (exam, limit = 10) {
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
resourceSchema.statics.getMostSaved = function (exam, limit = 10) {
  return this.find({ exam, isHidden: false })
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-saveCount')
    .limit(limit);
};

// Get verified resources
resourceSchema.statics.getVerified = function (exam, options = {}) {
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
resourceSchema.statics.getSavedByUser = function (userId, exam) {
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
resourceSchema.virtual('popularityScore').get(function () {
  return (this.rating.average * 10) + (this.saveCount * 2) + (this.downloadCount * 0.5);
});

// URL path
resourceSchema.virtual('path').get(function () {
  return `/resources/${this._id}`;
});

// File size in MB (for display)
resourceSchema.virtual('fileSizeMB').get(function () {
  if (this.content.fileSize) {
    return (this.content.fileSize / (1024 * 1024)).toFixed(2);
  }
  return null;
});

// Ensure virtuals are included in JSON
resourceSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret.savedBy; // Don't expose who saved it
    return ret;
  }
});

resourceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resource', resourceSchema);
