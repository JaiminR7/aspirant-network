import { faker } from '@faker-js/faker';

import mongoose from 'mongoose';
import Question from '../../models/Question.js';
import Resource from '../../models/Resource.js';
import Story from '../../models/Story.js';
import Post from '../../models/Post.js';
import Comment from '../../models/Comment.js';
import Subject from '../../models/Subject.js';
import Topic from '../../models/Topic.js';
import Interaction from '../../models/Interaction.js';
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

const EXAM_TAGS = {
  JEE: ['Physics', 'Chemistry', 'Maths', 'JEE2026', 'PYQ', 'MockTest', 'NTA', 'Revision'],
  NEET: ['Biology', 'NCERT', 'Anatomy', 'NEET2026', 'MockTest', 'Revision'],
  GATE: ['Aptitude', 'OS', 'DBMS', 'CN', 'PYQ', 'Gate2026'],
  CAT: ['VARC', 'DILR', 'Quant', 'Percentile', 'Mocks', 'CAT2026'],
  UPSC: ['Polity', 'GS', 'Prelims', 'Mains', 'Ethics', 'CurrentAffairs'],
  SSC: ['Reasoning', 'Quant', 'English', 'SSC2026', 'CGL'],
  'Bank Exams': ['Reasoning', 'DI', 'GA', 'IBPS', 'SBI', 'Banking'],
  Other: ['StudyTips', 'AspirantLife', 'Motivation', 'PrepStrategy', 'ExamPrep']
};

const getExamTags = (exam, count = 2) => {
  const pool = EXAM_TAGS[exam] || EXAM_TAGS.Other;
  return faker.helpers.arrayElements(pool, Math.min(count, pool.length));
};

const QUESTION_TITLES = {
  JEE: [
    'How to handle inorganic chemistry memorization for JEE?',
    'Best books for JEE Advanced Physics problem solving?',
    'How to improve speed in JEE Main Math section?',
    'Is NCERT enough for JEE Main Chemistry?',
    'Solving 2023 PYQs - stuck on a complex number problem.'
  ],
  NEET: [
    'Tips to memorize biology examples in NCERT for NEET?',
    'How to tackle physics numericals as a biology student?',
    'Important chapters in Organic Chemistry for NEET 2024?',
    'How to score 340+ in NEET Biology?',
    'Best revision strategy for the last 2 months of NEET.'
  ],
  GATE: [
    'How to revise thermodynamics formulas effectively for GATE?',
    'How many PYQs should I solve daily for GATE prep?',
    'Best strategy to improve score in Engineering Mathematics?',
    'Is it worth attempting GATE in final year of BTech?',
    'Resources for Electronics and Communication core subjects.'
  ],
  CAT: [
    'How to improve RC accuracy in CAT?',
    'Best way to solve tough LRDI sets under time pressure?',
    'Quant strategy for improving speed without losing accuracy?',
    'How to manage CAT prep with a full-time job?',
    'Mock analysis template for CAT - what to track?'
  ],
  UPSC: [
    'How to structure GS2 answers to score better in mains?',
    'How to balance current affairs and static subjects for UPSC?',
    'Best way to improve answer writing speed for UPSC mains?',
    'Ethics paper strategy - how to approach case studies?',
    'Is daily newspaper reading essential for UPSC prelims?'
  ],
  SSC: [
    'Best English grammar resources for SSC CGL Tier 2?',
    'Shortcuts for Quant section in SSC exams?',
    'How to prepare General Awareness for SSC CGL?',
    'Daily routine for SSC preparation for beginners.',
    'Mock test frequency for SSC CGL - how many per week?'
  ],
  'Bank Exams': [
    'How to improve speed in Data Interpretation for Bank PO?',
    'Banking awareness notes for SBI PO interview.',
    'Logical reasoning strategy for IBPS Clerk Mains.',
    'How to manage GA section in 15 minutes?',
    'Best mock series for Bank Exams preparation.'
  ],
  Other: [
    'General strategy for competitive exams preparation.',
    'How to stay motivated during a long gap year?',
    'Effective time management for aspirants.',
    'How to build a sustainable study routine?',
    'Digital vs Physical notes - what works best?'
  ]
};

const RESOURCE_TITLES = {
  JEE: [
    'JEE Physics formula sheet for all chapters',
    'Organic Chemistry reaction mechanisms PDF',
    'JEE Main 2023 January session solved papers',
    'Maths short notes for quick revision'
  ],
  NEET: [
    'NCERT Biology diagrams and labels compilation',
    'NEET 2024 revision checklist - all subjects',
    'Physics numericals workbook with solutions',
    'Chemistry periodic table trends summary'
  ],
  GATE: [
    'Important notes for thermodynamics and heat transfer',
    'GATE aptitude rapid revision PDF',
    'Control systems formula sheet and solved examples',
    'Mathematics high-yield topics workbook'
  ],
  CAT: [
    'Important notes for CAT RC and critical reasoning',
    'High-yield LRDI practice set with solutions',
    'Quant shortcut sheet for CAT revision',
    'DILR set types and approach framework'
  ],
  UPSC: [
    'UPSC polity quick revision notes PDF',
    'Current affairs monthly compilation for prelims',
    'Mains answer writing framework and examples',
    'Modern History timeline for UPSC revision'
  ],
  SSC: [
    'SSC CGL English vocabulary PDF (1000 words)',
    'Maths tricks and shortcuts for SSC exams',
    'General Awareness static GK notes',
    'SSC Reasoning practice set with solutions'
  ],
  'Bank Exams': [
    'Banking and Financial Awareness notes 2024',
    'High-level DI questions for Bank PO',
    'Puzzle and Seating Arrangement practice PDF',
    'English comprehension drills for Bank exams'
  ],
  Other: [
    'General aptitude and mental ability workbook',
    'Study planning and tracking templates',
    'Time management worksheets for aspirants',
    'Goal setting and progress tracker PDF'
  ]
};

const STORY_TITLES = {
  JEE: [
    'How I improved my mock scores from 120 to 220 in JEE',
    'My JEE Advanced preparation journey - from basics to rank',
    'Staying positive after a low percentile in the first attempt'
  ],
  NEET: [
    'Cracking NEET in my second attempt - what I did differently',
    'My journey of improving Physics score from 40 to 140',
    'Balancing school and NEET preparation effectively'
  ],
  GATE: [
    'How I improved my GATE rank with consistent revision',
    'My GATE preparation journey from basics to confidence',
    'What helped me crack GATE after multiple mock setbacks'
  ],
  CAT: [
    'How I improved from 72 to 96 percentile in CAT',
    'My 90-day CAT comeback plan that actually worked',
    'From weak VARC to strong score: my CAT journey'
  ],
  UPSC: [
    'How I stayed consistent during UPSC preparation',
    'My UPSC mains answer-writing transformation journey',
    'What changed when I moved from random study to strategy'
  ],
  SSC: [
    'My journey of clearing SSC CGL after 2 years of struggle',
    'How I mastered English section for SSC despite being weak',
    'Staying motivated during the long SSC recruitment cycle'
  ],
  'Bank Exams': [
    'Cleared SBI PO in first attempt - sharing my strategy',
    'From private job to Banking - my career transition journey',
    'Mastering Data Interpretation: how I cracked Bank PO'
  ],
  Other: [
    'My story of consistent effort and eventual success',
    'Overcoming exam anxiety and staying focused',
    'How I found my passion through competitive prep'
  ]
};

const QUESTION_DESCRIPTIONS = {
  JEE: [
    'Inorganic chemistry memorization is tough. How to handle it?',
    'Best advanced physics problem solving books recommendations?',
    'Speed improvement tips for JEE Main Math section.',
    'Evaluating if NCERT is sufficient for JEE Main Chemistry.',
    'Solving 2023 PYQs - need help with complex numbers.'
  ],
  NEET: [
    'Memorizing biology examples from NCERT - best tips?',
    'NEET physics numericals strategy for biology students.',
    'High-yield Organic Chemistry chapters for NEET 2024.',
    'Scoring 340+ in Biology: my daily routine and focus.',
    'Last 2 months revision strategy for NEET aspirants.'
  ],
  GATE: [
    'Effective formula revision for Thermodynamics and core subjects.',
    'How many PYQs to solve daily for consistent GATE score improvement?',
    'Engineering Mathematics high-yield topic strategy.',
    'Pros and cons of attempting GATE in the final year.',
    'Core subject resources for Electronics and Communication.'
  ],
  CAT: [
    'RC accuracy improvement drills and passage selection tips.',
    'LRDI set selection strategy under exam pressure.',
    'Quant section speed vs accuracy - how to balance?',
    'CAT preparation tips for working professionals.',
    'Mock analysis framework for stagnant scores.'
  ],
  UPSC: [
    'GS2 Mains answer writing structure and examples.',
    'Balancing current affairs with static GS syllabus.',
    'Speed improvement for UPSC Mains answer writing.',
    'GS4 Ethics case study approach and keywords.',
    'Is daily newspaper reading mandatory for prelims?'
  ],
  SSC: [
    'English Grammar resources for CGL Tier 2 prep.',
    'Quantitative shortcuts for SSC CGL Tier 1 and 2.',
    'General Awareness static GK revision plan.',
    'Daily routine for beginners starting SSC journey.',
    'Optimal mock test frequency for SSC CGL.'
  ],
  'Bank Exams': [
    'Data Interpretation speed building for Bank PO Mains.',
    'Banking Awareness notes for SBI and IBPS interviews.',
    'Logical Reasoning strategy for Clerk Mains exam.',
    'Managing General Awareness section in 15 minutes.',
    'Best mock test series comparison for Banking exams.'
  ],
  Other: [
    'General competitive exam strategy and foundation building.',
    'Staying motivated during long gap years or preparation phases.',
    'Effective time management for serious aspirants.',
    'Building a sustainable study routine for long term success.',
    'Note making: Digital vs Physical - what works best?'
  ]
};

const RESOURCE_DESCRIPTIONS = {
  JEE: [
    'Comprehensive Physics formula sheet for quick revision.',
    'Reaction mechanisms guide for Organic Chemistry.',
    'Solved papers compilation for JEE Main 2023.',
    'Math short notes focused on high-weightage topics.'
  ],
  NEET: [
    'Visual guide for NCERT Biology diagrams and labels.',
    'NEET 2024 full syllabus revision checklist.',
    'Physics numericals workbook with 500+ solved problems.',
    'One-page summary of periodic table trends and exceptions.'
  ],
  GATE: [
    'Thermodynamics and Heat Transfer revision notes PDF.',
    'Aptitude tricks and previous exam patterns compilation.',
    'Control systems formula sheet and solved examples.',
    'Mathematics high-yield topic-wise solved workbook.'
  ],
  CAT: [
    'RC practice plan and error log template for CAT.',
    'LRDI high-yield sets with approach framework.',
    'Quant shortcut sheet for arithmetic and algebra.',
    'DILR set types and selection logic guide.'
  ],
  UPSC: [
    'UPSC Polity articles and judgments quick revision PDF.',
    'Monthly Current Affairs compilation for GS papers.',
    'Mains answer writing intro-body-conclusion framework.',
    'Modern History timeline (1757-1947) for UPSC.'
  ],
  SSC: [
    'SSC CGL high-frequency English vocabulary PDF.',
    'Mathematical shortcuts for arithmetic and geometry.',
    'Static GK compilation for General Awareness section.',
    'Reasoning practice set with verbal and non-verbal logic.'
  ],
  'Bank Exams': [
    'Banking and Financial Awareness terminology guide 2024.',
    'Advanced level DI sets for Bank PO Mains preparation.',
    'Puzzle and Seating Arrangement practice drills.',
    'English Comprehension strategy for Banking Mains.'
  ],
  Other: [
    'General Aptitude and Reasoning foundation workbook.',
    'Study planning and tracking templates for aspirants.',
    'Time management exercises for long study sessions.',
    'Guide for starting competitive preparation from scratch.'
  ]
};

const STORY_DESCRIPTIONS = {
  JEE: [
    'How I improved my mock scores from 120 to 220 in JEE.',
    'My JEE Advanced journey - from basics to rank.',
    'Staying positive after a low percentile in attempt 1.'
  ],
  NEET: [
    'Cracking NEET in attempt 2 - what I changed.',
    'Improving Physics score from 40 to 140 - my strategy.',
    'Balancing school boards and NEET prep successfully.'
  ],
  GATE: [
    'Improving rank with subject rotation and tests.',
    'Basics to confidence - my GATE preparation journey.',
    'Cracking GATE after setbacks in mock test scores.'
  ],
  CAT: [
    'Improving from 72 to 96 percentile - my CAT journey.',
    '90-day CAT comeback plan that actually delivered results.',
    'VARC strategy: building comprehension from scratch.'
  ],
  UPSC: [
    'Consistency and answer writing transformation in UPSC.',
    'Mains answer writing strategy: from random to structured.',
    'Balancing GS and Current Affairs revision cycles.'
  ],
  SSC: [
    'Clearing SSC CGL after 2 years of struggle and failure.',
    'Mastering English section for CGL - step by step.',
    'Survival tips for long recruitment cycles in SSC.'
  ],
  'Bank Exams': [
    'Clearing SBI PO in first attempt - my core strategy.',
    'Career transition from private job to Banking sector.',
    'Mastering Puzzles and DI for Bank PO Mains.'
  ],
  Other: [
    'My story of resilience and eventual success in exams.',
    'Overcoming anxiety and building a focused mindset.',
    'How preparation changed my outlook towards learning.'
  ]
};

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

  const questionsTarget = randomInt(15, 25);
  const resourcesTarget = randomInt(10, 15);
  const storiesTarget = randomInt(5, 10);

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
      _id: new mongoose.Types.ObjectId(),
      title: faker.helpers.arrayElement(QUESTION_TITLES[exam] || QUESTION_TITLES.Other),
      description: faker.helpers.arrayElement(QUESTION_DESCRIPTIONS[exam] || QUESTION_DESCRIPTIONS.Other),
      exam,
      subject: pair.subjectId,
      subjectName: pair.subjectName,
      topic: pair.topicId,
      topicName: pair.topicName,
      createdBy: author._id,
      systemTags: getExamTags(exam, randomInt(1, 2)),
      userTags: getExamTags(exam, randomInt(1, 2)),
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
      _id: new mongoose.Types.ObjectId(),
      title: `${faker.helpers.arrayElement(RESOURCE_TITLES[exam] || RESOURCE_TITLES.Other)} - ${pair.topicName}`,
      description: faker.helpers.arrayElement(RESOURCE_DESCRIPTIONS[exam] || RESOURCE_DESCRIPTIONS.Other),
      exam,
      subject: pair.subjectId,
      subjectName: pair.subjectName,
      topic: pair.topicId,
      topicName: pair.topicName,
      user: author._id,
      createdBy: author._id,
      type,
      content: getResourceContentByType(type),
      systemTags: getExamTags(exam, randomInt(1, 2)),
      userTags: getExamTags(exam, randomInt(1, 2)),
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
      _id: new mongoose.Types.ObjectId(),
      title: faker.helpers.arrayElement(STORY_TITLES[exam] || STORY_TITLES.Other),
      content: faker.helpers.arrayElement(STORY_DESCRIPTIONS[exam] || STORY_DESCRIPTIONS.Other),
      exam,
      storyType: faker.helpers.arrayElement(STORY_TYPES),
      author: author._id,
      isAnonymous: faker.datatype.boolean({ probability: 0.1 }),
      tags: getExamTags(exam, randomInt(1, 3)),
      upvotes,
      downvotes,
      comments: storyComments,
      isFeatured: tier === 'high' && faker.datatype.boolean({ probability: 0.25 }),
      status: 'Published',
      createdAt,
      updatedAt: randomDateAfter(createdAt)
    });
  }

  // Insert specialized docs
  let questions = [];
  let resources = [];
  let stories = [];

  try {
    const results = await Promise.all([
      Question.insertMany(questionDocs, { ordered: false }),
      Resource.insertMany(resourceDocs, { ordered: false }),
      Story.insertMany(storyDocs, { ordered: false })
    ]);
    questions = results[0];
    resources = results[1];
    stories = results[2];
  } catch (error) {
    console.error(`Error during insertMany for ${exam}:`, error.message);
    if (error.writeErrors) {
      console.error(`Write errors: ${error.writeErrors.length}`);
      console.error(`Sample write error: ${JSON.stringify(error.writeErrors[0].err)}`);
    }
    // If ordered: false, some might have succeeded
    questions = await Question.find({ _id: { $in: questionDocs.map(d => d._id) } });
    resources = await Resource.find({ _id: { $in: resourceDocs.map(d => d._id) } });
    stories = await Story.find({ _id: { $in: storyDocs.map(d => d._id) } });
  }

  // Create feed posts
  const postDocs = [];

  questions.forEach(q => {
    postDocs.push({
      userId: q.createdBy,
      exam: q.exam,
      type: 'question',
      sourceModel: 'Question',
      sourceId: q._id,
      title: q.title,
      description: q.description,
      tags: [...(q.systemTags || []), ...(q.userTags || [])],
      isAnonymous: q.isAnonymous,
      likesCount: q.upvotes.length,
      dislikesCount: q.downvotes.length,
      commentsCount: q.answerCount,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    });
  });

  resources.forEach(r => {
    postDocs.push({
      userId: r.createdBy,
      exam: r.exam,
      type: 'resource',
      sourceModel: 'Resource',
      sourceId: r._id,
      title: r.title,
      description: r.description,
      tags: [...(r.systemTags || []), ...(r.userTags || [])],
      fileUrl: r.content?.url || null,
      fileType: r.content?.mimeType?.includes('pdf') ? 'pdf' : null,
      likesCount: r.upvotes.length,
      dislikesCount: r.downvotes.length,
      commentsCount: r.commentCount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    });
  });

  stories.forEach(s => {
    postDocs.push({
      userId: s.author,
      exam: s.exam,
      type: 'story',
      sourceModel: 'Story',
      sourceId: s._id,
      title: s.title,
      description: s.content,
      tags: s.tags || [],
      isAnonymous: s.isAnonymous,
      likesCount: s.upvotes.length,
      dislikesCount: s.downvotes.length,
      commentsCount: s.comments.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    });
  });

  // Insert Feed Posts
  let posts = [];
  try {
    posts = await Post.insertMany(postDocs, { ordered: false });
  } catch (error) {
    console.error(`[seed] Note: Some post documents for ${exam} failed (likely duplicates):`, error.message);
    // Fetch successfully inserted posts to ensure we can link comments
    posts = await Post.find({ 
      sourceId: { $in: postDocs.map(d => d.sourceId) },
      sourceModel: { $in: ['Question', 'Resource', 'Story'] }
    });
  }

  // Create standalone comments for resources and stories to ensure PostDetail renders them correctly
  const standaloneCommentDocs = [];
  
  // Map sourceId to post._id for comment linkage and interaction seeding
  const postMap = new Map(posts.map(p => [p.sourceId.toString(), p._id]));

  // Create Interaction records for all seeded votes to ensure count consistency
  const interactionDocs = [];
  
  questions.forEach(q => {
    const hubId = postMap.get(q._id.toString());
    if (!hubId) return;
    (q.upvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'like', createdAt: q.createdAt }));
    (q.downvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'dislike', createdAt: q.createdAt }));
  });

  resources.forEach(r => {
    const hubId = postMap.get(r._id.toString());
    if (!hubId) return;
    (r.upvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'like', createdAt: r.createdAt }));
    (r.downvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'dislike', createdAt: r.createdAt }));
  });

  stories.forEach(s => {
    const hubId = postMap.get(s._id.toString());
    if (!hubId) return;
    (s.upvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'like', createdAt: s.createdAt }));
    (s.downvotes || []).forEach(uId => interactionDocs.push({ userId: uId, postId: hubId, type: 'dislike', createdAt: s.createdAt }));
  });

  if (interactionDocs.length > 0) {
    try {
      await Interaction.insertMany(interactionDocs, { ordered: false });
    } catch (e) {
      console.warn(`[seed] Note: Some interaction records for ${exam} failed (likely duplicates):`, e.message);
    }
  }

  resources.forEach(r => {
    const hubPostId = postMap.get(r._id.toString());
    if (!hubPostId) return;

    r.comments.forEach(c => {
      standaloneCommentDocs.push({
        userId: c.commentedBy,
        postId: hubPostId,
        text: c.content,
        createdAt: c.createdAt,
        updatedAt: c.createdAt
      });
    });
  });

  stories.forEach(s => {
    const hubPostId = postMap.get(s._id.toString());
    if (!hubPostId) return;

    s.comments.forEach(c => {
      standaloneCommentDocs.push({
        userId: c.user,
        postId: hubPostId,
        text: c.content,
        createdAt: c.createdAt,
        updatedAt: c.createdAt
      });
    });
  });

  if (standaloneCommentDocs.length > 0) {
    try {
      await Comment.insertMany(standaloneCommentDocs, { ordered: false });
    } catch (err) {
      console.warn(`[seed] Some standalone comments for ${exam} failed to insert (likely unique constraint).`);
    }
  }

  return {
    questions: questions.length,
    resources: resources.length,
    stories: stories.length,
    posts: posts.length
  };
};
