// ==================== TAG CONSTANTS ====================

/**
 * System-defined tags for different content types
 * These are controlled tags that can be used for filtering and categorization
 */
const SYSTEM_TAGS = {
  GENERAL: [
    'beginner-friendly',
    'advanced',
    'important',
    'frequently-asked',
    'trending',
    'urgent',
    'solved',
    'unsolved',
    'theory',
    'practical',
    'conceptual',
    'numerical',
    'formula-based',
    'trick',
    'shortcut',
    'common-mistake',
    'exam-pattern',
    'previous-year',
    'mock-test',
    'revision'
  ],
  QUESTION: [
    'doubt',
    'practice',
    'discussion',
    'multiple-choice',
    'subjective',
    'numerical',
    'case-study',
    'assertion-reason',
    'match-the-following',
    'true-false',
    'fill-in-the-blank',
    'short-answer',
    'long-answer',
    'derivation',
    'proof',
    'problem-solving',
    'conceptual-clarity'
  ],
  RESOURCE: [
    'notes',
    'book',
    'video',
    'article',
    'tutorial',
    'cheat-sheet',
    'mind-map',
    'formula-sheet',
    'summary',
    'reference',
    'guide',
    'course',
    'lecture',
    'practice-set',
    'sample-paper',
    'study-material',
    'revision-notes',
    'quick-reference'
  ],
  STORY: [
    'motivation',
    'success',
    'failure',
    'strategy',
    'time-management',
    'stress-management',
    'preparation-journey',
    'rank-booster',
    'tips-and-tricks',
    'last-minute-prep',
    'exam-day',
    'result',
    'interview',
    'selection',
    'rejection',
    'lessons-learned'
  ]
};

// ==================== TAG LIMITS ====================

const TAG_LIMITS = {
  MAX_USER_TAGS: 3,
  MAX_SYSTEM_TAGS: 5,
  MIN_TAG_LENGTH: 2,
  MAX_TAG_LENGTH: 30,
  TAG_PATTERN: /^[a-z0-9-]+$/
};

// ==================== TAG NORMALIZATION ====================

/**
 * Normalize a single tag
 * - Convert to lowercase
 * - Trim whitespace
 * - Replace spaces with hyphens
 * - Remove special characters except hyphens
 */
function normalizeTag(tag) {
  if (!tag || typeof tag !== 'string') {
    return '';
  }

  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Normalize an array of tags
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map(normalizeTag)
    .filter(tag => tag.length >= TAG_LIMITS.MIN_TAG_LENGTH);
}

// ==================== TAG VALIDATION ====================

/**
 * Validate a single tag format
 */
function validateTagFormat(tag) {
  const normalized = normalizeTag(tag);

  if (normalized.length < TAG_LIMITS.MIN_TAG_LENGTH) {
    return {
      valid: false,
      error: `Tag must be at least ${TAG_LIMITS.MIN_TAG_LENGTH} characters long`
    };
  }

  if (normalized.length > TAG_LIMITS.MAX_TAG_LENGTH) {
    return {
      valid: false,
      error: `Tag must not exceed ${TAG_LIMITS.MAX_TAG_LENGTH} characters`
    };
  }

  if (!TAG_LIMITS.TAG_PATTERN.test(normalized)) {
    return {
      valid: false,
      error: 'Tag must contain only lowercase letters, numbers, and hyphens'
    };
  }

  return { valid: true, normalized };
}

/**
 * Validate system tags for a specific content type
 */
function validateSystemTags(systemTags, contentType = 'GENERAL') {
  if (!systemTags) {
    return { valid: true, tags: [] };
  }

  if (!Array.isArray(systemTags)) {
    return {
      valid: false,
      error: 'System tags must be an array'
    };
  }

  // Check max limit
  if (systemTags.length > TAG_LIMITS.MAX_SYSTEM_TAGS) {
    return {
      valid: false,
      error: `Maximum ${TAG_LIMITS.MAX_SYSTEM_TAGS} system tags allowed`
    };
  }

  // Normalize tags
  const normalizedTags = normalizeTags(systemTags);

  // Get allowed tags for content type
  const allowedTags = [
    ...SYSTEM_TAGS.GENERAL,
    ...(SYSTEM_TAGS[contentType] || [])
  ];

  // Check if all tags are valid
  const invalidTags = normalizedTags.filter(tag => !allowedTags.includes(tag));

  if (invalidTags.length > 0) {
    return {
      valid: false,
      error: `Invalid system tags: ${invalidTags.join(', ')}`,
      invalidTags
    };
  }

  // Check for duplicates
  const uniqueTags = [...new Set(normalizedTags)];
  if (uniqueTags.length !== normalizedTags.length) {
    return {
      valid: false,
      error: 'Duplicate system tags are not allowed'
    };
  }

  return {
    valid: true,
    tags: uniqueTags
  };
}

/**
 * Validate user-defined tags
 */
function validateUserTags(userTags) {
  if (!userTags) {
    return { valid: true, tags: [] };
  }

  if (!Array.isArray(userTags)) {
    return {
      valid: false,
      error: 'User tags must be an array'
    };
  }

  // Check max limit (CRITICAL: max 3 user tags)
  if (userTags.length > TAG_LIMITS.MAX_USER_TAGS) {
    return {
      valid: false,
      error: `Maximum ${TAG_LIMITS.MAX_USER_TAGS} user tags allowed`
    };
  }

  // Normalize and validate each tag
  const validatedTags = [];
  const errors = [];

  for (const tag of userTags) {
    const validation = validateTagFormat(tag);
    if (!validation.valid) {
      errors.push(`"${tag}": ${validation.error}`);
    } else {
      validatedTags.push(validation.normalized);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Invalid user tags: ${errors.join('; ')}`
    };
  }

  // Check for duplicates
  const uniqueTags = [...new Set(validatedTags)];
  if (uniqueTags.length !== validatedTags.length) {
    return {
      valid: false,
      error: 'Duplicate user tags are not allowed'
    };
  }

  return {
    valid: true,
    tags: uniqueTags
  };
}

/**
 * Validate both system and user tags together
 */
function validateAllTags(systemTags, userTags, contentType = 'GENERAL') {
  // Validate system tags
  const systemValidation = validateSystemTags(systemTags, contentType);
  if (!systemValidation.valid) {
    return systemValidation;
  }

  // Validate user tags
  const userValidation = validateUserTags(userTags);
  if (!userValidation.valid) {
    return userValidation;
  }

  // Check for overlap between system and user tags
  const systemTagsNormalized = systemValidation.tags || [];
  const userTagsNormalized = userValidation.tags || [];

  const overlap = systemTagsNormalized.filter(tag =>
    userTagsNormalized.includes(tag)
  );

  if (overlap.length > 0) {
    return {
      valid: false,
      error: `Tags appear in both system and user tags: ${overlap.join(', ')}`
    };
  }

  return {
    valid: true,
    systemTags: systemTagsNormalized,
    userTags: userTagsNormalized
  };
}

// ==================== TAG SEARCH & FILTER ====================

/**
 * Build MongoDB query for tag search
 */
function buildTagQuery(searchTags) {
  if (!searchTags || searchTags.length === 0) {
    return {};
  }

  const normalizedTags = normalizeTags(searchTags);

  return {
    $or: [
      { systemTags: { $in: normalizedTags } },
      { userTags: { $in: normalizedTags } }
    ]
  };
}

/**
 * Extract all tags from content
 */
function getAllTags(systemTags = [], userTags = []) {
  return [
    ...normalizeTags(systemTags),
    ...normalizeTags(userTags)
  ];
}

// ==================== TAG SUGGESTIONS ====================

/**
 * Get suggested system tags based on content type
 */
function getSuggestedSystemTags(contentType = 'GENERAL', limit = 10) {
  const generalTags = SYSTEM_TAGS.GENERAL.slice(0, Math.floor(limit / 2));
  const specificTags = (SYSTEM_TAGS[contentType] || []).slice(0, Math.ceil(limit / 2));

  return [...generalTags, ...specificTags];
}

/**
 * Get all available system tags for a content type
 */
function getAvailableSystemTags(contentType = 'GENERAL') {
  return {
    general: SYSTEM_TAGS.GENERAL,
    specific: SYSTEM_TAGS[contentType] || [],
    all: [...SYSTEM_TAGS.GENERAL, ...(SYSTEM_TAGS[contentType] || [])]
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Constants
  SYSTEM_TAGS,
  TAG_LIMITS,

  // Normalization
  normalizeTag,
  normalizeTags,

  // Validation
  validateTagFormat,
  validateSystemTags,
  validateUserTags,
  validateAllTags,

  // Search & Filter
  buildTagQuery,
  getAllTags,

  // Suggestions
  getSuggestedSystemTags,
  getAvailableSystemTags
};
