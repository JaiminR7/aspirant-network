import { faker } from '@faker-js/faker';

const toBoolean = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes', 'y'].includes(String(value).toLowerCase());
};

const toNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const getBoundedCount = ({ min, max, envCount }) => {
  const count = envCount ?? faker.number.int({ min, max });
  return Math.max(min, Math.min(max, count));
};

export const getSeedConfig = () => {
  const userMin = toNumber(process.env.SEED_USERS_MIN, 20);
  const userMax = toNumber(process.env.SEED_USERS_MAX, 50);
  const postMin = toNumber(process.env.SEED_POSTS_MIN, 100);
  const postMax = toNumber(process.env.SEED_POSTS_MAX, 150);

  const minUsers = Math.min(userMin, userMax);
  const maxUsers = Math.max(userMin, userMax);
  const minPosts = Math.min(postMin, postMax);
  const maxPosts = Math.max(postMin, postMax);

  return {
    mongodbUri:
      process.env.MONGODB_URI || 'mongodb://localhost:27017/aspirant-network',
    exam: process.env.SEED_EXAM || 'CAT',
    clearExisting: toBoolean(process.env.SEED_CLEAR_EXISTING, true),
    clearUsers: toBoolean(process.env.SEED_CLEAR_USERS, false),
    bcryptRounds: toNumber(process.env.SEED_BCRYPT_ROUNDS, 10),
    usersCount: getBoundedCount({
      min: minUsers,
      max: maxUsers,
      envCount:
        process.env.SEED_USERS_COUNT !== undefined
          ? toNumber(process.env.SEED_USERS_COUNT, minUsers)
          : undefined
    }),
    postsCount: getBoundedCount({
      min: minPosts,
      max: maxPosts,
      envCount:
        process.env.SEED_POSTS_COUNT !== undefined
          ? toNumber(process.env.SEED_POSTS_COUNT, minPosts)
          : undefined
    })
  };
};
