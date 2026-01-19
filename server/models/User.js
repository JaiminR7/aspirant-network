const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { getExamEnum } = require('../constants/exams');
const { getLevelEnum } = require('../constants/levels');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  },

  // CRITICAL: Exam Context (MANDATORY)
  primaryExam: {
    type: String,
    required: [true, 'Primary exam is required'],
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
  },

  // Attempt Year
  attemptYear: {
    type: Number,
    required: [true, 'Attempt year is required'],
    min: [2024, 'Attempt year must be 2024 or later'],
    max: [2030, 'Attempt year cannot be beyond 2030'],
    validate: {
      validator: Number.isInteger,
      message: 'Attempt year must be a valid integer'
    }
  },

  // Preparation Level
  level: {
    type: String,
    required: [true, 'Preparation level is required'],
    enum: {
      values: getLevelEnum(),
      message: '{VALUE} is not a valid level'
    }
  },

  // Optional Goal
  goal: {
    text: {
      type: String,
      trim: true,
      maxlength: [200, 'Goal cannot exceed 200 characters']
    },
    visibility: {
      type: String,
      enum: ['Public', 'Connections', 'Private'],
      default: 'Public'
    }
  },

  // Profile Picture (Cloudinary)
  profilePicture: {
    url: String,
    publicId: String
  },

  // Credibility & Reputation
  credibilityScore: {
    type: Number,
    default: 0,
    min: 0
  },

  // Badges (earned through activity)
  badges: [{
    type: {
      type: String,
      enum: ['Helpful', 'TopContributor', 'Mentor', 'Verified', 'SubjectExpert']
    },
    subject: String, // For subject-specific badges
    awardedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Activity Statistics
  stats: {
    questionsPosted: {
      type: Number,
      default: 0,
      min: 0
    },
    answersGiven: {
      type: Number,
      default: 0,
      min: 0
    },
    resourcesShared: {
      type: Number,
      default: 0,
      min: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Privacy Settings
  privacy: {
    activityVisibility: {
      type: Boolean,
      default: true
    },
    allowAnonymousPosting: {
      type: Boolean,
      default: false
    }
  },

  // Saved Content (References)
  savedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  
  savedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  
  savedStories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }],

  // Blocked Users
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },

  // Last Activity Tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  strict: true, // Prevent fields not in schema from being saved
  collection: 'users'
});

// ==================== INDEXES ====================

// Unique indexes (already enforced by unique: true, but explicit is better)
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// Query optimization indexes
userSchema.index({ primaryExam: 1 });
userSchema.index({ level: 1 });
userSchema.index({ credibilityScore: -1 });
userSchema.index({ isActive: 1 });

// ==================== MIDDLEWARE ====================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActiveAt before saving
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActiveAt = Date.now();
  }
  next();
});

// ==================== INSTANCE METHODS ====================

// Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update credibility score
userSchema.methods.addCredibility = function(points) {
  this.credibilityScore += points;
  return this.save();
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = Date.now();
  return this.save();
};

// Increment question count
userSchema.methods.incrementQuestions = function() {
  this.stats.questionsPosted += 1;
  return this.save();
};

// Increment answer count
userSchema.methods.incrementAnswers = function() {
  this.stats.answersGiven += 1;
  return this.save();
};

// Increment resource count
userSchema.methods.incrementResources = function() {
  this.stats.resourcesShared += 1;
  return this.save();
};

// Add helpful vote
userSchema.methods.addHelpfulVote = function() {
  this.stats.helpfulVotes += 1;
  this.credibilityScore += 1; // Increase credibility with helpful votes
  return this.save();
};

// Check if user has blocked another user
userSchema.methods.hasBlocked = function(userId) {
  return this.blockedUsers.some(id => id.toString() === userId.toString());
};

// Block a user
userSchema.methods.blockUser = function(userId) {
  if (!this.hasBlocked(userId)) {
    this.blockedUsers.push(userId);
  }
  return this.save();
};

// Unblock a user
userSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(
    id => id.toString() !== userId.toString()
  );
  return this.save();
};

// ==================== STATIC METHODS ====================

// Find user by email or username
userSchema.statics.findByCredentials = async function(identifier) {
  const user = await this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  }).select('+passwordHash');
  
  return user;
};

// Get active users by exam
userSchema.statics.getActiveUsersByExam = function(exam) {
  return this.find({ 
    primaryExam: exam, 
    isActive: true 
  });
};

// ==================== VIRTUAL PROPERTIES ====================

// Full profile URL (for frontend routing)
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.username}`;
});

// Display name (prioritize name over username)
userSchema.virtual('displayName').get(function() {
  return this.name || this.username;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
