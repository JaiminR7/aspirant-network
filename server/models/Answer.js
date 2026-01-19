const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  // Question Reference
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question reference is required']
  },

  // Answered By (User reference)
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },

  // Anonymous Posting
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Answer Content
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    trim: true,
    minlength: [10, 'Answer must be at least 10 characters'],
    maxlength: [5000, 'Answer cannot exceed 5000 characters']
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

  // Accepted Answer (CRITICAL: Only one per question)
  isAccepted: {
    type: Boolean,
    default: false
  },

  acceptedAt: {
    type: Date
  },

  // CRITICAL: Chat Request Tracking (chat originates from answers)
  chatRequests: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined', 'Closed'],
      default: 'Pending'
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Comments on Answer
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

  // Edit Tracking
  isEdited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date
  },

  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousContent: String
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
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  strict: true,
  collection: 'answers'
});

// ==================== INDEXES ====================

// Query by question (most common query)
answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ question: 1, isAccepted: 1 });
answerSchema.index({ question: 1, upvotes: -1 });

// Query by user
answerSchema.index({ answeredBy: 1, createdAt: -1 });

// Sorting
answerSchema.index({ upvotes: -1 });
answerSchema.index({ createdAt: -1 });

// Moderation
answerSchema.index({ isHidden: 1 });

// ==================== MIDDLEWARE ====================

// CRITICAL: Validate only one accepted answer per question
answerSchema.pre('save', async function(next) {
  if (this.isModified('isAccepted') && this.isAccepted) {
    try {
      // Check if another answer is already accepted for this question
      const existingAccepted = await this.constructor.findOne({
        question: this.question,
        isAccepted: true,
        _id: { $ne: this._id } // Exclude current answer
      });

      if (existingAccepted) {
        return next(new Error('This question already has an accepted answer. Unmark the existing one first.'));
      }

      this.acceptedAt = Date.now();
      next();
    } catch (error) {
      next(error);
    }
  } else if (this.isModified('isAccepted') && !this.isAccepted) {
    // If unmarking as accepted, clear acceptedAt
    this.acceptedAt = null;
    next();
  } else {
    next();
  }
});

// Update Question's answer count when answer is created
answerSchema.post('save', async function(doc, next) {
  if (doc.wasNew) {
    try {
      const Question = mongoose.model('Question');
      await Question.findByIdAndUpdate(
        doc.question,
        { 
          $inc: { answerCount: 1 },
          $set: { lastActivityAt: Date.now() }
        }
      );
    } catch (error) {
      console.error('Error updating question answer count:', error);
    }
  }
  next();
});

// Update Question when answer is deleted
answerSchema.post('remove', async function(doc, next) {
  try {
    const Question = mongoose.model('Question');
    await Question.findByIdAndUpdate(
      doc.question,
      { 
        $inc: { answerCount: -1 },
        $set: { lastActivityAt: Date.now() }
      }
    );
  } catch (error) {
    console.error('Error updating question answer count:', error);
  }
  next();
});

// ==================== INSTANCE METHODS ====================

// Add upvote
answerSchema.methods.addUpvote = function(userId) {
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
answerSchema.methods.addDownvote = function(userId) {
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
answerSchema.methods.removeVote = function(userId) {
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

// Check if user has voted
answerSchema.methods.getUserVote = function(userId) {
  const userIdStr = userId.toString();
  
  if (this.upvotedBy.some(id => id.toString() === userIdStr)) {
    return 'upvote';
  }
  
  if (this.downvotedBy.some(id => id.toString() === userIdStr)) {
    return 'downvote';
  }
  
  return null;
};

// Mark as accepted
answerSchema.methods.markAccepted = async function() {
  // Update Question's acceptedAnswer field
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(this.question, {
    acceptedAnswer: this._id,
    isSolved: true,
    solvedAt: Date.now()
  });
  
  this.isAccepted = true;
  this.acceptedAt = Date.now();
  return this.save();
};

// Unmark as accepted
answerSchema.methods.unmarkAccepted = async function() {
  // Update Question's acceptedAnswer field
  const Question = mongoose.model('Question');
  await Question.findByIdAndUpdate(this.question, {
    acceptedAnswer: null,
    isSolved: false,
    solvedAt: null
  });
  
  this.isAccepted = false;
  this.acceptedAt = null;
  return this.save();
};

// Edit answer
answerSchema.methods.editContent = function(newContent) {
  // Save to edit history
  this.editHistory.push({
    editedAt: Date.now(),
    previousContent: this.content
  });
  
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = Date.now();
  
  return this.save();
};

// Add comment
answerSchema.methods.addComment = function(userId, content, isAnonymous = false) {
  this.comments.push({
    commentedBy: userId,
    content,
    isAnonymous
  });
  this.commentCount += 1;
  return this.save();
};

// Remove comment
answerSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
  this.commentCount = Math.max(0, this.comments.length);
  return this.save();
};

// CRITICAL: Add chat request (chat originates from answer)
answerSchema.methods.addChatRequest = function(requesterId, chatId) {
  // Check if request already exists
  const existingRequest = this.chatRequests.find(
    req => req.requestedBy.toString() === requesterId.toString()
  );
  
  if (existingRequest) {
    throw new Error('Chat request already exists from this user');
  }
  
  this.chatRequests.push({
    requestedBy: requesterId,
    chatId,
    status: 'Pending'
  });
  
  return this.save();
};

// Update chat request status
answerSchema.methods.updateChatRequestStatus = function(requesterId, status) {
  const request = this.chatRequests.find(
    req => req.requestedBy.toString() === requesterId.toString()
  );
  
  if (request) {
    request.status = status;
  }
  
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get answers for a question
answerSchema.statics.getByQuestion = function(questionId, options = {}) {
  const { sortBy = '-upvotes', limit = 50, skip = 0 } = options;
  
  return this.find({ 
    question: questionId, 
    isHidden: false 
  })
    .populate('answeredBy', 'username name profilePicture level credibilityScore badges')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Get user's answers
answerSchema.statics.getByUser = function(userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ answeredBy: userId })
    .populate('question', 'title exam subject topic')
    .sort('-createdAt')
    .limit(limit)
    .skip(skip);
};

// Get accepted answer for a question
answerSchema.statics.getAcceptedAnswer = function(questionId) {
  return this.findOne({ 
    question: questionId, 
    isAccepted: true 
  }).populate('answeredBy', 'username name profilePicture level credibilityScore badges');
};

// Check if user has answered a question
answerSchema.statics.hasUserAnswered = async function(questionId, userId) {
  const count = await this.countDocuments({
    question: questionId,
    answeredBy: userId
  });
  return count > 0;
};

// Get answer count for a question
answerSchema.statics.getAnswerCount = function(questionId) {
  return this.countDocuments({ 
    question: questionId, 
    isHidden: false 
  });
};

// ==================== VIRTUAL PROPERTIES ====================

// Net votes (upvotes - downvotes)
answerSchema.virtual('netVotes').get(function() {
  return this.upvotes - this.downvotes;
});

// Helpfulness score
answerSchema.virtual('helpfulnessScore').get(function() {
  return this.upvotes + (this.isAccepted ? 10 : 0);
});

// Ensure virtuals are included in JSON
answerSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.upvotedBy; // Don't expose voter lists
    delete ret.downvotedBy;
    delete ret.editHistory; // Don't expose full edit history
    return ret;
  }
});

answerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Answer', answerSchema);
