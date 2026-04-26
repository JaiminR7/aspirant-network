const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post is required'],
      index: true
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [300, 'Comment cannot exceed 300 characters']
      // No enum — free-text allowed. Seeder uses COMMENT_MAP for realistic fake data.
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'comments'
  }
);

commentSchema.index({ postId: 1, createdAt: -1 });
// One comment per user per post
commentSchema.index({ postId: 1, userId: 1 }, { unique: true });

commentSchema.set('toJSON', {
  transform: function transformComment(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Comment', commentSchema);
