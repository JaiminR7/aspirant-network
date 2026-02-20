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
    select: false, // Don't return password by default in queries
    validate: {
      validator: function(value) {
        // Skip validation if password is being hashed (starts with $2 for bcrypt)
        if (value && value.startsWith('$2')) return true;
        
        // Validate password strength for new/updated passwords
        const hasUpperCase = /[A-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(value);
        
        return hasUpperCase && hasNumber && hasSymbol;
      },
      message: 'Password must contain at least one uppercase letter, one number, and one special character'
    }
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

  // OTP Verification Fields
  otpHash: {
    type: String,
    select: false
  },

  otpExpiry: {
    type: Date,
    select: false
  },

  otpAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  // Password Reset Fields
  passwordResetToken: {
    type: String,
    select: false
  },

  passwordResetExpiry: {
    type: Date,
    select: false
  },

  // Last Activity Tracking
  lastActiveAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  strict: true,
  collection: 'users'
});

userSchema.index({ primaryExam: 1 });
userSchema.index({ credibilityScore: -1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function() {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
