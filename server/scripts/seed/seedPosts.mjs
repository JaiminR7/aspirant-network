import { faker } from '@faker-js/faker';

import Post from '../../models/Post.js';
import {
  createEngagementTier,
  randomDateAfter,
  randomSocialDate
} from './utils.mjs';

const SUPPORTED_EXAMS = ['JEE', 'NEET', 'GATE', 'CAT', 'UPSC', 'SSC', 'Bank Exams', 'Other'];

const EXAM_TAGS = {
  JEE: ['pcm', 'nta', 'mock-test', 'pyqs', 'organic-chemistry', 'calculus', 'physics-doubts'],
  NEET: ['biology', 'ncert', 'anatomy', 'botany', 'mock-test', 'physics-concepts', 'revision'],
  GATE: ['thermodynamics', 'aptitude', 'signals', 'control-systems', 'network-theory', 'revision-notes'],
  CAT: ['rc', 'lrdi', 'quant', 'time-management', 'mock-analysis', 'varc'],
  UPSC: ['polity', 'economy', 'ethics', 'answer-writing', 'current-affairs', 'mains-strategy'],
  SSC: ['cgl-prep', 'reasoning', 'english-grammar', 'general-awareness', 'quant-shortcuts'],
  'Bank Exams': ['banking-awareness', 'data-interpretation', 'logical-reasoning', 'sbi-po', 'ibps'],
  Other: ['general-studies', 'aptitude', 'mental-ability', 'exam-tips', 'preparation-strategy']
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
    'Inorganic chemistry is so vast and I keep forgetting the reactions and trends. Looking for a smart way to memorize s-block, p-block and coordination compounds for JEE.',
    'I have finished theory but I am unable to solve complex problems in Irodov or Krotov for JEE Advanced. Need advice on how to build advanced problem solving skills.',
    'In JEE Main mocks, I spend too much time on Math and end up with negative marks in Physics. How should I distribute time across PCM to maximize my score?',
    'Is it worth focusing on 12th board syllabus completely first, or should I keep doing JEE level practice for 11th topics as well?',
    'Facing difficulty in visualizing 3D geometry and vectors. Any resources or tricks that helped you master these topics for JEE?'
  ],
  NEET: [
    'NCERT is the bible for NEET but I find it hard to retain all the examples in morphology and plant kingdom. Any mnemonic or revision tricks?',
    'Physics is my weak point and I struggle with application-based questions. Looking for a daily routine to bridge the gap between theory and numericals.',
    'There is so much syllabus to cover for NEET. How many times should I ideally revise NCERT before the actual exam for a 340+ score?',
    'Organic chemistry naming reactions and conversions are confusing. How did you guys make notes for this section?',
    'What is the best way to analyze NEET mock tests? I repeat the same mistakes in Biology despite multiple readings.'
  ],
  GATE: [
    'I complete theory once but forget formulas after a week. Need a revision plan for thermodynamics and core subjects that keeps concepts fresh till the exam.',
    'I solve PYQs but repeat similar mistakes in numericals. How do you analyze error patterns and improve speed plus accuracy in GATE style questions?',
    'My aptitude section score is unstable. Any reliable daily plan for aptitude and engineering mathematics that works in the final 2 months?',
    'Should I focus more on depth of core subjects or should I aim for a broad coverage for GATE? I am a bit behind schedule.',
    'Resources for signal processing and communication systems that are simplified for self-study?'
  ],
  CAT: [
    'I am getting stuck in dense RC passages and my accuracy drops in mocks. I can eliminate two options but fail to pick the final one consistently. Suggest a practical routine to improve comprehension.',
    'In LRDI, I spend too long selecting sets and lose marks despite knowing concepts. How do you decide quickly which set to attempt first?',
    'My quant concepts are decent but I panic in timed sections. Looking for a section-wise attempt strategy that helps maximize attempts without silly mistakes.',
    'Managing CAT prep with a 10-hour shift is getting exhausting. Any working professionals who can share their morning/evening study routines?',
    'What should I look for in mock analysis? Percentile is stagnant at 85. How do I push past 95?'
  ],
  UPSC: [
    'I know the content for GS answers but struggle to structure intros and conclusions under time pressure. Looking for a framework to improve mains answer quality.',
    'Current affairs notes keep piling up and revision is becoming difficult. How do you keep notes concise and still retain important facts for prelims and mains?',
    'My mock scores are fluctuating and confidence is dropping. Need guidance on balancing prelims MCQ practice with mains answer writing in the same week.',
    'Case studies in Ethics (GS4) are my weak point. How do you identify stakeholders and provide balanced solutions effectively?',
    'How do you manage to cover the huge UPSC syllabus without feeling overwhelmed? Looking for subject-wise milestones.'
  ],
  SSC: [
    'English section is tricky with direct/indirect and active/passive voice. Any grammar rules PDF or teacher recommendation for SSC CGL?',
    'I need to improve my calculation speed for SSC Quant. What tables, squares, and cubes should I memorize, and what are the best shortcut tricks?',
    'Static GK is so diverse in SSC. What are the high-weightage topics I should focus on first?',
    'How to stay disciplined for a 6-8 month preparation cycle? The syllabus is not hard but consistency is the key.',
    'Analyzing previous year papers for SSC - how important is it to solve the last 5 years?'
  ],
  'Bank Exams': [
    'Data Interpretation in Bank exams is very calculation intensive. Any tips to solve tabular and bar graphs faster?',
    'I struggle with puzzles and seating arrangements. They take too long and often lead to dead ends. How do you approach them systematically?',
    'English for Banking is more about comprehension. Any reading habits or resources that helped you score well in Mains?',
    'How to keep up with daily banking awareness and current affairs without spending more than an hour?',
    'Comparing SBI PO vs IBPS PO prep - are the mock levels very different? Which one should I prioritize?'
  ],
  Other: [
    'Starting preparation for competitive exams from scratch. What should be my first steps for building a strong foundation?',
    'How do you handle family pressure and expectations during preparation? It gets mentally taxing sometimes.',
    'Any apps or tools that help in staying focused and blocking distractions during study hours?',
    'Is taking a drop year advisable if I am 10-15 marks short of the cutoff? Need honest advice.',
    'Building a balanced lifestyle during prep - how much sleep and exercise do you recommend?'
  ]
};

const RESOURCE_DESCRIPTIONS = {
  JEE: [
    'A comprehensive formula sheet covering Physics from Mechanics to Modern Physics. Perfect for last-minute revision before mocks.',
    'Detailed reaction mechanisms for all important organic chemistry reactions in JEE syllabus, with explained intermediates.',
    'A collection of all JEE Main 2023 January session papers with step-by-step solutions and difficulty analysis.',
    'Short, crisp notes for Mathematics focusing on high-weightage topics like Calculus and Coordinate Geometry.'
  ],
  NEET: [
    'All NCERT biology diagrams compiled into one PDF for quick visual revision of botany and zoology.',
    'A checklist of all topics for NEET 2024 to track your progress and ensure nothing is missed during revision.',
    'Workbook containing 500+ solved numericals for NEET Physics, categorized by difficulty and concept.',
    'A one-page summary of periodic table trends and exception cases for quick Chemistry revision.'
  ],
  GATE: [
    'This PDF combines thermodynamics formulas, concept maps, and solved examples useful for quick revision before mock tests.',
    'Aptitude revision file with topic-wise tricks, previous exam patterns, and short timed practice worksheets.',
    'Includes concise control systems notes and solved standard models for last-mile revision.',
    'Workbook for Engineering Mathematics covering probability, calculus and linear algebra with GATE PYQs.'
  ],
  CAT: [
    'Curated RC practice plan, error log template, and daily drills for improving verbal consistency in CAT mocks.',
    'Contains handpicked LRDI sets categorized by difficulty with step-by-step approach notes and common traps to avoid.',
    'A compact quant revision PDF covering arithmetic and algebra shortcuts with high-frequency question patterns.',
    'Framework for approaching different DILR set types like arrangements, networks and games.'
  ],
  UPSC: [
    'Polity revision PDF covering constitutional articles, landmark judgments, and high-yield mains framing points.',
    'Monthly current affairs compilation with prelims pointers and mains value-add snippets.',
    'Answer writing resource containing intro-body-conclusion structures and sample GS responses.',
    'A detailed timeline of Modern Indian History (1757-1947) for quick fact retrieval and MCQ prep.'
  ],
  SSC: [
    'Most repeated 1000 English words in SSC exams with meanings, synonyms and antonyms.',
    'Comprehensive PDF of mathematical shortcuts for percentage, ratio, and time-distance topics.',
    'Static GK compilation covering history, geography and polity basics specifically for SSC CGL.',
    'Practice set for Reasoning including series, analogy and coding-decoding questions with detailed explanations.'
  ],
  'Bank Exams': [
    'Consolidated notes for banking terminology, RBI functions and recent financial updates for PO/Clerk prep.',
    'Data Interpretation workbook with advanced level sets for Mains preparation, covering all graph types.',
    'Strategy and practice PDF for different types of puzzles and circular/linear seating arrangements.',
    'English reading comprehension drills with focus on economic and social issues commonly seen in Bank exams.'
  ],
  Other: [
    'General workbook for building numerical ability and logical reasoning skills for various state/central exams.',
    'A pack of study planners, weekly trackers and goal setting sheets to keep your preparation organized.',
    'Practical tips and exercises to improve focus, concentration and time management during long study sessions.',
    'Guide for beginners on how to start competitive exam prep, including resource selection and habit building.'
  ]
};

const STORY_DESCRIPTIONS = {
  JEE: [
    'I started my preparation with very low confidence in Physics. By focusing on fundamentals and solving 50 quality questions daily, I pushed my mock scores significantly. Sharing my timeline and the mistakes I avoided.',
    'Preparation for JEE Advanced was a roller coaster. I learned that depth of understanding is better than covering too many books. This is how I stayed consistent despite setbacks in my coaching tests.',
    'Getting a low percentile in the first attempt was heart-breaking. But instead of giving up, I analyzed my weak areas and focused on a target-based revision for the second attempt. It worked!'
  ],
  NEET: [
    'In my first attempt, I missed the cutoff by 5 marks. I realized my mistake was ignoring Physics numericals. For the second year, I balanced all subjects equally and finally cleared it. Here is my strategy.',
    'Physics is often the nightmare for NEET aspirants. I found a way to love the subject by connecting it to real-life applications and regular practice. Sharing the resources that changed my perspective.',
    'Managing board exams along with NEET is all about planning. I followed a strict schedule that prioritized NCERT and mock tests. It was tough but rewarding.'
  ],
  GATE: [
    'I moved from scattered preparation to a subject rotation plan with frequent tests. Weekly revision and formula sheets helped me retain concepts and improve my rank trajectory.',
    'My first mocks were discouraging, but analyzing mistakes and revisiting fundamentals changed everything. This post shares how I rebuilt my preparation system step by step.',
    'Consistency mattered more than long study hours. I kept daily targets realistic, tracked weak areas, and used PYQ-focused revision to gain momentum close to exam day.'
  ],
  CAT: [
    'I started with low mock scores and inconsistent revision. By focusing on sectional analysis, weekly error tracking, and a fixed mock-review cycle, I improved steadily. Sharing the exact routine that helped me build confidence.',
    'My biggest shift was reducing random resources and sticking to one plan. I followed a timed practice routine, revised mistakes every Sunday, and improved percentile gradually over 3 months.',
    'I was weak in VARC and avoided difficult passages. After daily reading drills and focused RC practice, I became comfortable with inference-based questions. Posting my strategy and timeline.'
  ],
  UPSC: [
    'I struggled with consistency early on, but a simple study timetable and regular answer writing changed my preparation quality. Sharing what worked and what I stopped doing.',
    'My notes were too bulky at first. I shifted to concise one-page revisions and test-based learning, which improved both recall and confidence for prelims and mains.',
    'I learned that strategy matters as much as effort in UPSC prep. This is my journey of balancing GS coverage, current affairs, and revision cycles effectively.'
  ],
  SSC: [
    'Clearing SSC CGL was my dream. After failing twice, I realized I needed to work on my speed and English. I practiced daily and solved 100+ mocks in the final year. Success feels great!',
    'English was always my weak area. I started reading newspapers and practiced grammar rules daily. It took time, but I eventually scored 45+ in Tier 1. Consistency is indeed key.',
    'Recruitment cycles for SSC can be long and tiring. I stayed motivated by setting small goals and staying away from social media distractions. Sharing my survival tips.'
  ],
  'Bank Exams': [
    'Cleared SBI PO in my first attempt! I focused on my strengths in Quant and built speed in DI. Regular mock tests and sectional analysis were the game changers for me.',
    'Switching from a 9-5 job to Bank prep was risky but worth it. I studied early mornings and late nights to finish the syllabus. sharing my journey for other working professionals.',
    'DI and Puzzles used to scare me. I practiced them every single day for 3 months until they became my strongest sections. Hard work really has no substitute.'
  ],
  Other: [
    'Preparation is as much a mental game as it is an academic one. I learned to manage my stress through meditation and a fixed routine. Staying calm helped me perform better in the actual exam.',
    'I found my rhythm after many months of trial and error. This post is about how I built my own study system that worked for me, and how you can find yours too.',
    'Every failure is a lesson. I didn\'t clear my target exam, but the journey taught me discipline, hard work and resilience. Success will come in another form.'
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
