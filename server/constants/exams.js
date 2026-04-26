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
  SSC: 'SSC-10 boards',
  HSC: 'HSC-12 boards'
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
    name: 'SSC-10 boards',
    fullName: 'SSC - 10 Boards',
    description: 'Class 10 board preparation',
    category: 'School Boards'
  },
  [EXAMS.HSC]: {
    name: 'HSC-12 boards',
    fullName: 'HSC - 12 Boards',
    description: 'Class 12 board preparation',
    category: 'School Boards'
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
    'Mathematics',
    'Science',
    'Social Science',
    'English'
  ],
  [EXAMS.HSC]: [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'English',
    'Computer Science'
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
