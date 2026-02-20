/**
 * Migration script to add actualCreator field to existing questions
 * Run this once to migrate old data: node server/scripts/migrateActualCreator.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateActualCreator() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aspirant-network';
    
    // Connect to database
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const Question = mongoose.model('Question', require('../models/Question').schema);

    // Find all questions without actualCreator field
    const questionsToUpdate = await Question.find({
      actualCreator: { $exists: false }
    });

    console.log(`📊 Found ${questionsToUpdate.length} questions to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const question of questionsToUpdate) {
      if (question.createdBy) {
        // If question has createdBy, use it as actualCreator
        question.actualCreator = question.createdBy;
        await question.save();
        updated++;
        console.log(`✅ Updated question ${question._id} - actualCreator set to ${question.createdBy}`);
      } else {
        // If question is anonymous and has no createdBy, we can't migrate it
        console.log(`⚠️  Skipped question ${question._id} - no createdBy found (anonymous)`);
        skipped++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${questionsToUpdate.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateActualCreator();
