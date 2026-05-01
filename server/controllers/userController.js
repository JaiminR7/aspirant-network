const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const Resource = require('../models/Resource');
const Story = require('../models/Story');
const Answer = require('../models/Answer');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Circle = require('../models/Circle');
const Interaction = require('../models/Interaction');
const SavedItem = require('../models/SavedItem');
const CirclePost = require('../models/CirclePost');
const ResourceRating = require('../models/ResourceRating');
const BannedEmail = require('../models/BannedEmail');
const { isValidExam } = require('../constants/exams');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .select('-passwordHash -blockedUsers');
    if (!user || !user.isActive) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, location, website, profilePicture } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { displayName, bio, location, website, profilePicture },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const [questions, answers, resources, stories] = await Promise.all([
      Question.find({ createdBy: userId }).populate('subject topic'),
      Answer.find({ author: userId }).populate('question'),
      Resource.find({ $or: [{ user: userId }, { createdBy: userId }] }).populate('subject topic'),
      Story.find({ author: userId })
    ]);
    res.json({ success: true, data: { questions, answers, resources, stories } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid current password' });

    user.passwordHash = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete user account permanently
 * Removes all user data including questions, answers, resources, stories, and activities
 * Safely handles cascade deletion with defensive error handling
 */
const deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.userId;

    // 1. Verify user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`[DELETE_ACCOUNT] Starting permanent deletion for user: ${userId} (${user.username})`);

    // 2. Delete all user-created content - define cleanup tasks with proper error isolation
    const cleanupTasks = [
      // User-created questions, resources, stories
      { 
        name: 'Question', 
        query: { createdBy: userId },
        description: 'Questions created by user'
      },
      { 
        name: 'Resource', 
        query: { $or: [{ user: userId }, { createdBy: userId }] },
        description: 'Resources created/owned by user'
      },
      { 
        name: 'Story', 
        query: { author: userId },
        description: 'Stories created by user'
      },
      
      // User-created answers and comments
      { 
        name: 'Answer', 
        query: { author: userId },
        description: 'Answers posted by user'
      },
      { 
        name: 'Comment', 
        query: { userId: userId },
        description: 'Comments posted by user'
      },
      
      // User's circle posts and activity
      { 
        name: 'CirclePost', 
        query: { author: userId },
        description: 'Circle posts created by user'
      },
      { 
        name: 'Activity', 
        query: { $or: [{ user: userId }, { actor: userId }] },
        description: 'Activities involving user'
      },
      
      // User's interactions, bookmarks, ratings
      { 
        name: 'Interaction', 
        query: { userId: userId },
        description: 'User interactions (likes/dislikes)'
      },
      { 
        name: 'SavedItem', 
        query: { userId: userId },
        description: 'User bookmarks'
      },
      { 
        name: 'ResourceRating', 
        query: { user: userId },
        description: 'Resource ratings by user'
      },
      
      // Posts created by user's content
      { 
        name: 'Post', 
        query: { userId: userId },
        description: 'Feed posts created by user'
      }
    ];

    // Execute cleanup tasks with isolated error handling
    const deletionStats = {};
    for (const task of cleanupTasks) {
      try {
        // Use the imported Model directly instead of mongoose.model()
        let Model;
        switch (task.name) {
          case 'Question': Model = Question; break;
          case 'Resource': Model = Resource; break;
          case 'Story': Model = Story; break;
          case 'Answer': Model = Answer; break;
          case 'Comment': Model = Comment; break;
          case 'CirclePost': Model = CirclePost; break;
          case 'Activity': Model = Activity; break;
          case 'Interaction': Model = Interaction; break;
          case 'SavedItem': Model = SavedItem; break;
          case 'ResourceRating': Model = ResourceRating; break;
          case 'Post': Model = Post; break;
          default: 
            console.warn(`[DELETE_ACCOUNT] Unknown model: ${task.name}`);
            continue;
        }

        const result = await Model.deleteMany(task.query).session(session);
        deletionStats[task.name] = result.deletedCount || 0;
        console.log(`[DELETE_ACCOUNT] Deleted ${deletionStats[task.name]} ${task.description}`);
      } catch (err) {
        console.error(`[DELETE_ACCOUNT] Error deleting from ${task.name}: ${err.message}`);
        deletionStats[task.name] = `ERROR: ${err.message}`;
      }
    }

    // 3. Remove user from other users' blocked lists
    try {
      const blockUpdateResult = await User.updateMany(
        { blockedUsers: userId },
        { $pull: { blockedUsers: userId } },
        { session }
      );
      console.log(`[DELETE_ACCOUNT] Removed user from ${blockUpdateResult.modifiedCount || 0} users' block lists`);
    } catch (err) {
      console.error(`[DELETE_ACCOUNT] Error removing from block lists: ${err.message}`);
    }

    // 4. Remove user from circles they're a member of
    try {
      const circleUpdateResult = await Circle.updateMany(
        { members: userId },
        { $pull: { members: userId } },
        { session }
      );
      console.log(`[DELETE_ACCOUNT] Removed user from ${circleUpdateResult.modifiedCount || 0} circles`);
    } catch (err) {
      console.error(`[DELETE_ACCOUNT] Error removing from circles: ${err.message}`);
    }

    // 5. Remove user's votes from answers
    try {
      const upvoteResult = await Answer.updateMany(
        { upvotedBy: userId },
        { $pull: { upvotedBy: userId } },
        { session }
      );
      const downvoteResult = await Answer.updateMany(
        { downvotedBy: userId },
        { $pull: { downvotedBy: userId } },
        { session }
      );
      console.log(`[DELETE_ACCOUNT] Removed user votes from ${upvoteResult.modifiedCount + downvoteResult.modifiedCount} answers`);
    } catch (err) {
      console.error(`[DELETE_ACCOUNT] Error removing user votes: ${err.message}`);
    }

    // 6. Delete the user account itself
    const deleteResult = await User.findByIdAndDelete(userId, { session });
    if (!deleteResult) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user account'
      });
    }

    await session.commitTransaction();
    console.log(`[DELETE_ACCOUNT] ✓ User ${userId} permanently deleted successfully`);

    res.json({ 
      success: true, 
      message: 'Account and all associated data deleted successfully',
      stats: deletionStats
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('[DELETE_ACCOUNT] Fatal error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete account. Please try again later.' 
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update user settings (level, goal, privacy)
 */
const updateSettings = async (req, res) => {
  try {
    const { level, goal, privacy } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update fields if provided
    if (level) user.level = level;
    if (goal) user.goal = goal;
    if (privacy) user.privacy = { ...user.privacy, ...privacy };

    await user.save();

    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Change user's primary exam
 */
const changePrimaryExam = async (req, res) => {
  try {
    const { newExam, primaryExam } = req.body;
    const userId = req.userId;
    const nextExam = newExam || primaryExam;

    if (!nextExam) {
      return res.status(400).json({ 
        success: false, 
        message: 'New exam is required' 
      });
    }

    if (!isValidExam(nextExam)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam value'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    user.primaryExam = nextExam;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Primary exam changed successfully',
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Sync Clerk user with MongoDB
 * Creates a shell user if it doesn't exist
 * Blocks signup if email is banned
 */
const syncClerkUser = async (req, res) => {
  try {
    const { clerkId, email, name, profilePicture } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ success: false, message: 'clerkId and email are required' });
    }

    const emailLower = email.toLowerCase();

    // CHECK: Is this email banned?
    const bannedEmail = await BannedEmail.findOne({ email: emailLower });
    if (bannedEmail && bannedEmail.permanent) {
      console.warn(`[SYNC] Signup blocked - email ${email} is banned`);
      return res.status(403).json({
        success: false,
        message: 'This email cannot be used to create an account',
        code: 'EMAIL_BANNED'
      });
    }

    let user = await User.findOne({ clerkId });
    
    if (!user) {
      // Try finding by email (if they were a legacy user)
      user = await User.findOne({ email: emailLower });
      
      if (user) {
        // SAFETY: Never migrate seeded users
        if (user.isSeeded) {
          console.warn(`Sync attempt for seeded user: ${email}. Creating new shell instead.`);
          user = null; // Force creation of new shell
        } else {
          // Link legacy user
          console.log(`Linking legacy user: ${email}`);
          user.clerkId = clerkId;
          user.migratedToClerk = true;
          user.legacyAccount = true;
          if (profilePicture && !user.profilePicture?.url) {
            user.profilePicture = { url: profilePicture };
          }
          await user.save();
        }
      }
      
      // If still no user (new signup or seeded collision), create a shell
      if (!user) {
        user = await User.create({
          clerkId,
          email: emailLower,
          name: name || 'Aspirant',
          username: `user_${clerkId.slice(-6)}`,
          onboarded: false,
          isSeeded: false, // Explicitly not seeded
          profilePicture: profilePicture ? { url: profilePicture } : undefined
        });
      }
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle user onboarding
 */
const onboardUser = async (req, res) => {
  try {
    const { clerkId, name, username, primaryExam, stage, level, bio } = req.body;
    
    // Find user by clerkId
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please sync first.' });
    }

    // Update profile details
    user.name = name;
    user.username = username.toLowerCase();
    user.primaryExam = primaryExam;
    user.stage = stage;
    user.level = level;
    user.bio = bio;
    user.onboarded = true;

    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      data: user 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getUserProfile, 
  getMe, 
  updateProfile, 
  getUserActivity, 
  changePassword, 
  deleteAccount, 
  updateSettings, 
  changePrimaryExam,
  syncClerkUser,
  onboardUser
};
