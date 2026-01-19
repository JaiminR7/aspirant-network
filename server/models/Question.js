const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const questionSchema = new mongoose.Schema({
  // Question Title
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Question Description/Content
  description: {
    type: String,
    required: [true, 'Question description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },

  // CRITICAL: Exam Context (Question is strictly exam-scoped)
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

  // Anonymous Posting
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Images/Attachments (Cloudinary)
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

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

  // Question Status
  isSolved: {
    type: Boolean,
    default: false
  },

  solvedAt: {
    type: Date
  },

  // Accepted Answer (marked as solution)
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },

  // Voting System
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Answer Count
  answerCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Views
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

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

  // Activity Tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  strict: true,
  collection: 'questions'
});

// ==================== INDEXES ====================

// CRITICAL: Exam-scoped queries (most important)
questionSchema.index({ exam: 1, createdAt: -1 });
questionSchema.index({ exam: 1, subject: 1, topic: 1 });
questionSchema.index({ exam: 1, isSolved: 1 });
questionSchema.index({ exam: 1, subjectName: 1 });
questionSchema.index({ exam: 1, topicName: 1 });

// User queries
questionSchema.index({ createdBy: 1, createdAt: -1 });

// Sorting and filtering
questionSchema.index({ upvotes: -1 });
questionSchema.index({ answerCount: -1 });
questionSchema.index({ viewCount: -1 });
questionSchema.index({ lastActivityAt: -1 });

// Tag search
questionSchema.index({ userTags: 1 });

// Moderation
questionSchema.index({ isHidden: 1 });

// ==================== MIDDLEWARE ====================

// CRITICAL: Validate that question's exam matches subject and topic
questionSchema.pre('save', async function(next) {
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
        return next(new Error(`Question exam (${this.exam}) must match subject exam (${subject.exam})`));
      }
      
      // Validate exam matches topic
      if (topic.exam !== this.exam) {
        return next(new Error(`Question exam (${this.exam}) must match topic exam (${topic.exam})`));
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

// Update lastActivityAt on any modification
questionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = Date.now();
  }
  next();
});

// ==================== INSTANCE METHODS ====================

// Update activity timestamp
questionSchema.methods.updateActivity = function() {
  this.lastActivityAt = Date.now();
  return this.save();
};

// Mark as solved
questionSchema.methods.markSolved = function(answerId = null) {
  this.isSolved = true;
  this.solvedAt = Date.now();
  if (answerId) {
    this.acceptedAnswer = answerId;
  }
  return this.save();
};

// Mark as unsolved
questionSchema.methods.markUnsolved = function() {
  this.isSolved = false;
  this.solvedAt = null;
  this.acceptedAnswer = null;
  return this.save();
};

// Add upvote
questionSchema.methods.addUpvote = function(userId) {
  const userIdStr = userId.toString();
  
  // Remove from downvotes if exists
  const downvoteIndex = this.downvotedBy.findIndex(id => id.toString() === userIdStr);
  if (downvoteIndex > -1) {
    this.downvotes = Math.max(0, this.downvotes - 1);
    this.downvotedBy.splice(downvoteIndex, 1);
  }
  
  // Add to upvotes if not already upvoted
  const upvoteIndex = this.upvotedBy.findIndex(id => id.toString() === userIdStr);
  if (upvoteIndex === -1) {
    this.upvotes += 1;
    this.upvotedBy.push(userId);
  }
  
  return this.save();
};

// Add downvote
questionSchema.methods.addDownvote = function(userId) {
  const userIdStr = userId.toString();
  
  // Remove from upvotes if exists
  const upvoteIndex = this.upvotedBy.findIndex(id => id.toString() === userIdStr);
  if (upvoteIndex > -1) {
    this.upvotes = Math.max(0, this.upvotes - 1);
    this.upvotedBy.splice(upvoteIndex, 1);
  }
  
  // Add to downvotes if not already downvoted
  const downvoteIndex = this.downvotedBy.findIndex(id => id.toString() === userIdStr);
  if (downvoteIndex === -1) {
    this.downvotes += 1;
    this.downvotedBy.push(userId);
  }
  
  return this.save();
};

// Remove vote (undo upvote or downvote)
questionSchema.methods.removeVote = function(userId) {
  const userIdStr = userId.toString();
  
  // Remove from upvotes
  const upvoteIndex = this.upvotedBy.findIndex(id => id.toString() === userIdStr);
  if (upvoteIndex > -1) {
    this.upvotes = Math.max(0, this.upvotes - 1);
    this.upvotedBy.splice(upvoteIndex, 1);
  }
  
  // Remove from downvotes
  const downvoteIndex = this.downvotedBy.findIndex(id => id.toString() === userIdStr);
  if (downvoteIndex > -1) {
    this.downvotes = Math.max(0, this.downvotes - 1);
    this.downvotedBy.splice(downvoteIndex, 1);
  }
  
  return this.save();
};

// Increment answer count
questionSchema.methods.incrementAnswers = function() {
  this.answerCount += 1;
  this.lastActivityAt = Date.now();
  return this.save();
};

// Decrement answer count
questionSchema.methods.decrementAnswers = function() {
  this.answerCount = Math.max(0, this.answerCount - 1);
  return this.save();
};

// Increment view count
questionSchema.methods.incrementViews = function(userId = null) {
  this.viewCount += 1;
  
  // Track unique viewers
  if (userId && !this.viewedBy.some(id => id.toString() === userId.toString())) {
    this.viewedBy.push(userId);
  }
  
  return this.save();
};

// Check if user has voted
questionSchema.methods.getUserVote = function(userId) {
  const userIdStr = userId.toString();
  
  if (this.upvotedBy.some(id => id.toString() === userIdStr)) {
    return 'upvote';
  }
  
  if (this.downvotedBy.some(id => id.toString() === userIdStr)) {
    return 'downvote';
  }
  
  return null;
};

// ==================== STATIC METHODS ====================

// Get questions by exam (CRITICAL: Main query method)
questionSchema.statics.getByExam = function(exam, options = {}) {
  const { 
    subject, 
    topic, 
    isSolved, 
    sortBy = '-createdAt', 
    limit = 20, 
    skip = 0 
  } = options;
  
  const query = { exam, isHidden: false };
  
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (typeof isSolved === 'boolean') query.isSolved = isSolved;
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level credibilityScore')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Get user's questions
questionSchema.statics.getByUser = function(userId, options = {}) {
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

// Search questions by exam (CRITICAL: Exam-scoped search)
questionSchema.statics.searchByExam = function(exam, searchTerm, options = {}) {
  const { subject, topic, limit = 20, skip = 0 } = options;
  
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
  
  return this.find(query)
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-createdAt')
    .limit(limit)
    .skip(skip);
};

// Get trending questions (by activity)
questionSchema.statics.getTrending = function(exam, limit = 10) {
  return this.find({ exam, isHidden: false })
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-lastActivityAt')
    .limit(limit);
};

// Get unanswered questions
questionSchema.statics.getUnanswered = function(exam, limit = 20) {
  return this.find({ 
    exam, 
    answerCount: 0, 
    isHidden: false 
  })
    .populate('createdBy', 'username name profilePicture level')
    .populate('subject', 'name slug')
    .populate('topic', 'name slug')
    .sort('-createdAt')
    .limit(limit);
};

// ==================== VIRTUAL PROPERTIES ====================

// Net votes (upvotes - downvotes)
questionSchema.virtual('netVotes').get(function() {
  return this.upvotes - this.downvotes;
});

// URL path
questionSchema.virtual('path').get(function() {
  return `/questions/${this._id}`;
});

// Engagement score (for ranking)
questionSchema.virtual('engagementScore').get(function() {
  return (this.upvotes * 2) + (this.answerCount * 3) + (this.viewCount * 0.1);
});

// Ensure virtuals are included in JSON
questionSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.viewedBy; // Don't expose viewer list
    delete ret.upvotedBy; // Don't expose voter lists
    delete ret.downvotedBy;
    return ret;
  }
});

questionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Question', questionSchema);
