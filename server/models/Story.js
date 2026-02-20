const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const storySchema = new mongoose.Schema({
  // Story Title
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Story Content
  content: {
    type: String,
    required: [true, 'Story content is required'],
    trim: true,
    minlength: [100, 'Content must be at least 100 characters'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },

  // Story Summary/Excerpt
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },

  // CRITICAL: Exam Context (Story is strictly exam-scoped)
  exam: {
    type: String,
    required: [true, 'Exam is required'],
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
  },

  // Story Type/Category
  storyType: {
    type: String,
    required: [true, 'Story type is required'],
    enum: {
      values: ['Success', 'Journey', 'Tips', 'Motivation', 'Experience', 'Strategy'],
      message: '{VALUE} is not a valid story type'
    },
    default: 'Journey'
  },

  // Author Reference
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },

  // Cover Image (optional, Cloudinary)
  coverImage: {
    url: String,
    publicId: String
  },

  // User Tags (Max 5 for stories)
  tags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    validate: {
      validator: function(tags) {
        return tags.length <= 5;
      },
      message: 'Maximum 5 tags allowed per story'
    }
  },

  // Engagement Metrics
  views: {
    type: Number,
    default: 0,
    min: 0
  },

  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  // Users who upvoted
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Users who downvoted
  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Users who saved this story
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
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

  // Featured/Pinned Status
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Published'
  },

  // Result/Outcome (for success stories)
  result: {
    rank: String,
    percentile: Number,
    year: Number,
    institution: String
  }

}, { timestamps: true, collection: 'stories' });

storySchema.index({ exam: 1, createdAt: -1 });
storySchema.index({ exam: 1, storyType: 1 });
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ upvotes: -1 });

storySchema.pre('save', function() {
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 250) + (this.content.length > 250 ? '...' : '');
  }
});

storySchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Handle upvote
storySchema.methods.upvote = async function(userId) {
  const userIdStr = userId.toString();
  
  // Check if already upvoted
  const hasUpvoted = this.upvotedBy.some(id => id.toString() === userIdStr);
  const hasDownvoted = this.downvotedBy.some(id => id.toString() === userIdStr);
  
  if (hasUpvoted) {
    // Remove upvote (toggle off)
    this.upvotedBy = this.upvotedBy.filter(id => id.toString() !== userIdStr);
    this.upvotes = Math.max(0, this.upvotes - 1);
  } else {
    // Add upvote
    this.upvotedBy.push(userId);
    this.upvotes += 1;
    
    // Remove downvote if exists
    if (hasDownvoted) {
      this.downvotedBy = this.downvotedBy.filter(id => id.toString() !== userIdStr);
      this.downvotes = Math.max(0, this.downvotes - 1);
    }
  }
  
  return this.save();
};

// Handle downvote
storySchema.methods.downvote = async function(userId) {
  const userIdStr = userId.toString();
  
  // Check if already downvoted
  const hasDownvoted = this.downvotedBy.some(id => id.toString() === userIdStr);
  const hasUpvoted = this.upvotedBy.some(id => id.toString() === userIdStr);
  
  if (hasDownvoted) {
    // Remove downvote (toggle off)
    this.downvotedBy = this.downvotedBy.filter(id => id.toString() !== userIdStr);
    this.downvotes = Math.max(0, this.downvotes - 1);
  } else {
    // Add downvote
    this.downvotedBy.push(userId);
    this.downvotes += 1;
    
    // Remove upvote if exists
    if (hasUpvoted) {
      this.upvotedBy = this.upvotedBy.filter(id => id.toString() !== userIdStr);
      this.upvotes = Math.max(0, this.upvotes - 1);
    }
  }
  
  return this.save();
};

// Toggle save
storySchema.methods.toggleSave = async function(userId) {
  const userIdStr = userId.toString();
  const hasSaved = this.savedBy.some(id => id.toString() === userIdStr);
  
  if (hasSaved) {
    this.savedBy = this.savedBy.filter(id => id.toString() !== userIdStr);
  } else {
    this.savedBy.push(userId);
  }
  
  return this.save();
};

// Add comment
storySchema.methods.addComment = async function(userId, content, isAnonymous = false) {
  this.comments.push({
    user: userId,
    content,
    isAnonymous,
    createdAt: new Date()
  });
  return this.save();
};

// Remove comment
storySchema.methods.removeComment = async function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this comment');
  }
  comment.deleteOne();
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get stories by exam with pagination
storySchema.statics.getByExam = async function(exam, options = {}) {
  const {
    page = 1,
    limit = 10,
    storyType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    featured = false
  } = options;

  const query = { exam, status: 'Published' };
  
  if (storyType) {
    query.storyType = storyType;
  }
  
  if (featured) {
    query.isFeatured = true;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const stories = await this.find(query)
    .populate('author', 'name username profilePicture credibilityScore')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    stories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get trending stories
storySchema.statics.getTrending = async function(exam, limit = 10) {
  return this.find({ exam, status: 'Published' })
    .populate('author', 'name username profilePicture credibilityScore')
    .sort({ upvotes: -1, views: -1, createdAt: -1 })
    .limit(limit);
};

// ==================== VIRTUAL PROPERTIES ====================

// Net votes
storySchema.virtual('netVotes').get(function() {
  return this.upvotes - this.downvotes;
});

// Comment count
storySchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Save count
storySchema.virtual('saveCount').get(function() {
  return this.savedBy.length;
});

// Ensure virtuals are included in JSON
storySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

storySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Story', storySchema);
