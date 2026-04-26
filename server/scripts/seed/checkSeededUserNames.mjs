import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../../models/User.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aspirant-network');
  const users = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name username')
    .lean();

  users.forEach((user) => {
    console.log(`${user.name} | @${user.username}`);
  });

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
