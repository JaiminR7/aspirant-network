const mongoose = require('mongoose');
const User = require('../../models/User');
require('dotenv').config();

async function cleanupAndTag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Tag seeded users (based on mail.com provider)
    const seededResult = await User.updateMany(
      { email: /@mail\.com$/ },
      { $set: { isSeeded: true, legacyAccount: false } }
    );
    console.log(`Tagged ${seededResult.modifiedCount} users as seeded.`);

    // 2. Tag real legacy users (not seeded, no clerkId yet)
    const legacyResult = await User.updateMany(
      { 
        isSeeded: { $ne: true }, 
        clerkId: { $exists: false },
        email: { $not: /@mail\.com$/ }
      },
      { $set: { legacyAccount: true, isSeeded: false } }
    );
    console.log(`Tagged ${legacyResult.modifiedCount} users as legacy accounts.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanupAndTag();
