import { faker } from '@faker-js/faker';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const pickOne = (items) => items[faker.number.int({ min: 0, max: items.length - 1 })];

export const randomInt = (min, max) => faker.number.int({ min, max });

export const buildUniqueString = (generator, usedSet) => {
  let value = generator();
  while (usedSet.has(value)) {
    value = generator();
  }
  usedSet.add(value);
  return value;
};

export const randomSocialDate = () => {
  const now = new Date();

  // 70% recent data and 30% older data to simulate realistic feed dynamics.
  const isRecent = faker.datatype.boolean({ probability: 0.7 });
  if (isRecent) {
    return faker.date.recent({ days: 30, refDate: now });
  }

  const start = new Date(now.getTime() - 365 * ONE_DAY_MS);
  const end = new Date(now.getTime() - 31 * ONE_DAY_MS);
  return faker.date.between({ from: start, to: end });
};

export const randomDateAfter = (baseDate) => {
  const min = new Date(baseDate);
  const max = new Date();

  if (min >= max) {
    return max;
  }

  return faker.date.between({ from: min, to: max });
};

export const selectUniqueUsers = (users, count, excludeUserId = null) => {
  const filtered = excludeUserId
    ? users.filter((user) => user._id.toString() !== excludeUserId.toString())
    : [...users];

  if (filtered.length === 0 || count <= 0) {
    return [];
  }

  const shuffled = faker.helpers.shuffle(filtered);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const createEngagementTier = () => {
  const roll = Math.random();

  if (roll < 0.12) return 'high';
  if (roll < 0.47) return 'medium';
  if (roll < 0.8) return 'low';
  return 'zero';
};

export const createTags = (min = 1, max = 4) => {
  const total = randomInt(min, max);
  const set = new Set();

  while (set.size < total) {
    const base = faker.helpers.arrayElement([
      faker.word.noun(),
      faker.word.adjective(),
      faker.word.verb(),
      faker.word.sample()
    ]);

    set.add(base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20));
  }

  return [...set].filter(Boolean);
};
