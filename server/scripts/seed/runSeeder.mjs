import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Interaction from '../../models/Interaction.js';
import Question from '../../models/Question.js';
import Resource from '../../models/Resource.js';
import Story from '../../models/Story.js';

import { getSeedConfig } from './config.mjs';
import { seedUsers } from './seedUsers.mjs';
import { seedPosts } from './seedPosts.mjs';
import { seedComments } from './seedComments.mjs';
import { seedInteractions } from './seedInteractions.mjs';
import { seedFeedContent } from './seedFeedContent.mjs';

dotenv.config();

const log = (message) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${message}`);
};

const clearCollections = async ({ clearUsers, exam }) => {
  log('Clearing existing seed target collections...');

  await Interaction.deleteMany({});
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await Question.deleteMany({ exam });
  await Resource.deleteMany({ exam });
  await Story.deleteMany({ exam });

  if (clearUsers) {
    await User.deleteMany({ role: 'user' });
  }
};

const run = async () => {
  const config = getSeedConfig();

  log('Starting database seed process...');
  log(
    `Configuration: users=${config.usersCount}, posts=${config.postsCount}, exam=${config.exam}, clearExisting=${config.clearExisting}, clearUsers=${config.clearUsers}`
  );

  await mongoose.connect(config.mongodbUri);
  log(`Connected to MongoDB: ${mongoose.connection.name}`);

  try {
    if (config.clearExisting) {
      await clearCollections({ clearUsers: config.clearUsers, exam: config.exam });
      log('Collections cleared successfully.');
    }

    log('Seeding users...');
    const users = await seedUsers({
      count: config.usersCount,
      exam: config.exam,
      bcryptRounds: config.bcryptRounds
    });
    log(`Users seeded: ${users.length}`);

    log('Seeding feed content for all exams...');
    const SUPPORTED_EXAMS = ['JEE', 'NEET', 'GATE', 'CAT', 'UPSC', 'SSC', 'Bank Exams', 'Other'];
    const totalFeedCounts = { questions: 0, resources: 0, stories: 0, posts: 0 };

    for (const examName of SUPPORTED_EXAMS) {
      log(`Seeding feed content for ${examName}...`);
      try {
        const feedCounts = await seedFeedContent({ users, exam: examName });
        totalFeedCounts.questions += feedCounts.questions;
        totalFeedCounts.resources += feedCounts.resources;
        totalFeedCounts.stories += feedCounts.stories;
        totalFeedCounts.posts += feedCounts.posts;
        log(`  -> ${examName} done: q:${feedCounts.questions}, r:${feedCounts.resources}, s:${feedCounts.stories}, p:${feedCounts.posts}`);
      } catch (error) {
        log(`  -> Failed seeding ${examName}: ${error.message}`);
      }
    }

    log(
      `Feed items seeded -> questions: ${totalFeedCounts.questions}, resources: ${totalFeedCounts.resources}, stories: ${totalFeedCounts.stories}, total feed posts: ${totalFeedCounts.posts}`
    );

    const [usersTotal, postsTotal, commentsTotal, interactionsTotal, questionsTotal, resourcesTotal, storiesTotal] =
      await Promise.all([
        User.countDocuments({}),
        Post.countDocuments({}),
        Comment.countDocuments({}),
        Interaction.countDocuments({}),
        Question.countDocuments({ exam: config.exam }),
        Resource.countDocuments({ exam: config.exam }),
        Story.countDocuments({ exam: config.exam, status: 'Published' })
      ]);

    log('Seed process completed successfully.');
    log(
      `Database totals -> users: ${usersTotal}, posts: ${postsTotal}, comments: ${commentsTotal}, interactions: ${interactionsTotal}, questions(${config.exam}): ${questionsTotal}, resources(${config.exam}): ${resourcesTotal}, stories(${config.exam}): ${storiesTotal}`
    );
  } catch (error) {
    log(`Seeding failed: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
    log('MongoDB connection closed.');
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
