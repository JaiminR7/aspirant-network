const mongoose = require('mongoose');

const bannedEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ],
      index: true
    },
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    username: {
      type: String,
      required: true
    },
    
    reason: {
      type: String,
      enum: ['banned_by_admin', 'terms_violation', 'abuse', 'other'],
      default: 'banned_by_admin'
    },
    
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notes cannot exceed 500 characters']
    },
    
    bannedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    permanent: {
      type: Boolean,
      default: true // Once banned, always banned unless explicitly overridden
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'bannedEmails'
  }
);

// Index for efficient lookups during signup/login
bannedEmailSchema.index({ email: 1 });
bannedEmailSchema.index({ bannedAt: -1 });

bannedEmailSchema.set('toJSON', {
  transform: function transformBannedEmail(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('BannedEmail', bannedEmailSchema);
