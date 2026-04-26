const mongoose = require('mongoose');

const circleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Circle name is required'],
      trim: true,
      minlength: [5, 'Circle name must be at least 5 characters'],
      maxlength: [120, 'Circle name cannot exceed 120 characters'],
    },
    topic: {
      type: String,
      required: [true, 'Circle topic is required'],
      trim: true,
      maxlength: [500, 'Circle topic cannot exceed 500 characters'],
    },
    messages: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: [true, 'Message text is required'],
          trim: true,
          maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
    collection: 'circles',
  },
);

circleSchema.index({ createdAt: -1 });
circleSchema.index({ 'messages.createdAt': -1 });

circleSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Circle', circleSchema);
