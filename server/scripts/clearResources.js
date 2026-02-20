/**
 * Clear all resources from database
 * Run with: node scripts/clearResources.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');

const clearResources = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Resource.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} resources`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearResources();
