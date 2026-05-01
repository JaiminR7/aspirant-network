import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

import User from '../../models/User.js';
import { buildUniqueString, pickOne, randomSocialDate } from './utils.mjs';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const FEED_EXAMS = ['JEE', 'NEET', 'GATE', 'CAT', 'UPSC', 'SSC', 'Bank Exams', 'Other'];

const INDIAN_FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Aditya',
  'Arjun',
  'Krishna',
  'Rohan',
  'Rahul',
  'Kunal',
  'Yash',
  'Akash',
  'Priya',
  'Ananya',
  'Aisha',
  'Sneha',
  'Kavya',
  'Pooja',
  'Ishita',
  'Neha',
  'Riya',
  'Diya'
];

const INDIAN_LAST_NAMES = [
  'Sharma',
  'Verma',
  'Patel',
  'Gupta',
  'Singh',
  'Kumar',
  'Yadav',
  'Joshi',
  'Mishra',
  'Agarwal',
  'Reddy',
  'Nair',
  'Iyer',
  'Menon',
  'Kapoor',
  'Malhotra',
  'Chauhan',
  'Saxena',
  'Bansal',
  'Pandey'
];

const GOAL_TEXT_TEMPLATES = [
  'Complete topic-wise revision with steady mock improvement.',
  'Build accuracy first, then increase solving speed.',
  'Follow a daily plan and review mistakes every week.',
  'Strengthen fundamentals and improve score consistency.',
  'Stay disciplined with revision and timed practice sessions.',
  'Improve weak areas through focused practice and analysis.',
  'Maintain a sustainable study routine until exam day.',
  'Increase confidence by solving quality questions regularly.',
  'Track progress weekly and reduce repeated mistakes.',
  'Prepare smart with clear milestones and regular feedback.'
];

const createPassword = () => {
  const generated = faker.internet.password({ length: 10, memorable: false });
  // Ensure policy compliance with uppercase, number, and symbol.
  return `${generated}A1!`;
};

const createUsernameFromName = (name) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 18);

  return `${base || 'user'}_${faker.number.int({ min: 10, max: 9999 })}`;
};

const createIndianName = () => {
  const firstName = faker.helpers.arrayElement(INDIAN_FIRST_NAMES);
  const lastName = faker.helpers.arrayElement(INDIAN_LAST_NAMES);
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`
  };
};

export const seedUsers = async ({ count, exam, bcryptRounds }) => {
  const usedEmails = new Set();
  const usedUsernames = new Set();

  const userDocs = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const { firstName, lastName, fullName } = createIndianName();

      const email = buildUniqueString(
        () =>
          faker.internet
            .email({ firstName, lastName, provider: 'mail.com' })
            .toLowerCase(),
        usedEmails
      );

      const username = buildUniqueString(
        () => createUsernameFromName(fullName),
        usedUsernames
      );

      const plainPassword = createPassword();
      const passwordHash = await bcrypt.hash(plainPassword, bcryptRounds);
      const selectedExam =
        faker.datatype.boolean({ probability: 0.7 })
          ? exam
          : faker.helpers.arrayElement(FEED_EXAMS.filter((e) => e !== exam));

      const createdAt = randomSocialDate();

      return {
        name: fullName,
        username,
        email,
        passwordHash,
        primaryExam: selectedExam,
        examPreference: selectedExam,
        attemptYear: faker.number.int({ min: 2026, max: 2030 }),
        level: pickOne(LEVELS),
        bio: faker.person.bio(),
        goal: {
          text: faker.helpers.arrayElement(GOAL_TEXT_TEMPLATES),
          visibility: faker.helpers.arrayElement(['Public', 'Connections', 'Private'])
        },
        profilePicture: {
          url: faker.image.avatar(),
          publicId: `seed-avatar-${faker.string.uuid()}`
        },
        credibilityScore: faker.number.int({ min: 0, max: 500 }),
        isVerified: faker.datatype.boolean({ probability: 0.35 }),
        isSeeded: true,
        createdAt,
        updatedAt: faker.date.between({ from: createdAt, to: new Date() })
      };
    })
  );

  const createdUsers = await User.insertMany(userDocs, { ordered: false });
  return createdUsers;
};
