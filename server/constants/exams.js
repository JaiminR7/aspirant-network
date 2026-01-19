/**
 * EXAM CONSTANTS
 * 
 * CRITICAL: These are the ONLY allowed exams in the platform.
 * All content is strictly scoped to these exam values.
 * No free-text exam names are permitted.
 */

// Enum of allowed exams
const EXAMS = {
  CAT: 'CAT',
  UPSC: 'UPSC',
  JEE: 'JEE',
  NEET: 'NEET',
  GATE: 'GATE',
  SSC: 'SSC',
  IBPS: 'IBPS',
  GMAT: 'GMAT',
  GRE: 'GRE',
  IELTS: 'IELTS'
};

// Array of exam values for validation and iteration
const EXAM_VALUES = Object.values(EXAMS);

// Exam metadata with full names and descriptions
const EXAM_METADATA = {
  [EXAMS.CAT]: {
    name: 'CAT',
    fullName: 'Common Admission Test',
    description: 'MBA entrance exam',
    category: 'Management'
  },
  [EXAMS.UPSC]: {
    name: 'UPSC',
    fullName: 'Union Public Service Commission',
    description: 'Civil Services Examination',
    category: 'Government Services'
  },
  [EXAMS.JEE]: {
    name: 'JEE',
    fullName: 'Joint Entrance Examination',
    description: 'Engineering entrance exam',
    category: 'Engineering'
  },
  [EXAMS.NEET]: {
    name: 'NEET',
    fullName: 'National Eligibility cum Entrance Test',
    description: 'Medical entrance exam',
    category: 'Medical'
  },
  [EXAMS.GATE]: {
    name: 'GATE',
    fullName: 'Graduate Aptitude Test in Engineering',
    description: 'Engineering postgraduate exam',
    category: 'Engineering'
  },
  [EXAMS.SSC]: {
    name: 'SSC',
    fullName: 'Staff Selection Commission',
    description: 'Government job exam',
    category: 'Government Services'
  },
  [EXAMS.IBPS]: {
    name: 'IBPS',
    fullName: 'Institute of Banking Personnel Selection',
    description: 'Banking sector exam',
    category: 'Banking'
  },
  [EXAMS.GMAT]: {
    name: 'GMAT',
    fullName: 'Graduate Management Admission Test',
    description: 'MBA entrance exam (International)',
    category: 'Management'
  },
  [EXAMS.GRE]: {
    name: 'GRE',
    fullName: 'Graduate Record Examination',
    description: 'Graduate school entrance exam',
    category: 'International'
  },
  [EXAMS.IELTS]: {
    name: 'IELTS',
    fullName: 'International English Language Testing System',
    description: 'English proficiency test',
    category: 'Language'
  }
};

// Subject structure for each exam
const EXAM_SUBJECTS = {
  [EXAMS.CAT]: [
    'Quantitative Aptitude',
    'Verbal Ability',
    'Data Interpretation',
    'Logical Reasoning'
  ],
  [EXAMS.UPSC]: [
    'General Studies',
    'Current Affairs',
    'History',
    'Geography',
    'Polity',
    'Economics',
    'Environment',
    'Science & Technology',
    'Ethics'
  ],
  [EXAMS.JEE]: [
    'Physics',
    'Chemistry',
    'Mathematics'
  ],
  [EXAMS.NEET]: [
    'Physics',
    'Chemistry',
    'Biology',
    'Zoology',
    'Botany'
  ],
  [EXAMS.GATE]: [
    'Engineering Mathematics',
    'General Aptitude',
    'Core Engineering'
  ],
  [EXAMS.SSC]: [
    'General Intelligence',
    'General Awareness',
    'Quantitative Aptitude',
    'English'
  ],
  [EXAMS.IBPS]: [
    'Reasoning',
    'Quantitative Aptitude',
    'English',
    'General Awareness',
    'Computer Knowledge'
  ],
  [EXAMS.GMAT]: [
    'Quantitative',
    'Verbal',
    'Integrated Reasoning',
    'Analytical Writing'
  ],
  [EXAMS.GRE]: [
    'Verbal Reasoning',
    'Quantitative Reasoning',
    'Analytical Writing'
  ],
  [EXAMS.IELTS]: [
    'Listening',
    'Reading',
    'Writing',
    'Speaking'
  ]
};

// Validation helper
const isValidExam = (exam) => {
  return EXAM_VALUES.includes(exam);
};

// Get exam metadata
const getExamMetadata = (exam) => {
  return EXAM_METADATA[exam] || null;
};

// Get exam subjects
const getExamSubjects = (exam) => {
  return EXAM_SUBJECTS[exam] || [];
};

// Mongoose enum validation helper
const getExamEnum = () => {
  return EXAM_VALUES;
};

module.exports = {
  EXAMS,
  EXAM_VALUES,
  EXAM_METADATA,
  EXAM_SUBJECTS,
  isValidExam,
  getExamMetadata,
  getExamSubjects,
  getExamEnum
};
