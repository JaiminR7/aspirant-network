import { faker } from '@faker-js/faker';

import Question from '../../models/Question.js';
import Resource from '../../models/Resource.js';
import Story from '../../models/Story.js';
import Subject from '../../models/Subject.js';
import Topic from '../../models/Topic.js';
import allowedCommentsModule from '../../constants/allowedComments.js';

import {
  createEngagementTier,
  createTags,
  randomDateAfter,
  randomInt,
  randomSocialDate,
  selectUniqueUsers
} from './utils.mjs';

const { COMMENT_MAP } = allowedCommentsModule;
const RESOURCE_COMMENT_TEXTS = COMMENT_MAP.resource;
const STORY_COMMENT_TEXTS = COMMENT_MAP.story;

const QUESTION_PREFIXES = [
  'How do you approach',
  'Need help with',
  'What is the best way to solve',
  'Can someone explain',
  'I am stuck on',
  'Any strategy for'
];

const STORY_TYPES = [
  'Success',
  'Journey',
  'Tips',
  'Motivation',
  'Experience',
  'Strategy'
];

const RESOURCE_TYPES = ['PDF', 'Image', 'Link', 'Video'];

const QUESTION_DESCRIPTION_TEMPLATES = [
  'I tried two methods but I still get different answers. Can someone point out what I might be missing?',
  'I understand the concept, but I get stuck while applying it in timed practice. Looking for a simple strategy.',
  'I solved this once, but I cannot reproduce the same steps consistently. Need a reliable approach.',
  'I am unsure which rule should be applied first in this type of question. Please suggest the right order.',
  'I made notes on this topic, yet I lose marks in similar problems. Need help identifying common mistakes.',
  'I can solve easy variants, but medium-level questions take too long. Any exam-focused shortcut?',
  'I know the formula but selecting the correct values is confusing me. Can someone share a quick checklist?',
  'I compared two reference methods and got conflicting logic. Which approach is safer in the exam?',
  'I want to build accuracy first, then speed. How should I practice this topic over the next week?',
  'I am revising this chapter and want a clear decision flow for solving these questions under pressure.'
];

const RESOURCE_TITLE_TEMPLATES = [
  'Exam Revision Notes',
  'Topic-Wise Quick Reference',
  'Last Minute Formula Sheet',
  'Concept Checklist for Practice',
  'Error Log and Correction Guide',
  'Speed Improvement Practice Set',
  'Important PYQ Pattern Summary',
  'High-Yield Concepts Compilation',
  'Smart Revision Planner',
  'Mock-Test Analysis Framework'
];

const RESOURCE_DESCRIPTION_TEMPLATES = [
  'Concise material focused on quick revision and high-frequency concepts.',
  'Structured notes for improving accuracy before mock tests.',
  'Compact guide designed for rapid recall during final preparation days.',
  'Practical reference to reduce confusion in repeated problem types.',
  'Revision-ready content with exam-oriented organization.',
  'Useful summary for maintaining consistency in daily practice.',
  'Clear, topic-focused material suitable for short revision sessions.',
  'A simple and reliable resource for pre-test recap.',
  'Focused notes to support speed and confidence in solving questions.',
  'Well-arranged content for aspirants preparing under time pressure.'
];

const STORY_TITLE_TEMPLATES = [
  'How I Improved My Consistency in Preparation',
  'What Changed After My Mock Test Review',
  'My Weekly Strategy That Finally Worked',
  'From Confusion to Clarity in Exam Prep',
  'Lessons I Learned from Repeated Mistakes',
  'How I Balanced Speed and Accuracy',
  'My Practical Routine for Better Revision',
  'A Realistic Plan That Reduced My Stress',
  'How I Rebuilt Momentum After a Bad Week',
  'Small Changes That Improved My Scores'
];

const STORY_CONTENT_TEMPLATES = [
  'I was studying regularly but not improving in scores. I started tracking mistakes by category and revised only those weak spots for a week. That one change made my practice more focused and less stressful.',
  'My preparation improved when I shifted from long study sessions to short, fixed blocks with clear goals. I also reviewed one mock every weekend and wrote down three action points before the next test.',
  'I used to jump between too many resources. After limiting myself to one primary source per topic, my revision became faster and I retained concepts better during timed practice.',
  'I struggled with confidence after a few low scores. Instead of increasing study hours, I improved my process: daily recap, error log updates, and targeted drills for common mistakes.',
  'The biggest change for me was practicing decision-making, not just solutions. I started each question by identifying the method first, which reduced careless errors and saved time.',
  'I noticed my mock score dropped whenever I skipped revision. So I created a simple rotation plan and followed it strictly. Consistent revision gave me better stability across tests.',
  'I was overthinking difficult questions and losing easy marks. I trained myself to mark and move, then return later. This improved both attempt rate and final accuracy.',
  'For one month, I tracked time spent per topic and adjusted my plan weekly. The data helped me focus on high-impact areas and avoid wasting effort on low-priority tasks.',
  'My turning point was discussing mistakes with peers instead of hiding them. Explaining where I got stuck helped me fix conceptual gaps much faster than solo revision.',
  'I stopped chasing perfect schedules and built a realistic routine I could sustain. Small daily wins gave better long-term progress than occasional intense sessions.'
];

const stableHash = (value) => {
  let hash = 0;
  const str = String(value || '');

  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash;
};

const getShuffledTemplates = (baseTemplates, seed) =>
  [...baseTemplates].sort((a, b) => {
    const scoreA = stableHash(`${seed}|${a}`);
    const scoreB = stableHash(`${seed}|${b}`);
    return scoreA - scoreB;
  });

const pickStructuredText = (templates, seed, index = 0) => {
  const ordered = getShuffledTemplates(templates, seed);
  return ordered[index % ordered.length];
};

const getCountByTier = (tier, ranges) => {
  if (tier === 'high') return randomInt(ranges.high[0], ranges.high[1]);
  if (tier === 'medium') return randomInt(ranges.medium[0], ranges.medium[1]);
  if (tier === 'low') return randomInt(ranges.low[0], ranges.low[1]);
  return 0;
};

const getRandomVoteArrays = (users, authorId, tier) => {
  const available = users.filter((u) => u._id.toString() !== authorId.toString());
  const maxPossible = available.length;

  const likeCount = Math.min(
    maxPossible,
    getCountByTier(tier, {
      high: [10, 30],
      medium: [4, 14],
      low: [0, 5]
    })
  );

  const remaining = Math.max(0, maxPossible - likeCount);
  const dislikeCount = Math.min(
    remaining,
    getCountByTier(tier, {
      high: [0, 7],
      medium: [0, 5],
      low: [0, 3]
    })
  );

  const reactors = selectUniqueUsers(available, likeCount + dislikeCount);

  return {
    upvotes: reactors.slice(0, likeCount).map((u) => u._id),
    downvotes: reactors.slice(likeCount, likeCount + dislikeCount).map((u) => u._id)
  };
};

const getResourceContentByType = (type) => {
  if (type === 'PDF') {
    return {
      url: faker.internet.url(),
      publicId: `seed-pdf-${faker.string.uuid()}`,
      fileName: `${faker.word.words({ count: { min: 2, max: 4 } }).replace(/\s+/g, '-')}.pdf`,
      fileSize: randomInt(120000, 5200000),
      mimeType: 'application/pdf',
      thumbnailUrl: faker.image.urlPicsumPhotos({ width: 320, height: 200 })
    };
  }

  if (type === 'Image') {
    return {
      url: faker.image.urlPicsumPhotos({ width: 1280, height: 720 }),
      publicId: `seed-image-${faker.string.uuid()}`,
      fileName: `${faker.word.words({ count: { min: 1, max: 3 } }).replace(/\s+/g, '-')}.jpg`,
      fileSize: randomInt(60000, 1800000),
      mimeType: 'image/jpeg',
      thumbnailUrl: faker.image.urlPicsumPhotos({ width: 320, height: 200 })
    };
  }

  if (type === 'Video') {
    return {
      externalLink: faker.internet.url(),
      thumbnailUrl: faker.image.urlPicsumPhotos({ width: 320, height: 200 })
    };
  }

  return {
    externalLink: faker.internet.url()
  };
};

const getSubjectTopicPairs = async (exam) => {
  const subjects = await Subject.find({ exam, isActive: true }).select('_id name').lean();
  if (subjects.length === 0) {
    throw new Error(
      `No subjects found for ${exam}. Please run subject/topic seed first (npm run seed:subjects if available).`
    );
  }

  const topics = await Topic.find({ exam, isActive: true }).select('_id name subject').lean();
  const topicsBySubject = new Map();

  topics.forEach((topic) => {
    const key = topic.subject.toString();
    if (!topicsBySubject.has(key)) {
      topicsBySubject.set(key, []);
    }
    topicsBySubject.get(key).push(topic);
  });

  const pairs = [];
  subjects.forEach((subject) => {
    const subjectTopics = topicsBySubject.get(subject._id.toString()) || [];
    subjectTopics.forEach((topic) => {
      pairs.push({
        subjectId: subject._id,
        subjectName: subject.name,
        topicId: topic._id,
        topicName: topic.name
      });
    });
  });

  if (pairs.length === 0) {
    throw new Error(`No subject-topic pairs found for ${exam}.`);
  }

  return pairs;
};

export const seedFeedContent = async ({ users, exam }) => {
  const pairs = await getSubjectTopicPairs(exam);

  const questionsTarget = randomInt(30, 90);
  const resourcesTarget = randomInt(20, 70);
  const storiesTarget = randomInt(20, 60);

  const questionDocs = [];
  const resourceDocs = [];
  const storyDocs = [];

  for (let i = 0; i < questionsTarget; i += 1) {
    const author = faker.helpers.arrayElement(users);
    const pair = faker.helpers.arrayElement(pairs);
    const tier = createEngagementTier();
    const createdAt = randomSocialDate();
    const { upvotes, downvotes } = getRandomVoteArrays(users, author._id, tier);

    questionDocs.push({
      title: `${faker.helpers.arrayElement(QUESTION_PREFIXES)} ${pair.topicName.toLowerCase()}?`,
      description: pickStructuredText(
        QUESTION_DESCRIPTION_TEMPLATES,
        `${exam}|question|${pair.topicName}|${createdAt.toISOString()}`
      ),
      exam,
      subject: pair.subjectId,
      subjectName: pair.subjectName,
      topic: pair.topicId,
      topicName: pair.topicName,
      createdBy: author._id,
      systemTags: createTags(1, 3),
      userTags: createTags(0, 3),
      upvotes,
      downvotes,
      answerCount: getCountByTier(tier, {
        high: [4, 12],
        medium: [1, 6],
        low: [0, 3]
      }),
      isSolved: faker.datatype.boolean({ probability: 0.2 }),
      createdAt,
      updatedAt: randomDateAfter(createdAt),
      lastActivityAt: randomDateAfter(createdAt)
    });
  }

  for (let i = 0; i < resourcesTarget; i += 1) {
    const author = faker.helpers.arrayElement(users);
    const pair = faker.helpers.arrayElement(pairs);
    const tier = createEngagementTier();
    const createdAt = randomSocialDate();
    const { upvotes, downvotes } = getRandomVoteArrays(users, author._id, tier);
    const type = faker.helpers.arrayElement(RESOURCE_TYPES);

    const commentCount = getCountByTier(tier, {
      high: [3, 9],
      medium: [1, 4],
      low: [0, 2]
    });

    const commenters = selectUniqueUsers(users, commentCount, author._id);
    const shuffledResourceComments = getShuffledTemplates(
      RESOURCE_COMMENT_TEXTS,
      `${exam}|resource|${createdAt.toISOString()}`
    );
    const usedResourceUserIds = new Set();
    const usedResourceTexts = new Set();
    const resourceComments = [];

    commenters.forEach((u, index) => {
      const userId = u._id.toString();
      const commentText = shuffledResourceComments[index % shuffledResourceComments.length];

      if (usedResourceUserIds.has(userId) || usedResourceTexts.has(commentText)) {
        return;
      }

      usedResourceUserIds.add(userId);
      usedResourceTexts.add(commentText);
      resourceComments.push({
        commentedBy: u._id,
        content: commentText,
        isAnonymous: faker.datatype.boolean({ probability: 0.1 }),
        createdAt: randomDateAfter(createdAt)
      });
    });

    resourceDocs.push({
      title: `${pickStructuredText(
        RESOURCE_TITLE_TEMPLATES,
        `${exam}|resource-title|${pair.topicName}|${createdAt.toISOString()}`
      )} - ${pair.topicName}`,
      description: pickStructuredText(
        RESOURCE_DESCRIPTION_TEMPLATES,
        `${exam}|resource-description|${pair.topicName}|${createdAt.toISOString()}`
      ),
      exam,
      subject: pair.subjectId,
      subjectName: pair.subjectName,
      topic: pair.topicId,
      topicName: pair.topicName,
      createdBy: author._id,
      type,
      content: getResourceContentByType(type),
      systemTags: createTags(1, 3),
      userTags: createTags(0, 3),
      upvotes,
      downvotes,
      comments: resourceComments,
      commentCount: resourceComments.length,
      downloadCount: getCountByTier(tier, {
        high: [20, 120],
        medium: [5, 40],
        low: [0, 12]
      }),
      isVerified: faker.datatype.boolean({ probability: 0.15 }),
      createdAt,
      updatedAt: randomDateAfter(createdAt)
    });
  }

  for (let i = 0; i < storiesTarget; i += 1) {
    const author = faker.helpers.arrayElement(users);
    const tier = createEngagementTier();
    const createdAt = randomSocialDate();
    const { upvotes, downvotes } = getRandomVoteArrays(users, author._id, tier);

    const commentCount = getCountByTier(tier, {
      high: [3, 10],
      medium: [1, 5],
      low: [0, 2]
    });

    const commenters = selectUniqueUsers(users, commentCount, author._id);
    const shuffledStoryComments = getShuffledTemplates(
      STORY_COMMENT_TEXTS,
      `${exam}|story|${createdAt.toISOString()}`
    );
    const usedStoryUserIds = new Set();
    const usedStoryTexts = new Set();
    const storyComments = [];

    commenters.forEach((u, index) => {
      const userId = u._id.toString();
      const commentText = shuffledStoryComments[index % shuffledStoryComments.length];

      if (usedStoryUserIds.has(userId) || usedStoryTexts.has(commentText)) {
        return;
      }

      usedStoryUserIds.add(userId);
      usedStoryTexts.add(commentText);
      storyComments.push({
        user: u._id,
        content: commentText,
        isAnonymous: faker.datatype.boolean({ probability: 0.08 }),
        createdAt: randomDateAfter(createdAt)
      });
    });

    storyDocs.push({
      title: pickStructuredText(
        STORY_TITLE_TEMPLATES,
        `${exam}|story-title|${createdAt.toISOString()}`
      ),
      content: pickStructuredText(
        STORY_CONTENT_TEMPLATES,
        `${exam}|story-content|${createdAt.toISOString()}`
      ),
      exam,
      storyType: faker.helpers.arrayElement(STORY_TYPES),
      author: author._id,
      isAnonymous: faker.datatype.boolean({ probability: 0.1 }),
      tags: createTags(1, 5),
      upvotes,
      downvotes,
      comments: storyComments,
      isFeatured: tier === 'high' && faker.datatype.boolean({ probability: 0.25 }),
      status: 'Published',
      createdAt,
      updatedAt: randomDateAfter(createdAt)
    });
  }

  const [questions, resources, stories] = await Promise.all([
    Question.insertMany(questionDocs, { ordered: false }),
    Resource.insertMany(resourceDocs, { ordered: false }),
    Story.insertMany(storyDocs, { ordered: false })
  ]);

  return {
    questions: questions.length,
    resources: resources.length,
    stories: stories.length
  };
};
