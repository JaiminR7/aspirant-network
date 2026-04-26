const mongoose = require('mongoose');
const Interaction = require('../models/Interaction');
const Post = require('../models/Post');

const toggleInteraction = async (req, res) => {
  try {
    const { postId, type } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Valid postId is required' });
    }

    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be like or dislike' });
    }

    const post = await Post.findById(postId).select('_id');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existing = await Interaction.findOne({ userId: req.userId, postId });
    let userInteraction = 'none';

    if (!existing) {
      await Interaction.create({ userId: req.userId, postId, type });
      userInteraction = type;
    } else if (existing.type === type) {
      await Interaction.deleteOne({ _id: existing._id });
      userInteraction = 'none';
    } else {
      existing.type = type;
      await existing.save();
      userInteraction = type;
    }

    const [likesCount, dislikesCount] = await Promise.all([
      Interaction.countDocuments({ postId, type: 'like' }),
      Interaction.countDocuments({ postId, type: 'dislike' })
    ]);

    await Post.findByIdAndUpdate(postId, {
      $set: {
        likesCount,
        dislikesCount
      }
    });

    return res.json({
      success: true,
      data: {
        postId,
        likesCount,
        dislikesCount,
        userInteraction
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  toggleInteraction
};
