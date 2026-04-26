import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Post from '../../models/Post.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aspirant-network');

  const [typeCounts, examCounts, resourceByExam, storyByExam, resourceFiles] = await Promise.all([
    Post.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Post.aggregate([{ $group: { _id: '$exam', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Post.aggregate([
      { $match: { type: 'resource' } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Post.aggregate([
      { $match: { type: 'story' } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Post.countDocuments({ type: 'resource', fileUrl: 'https://example.com/sample.pdf', fileType: 'pdf' })
  ]);

  console.log(
    JSON.stringify(
      {
        typeCounts,
        examCounts,
        resourceByExam,
        storyByExam,
        resourceFiles
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect error
  }
  process.exit(1);
});
