const mongoose = require('mongoose');
const Interaction = require('../models/Interaction');
const Post = require('../models/Post');
const SavedItem = require('../models/SavedItem');
const { applyInteractionContract } = require('../utils/interactionContract');

const toggleInteraction = async (req, res) => {
  try {
    const { postId, type } = req.body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: 'Valid postId is required' });
    }

    if (!['like', 'dislike'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be like or dislike' });
    }

    const post = await Post.findById(postId);
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

    // Update Hub Post
    await Post.findByIdAndUpdate(postId, {
      $set: {
        likesCount,
        dislikesCount
      }
    });

    // CRITICAL: Synchronize with source model (Story, Question, Resource)
    if (post.sourceModel && post.sourceId) {
      try {
        const SourceModel = mongoose.model(post.sourceModel);
        const userId = req.userId;

        if (userInteraction === 'like') {
          await SourceModel.findByIdAndUpdate(post.sourceId, {
            $addToSet: { upvotes: userId },
            $pull: { downvotes: userId }
          });
        } else if (userInteraction === 'dislike') {
          await SourceModel.findByIdAndUpdate(post.sourceId, {
            $addToSet: { downvotes: userId },
            $pull: { upvotes: userId }
          });
        } else {
          // none - remove from both
          await SourceModel.findByIdAndUpdate(post.sourceId, {
            $pull: { upvotes: userId, downvotes: userId }
          });
        }
      } catch (syncError) {
        console.error(`[sync-interaction] Failed to sync with ${post.sourceModel}:`, syncError.message);
        // We don't fail the request if sync fails, but we log it
      }
    }

    const isSaved = !!(await SavedItem.findOne({ userId: req.userId, postId }).select('_id').lean());

    return res.json({
      success: true,
      data: applyInteractionContract(
        { postId },
        {
          totalLikes: likesCount,
          totalDislikes: dislikesCount,
          totalComments: post.commentsCount || 0,
          interaction: userInteraction,
          isBookmarked: isSaved
        }
      )
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  toggleInteraction
};
