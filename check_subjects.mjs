import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from './server/models/Subject.js';

dotenv.config({ path: './server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await Subject.countDocuments({});
  const exams = await Subject.distinct('exam');
  console.log('Total subjects:', count);
  console.log('Exams found:', exams);
  await mongoose.disconnect();
}

check();
