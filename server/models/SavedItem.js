const mongoose = require('mongoose');

const savedItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    itemType: {
      type: String,
      enum: ['question', 'resource', 'story'],
      required: true
    }
  },
  {
    timestamps: { createdAt: 'savedAt', updatedAt: false },
    collection: 'saved_items'
  }
);

// Unique constraint to prevent duplicate saves
savedItemSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('SavedItem', savedItemSchema);
