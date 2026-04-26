const QUESTION_COMMENTS = [
  'Try focusing on the core concept behind this question.',
  'This is a commonly asked type, worth practicing more.',
  'Check your basic understanding, it helps solve this easily.',
  'Break the question into smaller steps to understand better.',
  'Look carefully at the conditions given in the question.',
  'This requires conceptual clarity rather than memorization.',
  'Practice similar questions to get more confidence.',
  'Revising fundamentals will make this easier to solve.',
  'Try solving it step by step instead of rushing.',
  'This question tests your understanding of basics.'
];

const RESOURCE_COMMENTS = [
  'Very useful resource. Thanks for sharing.',
  'This will help a lot in revision.',
  'Clear and practical material.',
  'Great content. Easy to understand.',
  'Helpful notes. Nicely organized.',
  'Useful for quick recap before tests.',
  'Good share. Please add more like this.',
  'This resource saves a lot of time.',
  'Well structured and relevant.',
  'Great contribution for aspirants.'
];

const STORY_COMMENTS = [
  "That's really relatable.",
  'I had a similar experience.',
  'This is actually inspiring.',
  'Interesting perspective on this.',
  'Thanks for sharing your story.',
  'This made me think differently.',
  'I completely agree with this.',
  'Well expressed and honest.',
  'This is something many people face.',
  'Really appreciate you sharing this.'
];

const COMMENT_MAP = {
  question: QUESTION_COMMENTS,
  resource: RESOURCE_COMMENTS,
  story: STORY_COMMENTS
};

const ALL_ALLOWED_COMMENT_TEXTS = [
  ...QUESTION_COMMENTS,
  ...RESOURCE_COMMENTS,
  ...STORY_COMMENTS
];

const normalizeCommentText = (text) =>
  String(text || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const buildLookup = (list) =>
  new Map(list.map((t) => [normalizeCommentText(t), t]));

const COMMENT_MAP_LOOKUP = {
  question: buildLookup(QUESTION_COMMENTS),
  resource: buildLookup(RESOURCE_COMMENTS),
  story: buildLookup(STORY_COMMENTS)
};

const toAllowedCommentText = (text, postType) => {
  if (postType && COMMENT_MAP_LOOKUP[postType]) {
    return COMMENT_MAP_LOOKUP[postType].get(normalizeCommentText(text)) || null;
  }
  // Fallback: check all lists
  const norm = normalizeCommentText(text);
  for (const lookup of Object.values(COMMENT_MAP_LOOKUP)) {
    const match = lookup.get(norm);
    if (match) return match;
  }
  return null;
};

const isAllowedCommentText = (text, postType) => Boolean(toAllowedCommentText(text, postType));

module.exports = {
  QUESTION_COMMENTS,
  RESOURCE_COMMENTS,
  STORY_COMMENTS,
  COMMENT_MAP,
  ALL_ALLOWED_COMMENT_TEXTS,
  normalizeCommentText,
  toAllowedCommentText,
  isAllowedCommentText
};
