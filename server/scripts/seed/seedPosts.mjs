import { faker } from '@faker-js/faker';

import Post from '../../models/Post.js';
import {
  createEngagementTier,
  randomDateAfter,
  randomSocialDate
} from './utils.mjs';

const SUPPORTED_EXAMS = ['CAT', 'GATE', 'UPSC'];

const EXAM_TAGS = {
  CAT: ['rc', 'lrdi', 'quant', 'time-management', 'mock-analysis', 'varc'],
  GATE: ['thermodynamics', 'aptitude', 'signals', 'control-systems', 'network-theory', 'revision-notes'],
  UPSC: ['polity', 'economy', 'ethics', 'answer-writing', 'current-affairs', 'mains-strategy']
};

const QUESTION_TITLES = {
  CAT: [
    'How to improve RC accuracy in CAT?',
    'Best way to solve tough LRDI sets under time pressure?',
    'Quant strategy for improving speed without losing accuracy?'
  ],
  GATE: [
    'How to revise thermodynamics formulas effectively for GATE?',
    'How many PYQs should I solve daily for GATE prep?',
    'Best strategy to improve score in Engineering Mathematics?'
  ],
  UPSC: [
    'How to structure GS2 answers to score better in mains?',
    'How to balance current affairs and static subjects for UPSC?',
    'Best way to improve answer writing speed for UPSC mains?'
  ]
};

const RESOURCE_TITLES = {
  CAT: [
    'Important notes for CAT RC and critical reasoning',
    'High-yield LRDI practice set with solutions',
    'Quant shortcut sheet for CAT revision'
  ],
  GATE: [
    'Important notes for thermodynamics and heat transfer',
    'GATE aptitude rapid revision PDF',
    'Control systems formula sheet and solved examples'
  ],
  UPSC: [
    'UPSC polity quick revision notes PDF',
    'Current affairs monthly compilation for prelims',
    'Mains answer writing framework and examples'
  ]
};

const STORY_TITLES = {
  CAT: [
    'How I improved from 72 to 96 percentile in CAT',
    'My 90-day CAT comeback plan that actually worked',
    'From weak VARC to strong score: my CAT journey'
  ],
  GATE: [
    'How I improved my GATE rank with consistent revision',
    'My GATE preparation journey from basics to confidence',
    'What helped me crack GATE after multiple mock setbacks'
  ],
  UPSC: [
    'How I stayed consistent during UPSC preparation',
    'My UPSC mains answer-writing transformation journey',
    'What changed when I moved from random study to strategy'
  ]
};

const QUESTION_DESCRIPTIONS = {
  CAT: [
    'I am getting stuck in dense RC passages and my accuracy drops in mocks. I can eliminate two options but fail to pick the final one consistently. Please suggest a practical routine to improve comprehension and decision making.',
    'In LRDI, I spend too long selecting sets and lose marks despite knowing concepts. How do you decide quickly which set to attempt first and when to leave a set?',
    'My quant concepts are decent but I panic in timed sections. Looking for a section-wise attempt strategy that helps maximize attempts without silly mistakes.'
  ],
  GATE: [
    'I complete theory once but forget formulas after a week. Need a revision plan for thermodynamics and core subjects that keeps concepts fresh till the exam.',
    'I solve PYQs but repeat similar mistakes in numericals. How do you analyze error patterns and improve speed plus accuracy in GATE style questions?',
    'My aptitude section score is unstable. Any reliable daily plan for aptitude and engineering mathematics that works in the final 2 months?'
  ],
  UPSC: [
    'I know the content for GS answers but struggle to structure intros and conclusions under time pressure. Looking for a framework to improve mains answer quality.',
    'Current affairs notes keep piling up and revision is becoming difficult. How do you keep notes concise and still retain important facts for prelims and mains?',
    'My mock scores are fluctuating and confidence is dropping. Need guidance on balancing prelims MCQ practice with mains answer writing in the same week.'
  ]
};

const RESOURCE_DESCRIPTIONS = {
  CAT: [
    'This PDF includes a curated RC practice plan, error log template, and daily drills for improving verbal consistency in CAT mocks.',
    'Contains handpicked LRDI sets categorized by difficulty with step-by-step approach notes and common traps to avoid.',
    'A compact quant revision PDF covering arithmetic and algebra shortcuts with high-frequency question patterns.'
  ],
  GATE: [
    'This PDF combines thermodynamics formulas, concept maps, and solved examples useful for quick revision before mock tests.',
    'Aptitude revision file with topic-wise tricks, previous exam patterns, and short timed practice worksheets.',
    'Includes concise control systems notes and solved standard models for last-mile revision.'
  ],
  UPSC: [
    'Polity revision PDF covering constitutional articles, landmark judgments, and high-yield mains framing points.',
    'Monthly current affairs compilation with prelims pointers and mains value-add snippets.',
    'Answer writing resource containing intro-body-conclusion structures and sample GS responses.'
  ]
};

const STORY_DESCRIPTIONS = {
  CAT: [
    'I started with low mock scores and inconsistent revision. By focusing on sectional analysis, weekly error tracking, and a fixed mock-review cycle, I improved steadily. Sharing the exact routine that helped me build confidence.',
    'My biggest shift was reducing random resources and sticking to one plan. I followed a timed practice routine, revised mistakes every Sunday, and improved percentile gradually over 3 months.',
    'I was weak in VARC and avoided difficult passages. After daily reading drills and focused RC practice, I became comfortable with inference-based questions. Posting my strategy and timeline.'
  ],
  GATE: [
    'I moved from scattered preparation to a subject rotation plan with frequent tests. Weekly revision and formula sheets helped me retain concepts and improve my rank trajectory.',
    'My first mocks were discouraging, but analyzing mistakes and revisiting fundamentals changed everything. This post shares how I rebuilt my preparation system step by step.',
    'Consistency mattered more than long study hours. I kept daily targets realistic, tracked weak areas, and used PYQ-focused revision to gain momentum close to exam day.'
  ],
  UPSC: [
    'I struggled with consistency early on, but a simple study timetable and regular answer writing changed my preparation quality. Sharing what worked and what I stopped doing.',
    'My notes were too bulky at first. I shifted to concise one-page revisions and test-based learning, which improved both recall and confidence for prelims and mains.',
    'I learned that strategy matters as much as effort in UPSC prep. This is my journey of balancing GS coverage, current affairs, and revision cycles effectively.'
  ]
};

const ensurePostCount = (count) => {
  const bounded = Math.max(100, Math.min(150, Number(count) || 100));
  return bounded;
};

const buildTypePool = (totalPosts) => {
  const questionCount = Math.floor(totalPosts * 0.6);
  const resourceCount = Math.floor(totalPosts * 0.2);
  const storyCount = totalPosts - questionCount - resourceCount;

  const pool = [
    ...Array(questionCount).fill('question'),
    ...Array(resourceCount).fill('resource'),
    ...Array(storyCount).fill('story')
  ];

  return faker.helpers.shuffle(pool);
};

const buildExamSequence = (totalCount) => {
  const exams = faker.helpers.shuffle([...SUPPORTED_EXAMS]);
  return Array.from({ length: totalCount }, (_, index) => exams[index % exams.length]);
};

export const generateTitle = (exam, type) => {
  if (type === 'question') return faker.helpers.arrayElement(QUESTION_TITLES[exam]);
  if (type === 'resource') return faker.helpers.arrayElement(RESOURCE_TITLES[exam]);
  return faker.helpers.arrayElement(STORY_TITLES[exam]);
};

export const generateDescription = (exam, type) => {
  if (type === 'question') return faker.helpers.arrayElement(QUESTION_DESCRIPTIONS[exam]);
  if (type === 'resource') return faker.helpers.arrayElement(RESOURCE_DESCRIPTIONS[exam]);
  return faker.helpers.arrayElement(STORY_DESCRIPTIONS[exam]);
};

export const generateTags = (exam) => {
  const baseTags = faker.helpers.arrayElements(EXAM_TAGS[exam], {
    min: 2,
    max: Math.min(4, EXAM_TAGS[exam].length)
  });

  return [...new Set([exam.toLowerCase(), ...baseTags])];
};

export const seedPosts = async ({ users, count }) => {
  const validUsers = users.filter((user) => SUPPORTED_EXAMS.includes(user.examPreference || user.primaryExam));
  const candidateUsers = validUsers.length ? validUsers : users;
  const totalPosts = ensurePostCount(count);
  const shuffledTypePool = buildTypePool(totalPosts);

  const examQueuesByType = {
    question: buildExamSequence(shuffledTypePool.filter((type) => type === 'question').length),
    resource: buildExamSequence(shuffledTypePool.filter((type) => type === 'resource').length),
    story: buildExamSequence(shuffledTypePool.filter((type) => type === 'story').length)
  };

  const typeIndex = { question: 0, resource: 0, story: 0 };

  const docs = [];
  const postContexts = [];

  for (let i = 0; i < totalPosts; i += 1) {
    const type = shuffledTypePool[i];
    const author = faker.helpers.arrayElement(candidateUsers);
    const createdAt = randomSocialDate();
    const engagementTier = createEngagementTier();
    const exam = examQueuesByType[type][typeIndex[type]++];

    const postDoc = {
      userId: author._id,
      exam,
      type,
      title: generateTitle(exam, type),
      description: generateDescription(exam, type),
      tags: generateTags(exam),
      createdAt,
      updatedAt: randomDateAfter(createdAt)
    };

    if (type === 'resource') {
      postDoc.fileUrl = 'https://example.com/sample.pdf';
      postDoc.fileType = 'pdf';
    }

    docs.push(postDoc);

    postContexts.push({
      authorId: author._id,
      engagementTier
    });
  }

  const createdPosts = await Post.insertMany(docs, { ordered: false });

  const merged = createdPosts.map((post, index) => ({
    post,
    authorId: postContexts[index].authorId,
    engagementTier: postContexts[index].engagementTier
  }));

  return merged;
};
