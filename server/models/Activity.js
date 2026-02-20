const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // User who should see this activity
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Activity type
  type: {
    type: String,
    required: true,
    enum: ['answer']
  },

  // Actor who performed the action (can be null for anonymous)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Related question
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },

  // Related answer (for answer-related activities)
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },

  // Activity message
  message: {
    type: String,
    required: true
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Index for fetching user activities efficiently
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Activity', activitySchema);
