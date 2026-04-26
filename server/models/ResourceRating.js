const mongoose = require('mongoose');

const resourceRatingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, {
  timestamps: true,
  collection: 'resource_ratings'
});

// One user can only rate a resource once
resourceRatingSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('ResourceRating', resourceRatingSchema);
