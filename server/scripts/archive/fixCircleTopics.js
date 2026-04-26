const mongoose = require('mongoose');
require('dotenv').config();

const Circle = require('../models/Circle');

const fixCircleTopics = async () => {
  try {
    console.log('[FIX_CIRCLE_TOPICS] Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('[FIX_CIRCLE_TOPICS] Connected to MongoDB');

    // Find circles without topic
    const circlesWithoutTopic = await Circle.find({ topic: { $exists: false } });
    console.log(`[FIX_CIRCLE_TOPICS] Found ${circlesWithoutTopic.length} circles without topic field`);

    if (circlesWithoutTopic.length > 0) {
      // Update circles to add default topic
      const result = await Circle.updateMany(
        { topic: { $exists: false } },
        { $set: { topic: 'General Discussion' } }
      );

      console.log(`[FIX_CIRCLE_TOPICS] Updated ${result.modifiedCount} circles with default topic`);
    }

    // Also check for circles with empty/null topic
    const circlesWithEmptyTopic = await Circle.find({ 
      $or: [
        { topic: '' },
        { topic: null }
      ]
    });

    console.log(`[FIX_CIRCLE_TOPICS] Found ${circlesWithEmptyTopic.length} circles with empty topic`);

    if (circlesWithEmptyTopic.length > 0) {
      const result = await Circle.updateMany(
        { 
          $or: [
            { topic: '' },
            { topic: null }
          ]
        },
        { $set: { topic: 'General Discussion' } }
      );

      console.log(`[FIX_CIRCLE_TOPICS] Updated ${result.modifiedCount} circles with empty topic`);
    }

    // Verify all circles now have topic
    const allCircles = await Circle.find({}, { name: 1, topic: 1 });
    console.log(`[FIX_CIRCLE_TOPICS] Total circles: ${allCircles.length}`);
    
    if (allCircles.length > 0) {
      console.log('[FIX_CIRCLE_TOPICS] Sample circles:');
      allCircles.slice(0, 3).forEach((circle) => {
        console.log(`  - ${circle.name}: ${circle.topic}`);
      });
    }

    console.log('[FIX_CIRCLE_TOPICS] ✓ All circles now have valid topic field');
    
    process.exit(0);
  } catch (error) {
    console.error('[FIX_CIRCLE_TOPICS] Error:', error.message);
    process.exit(1);
  }
};

fixCircleTopics();
