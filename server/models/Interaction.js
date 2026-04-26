const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Interaction type is required'],
      enum: {
        values: ['like', 'dislike'],
        message: '{VALUE} is not a valid interaction type'
      }
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'interactions'
  }
);

interactionSchema.index({ postId: 1, type: 1, createdAt: -1 });
interactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

interactionSchema.set('toJSON', {
  transform: function transformInteraction(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Interaction', interactionSchema);
