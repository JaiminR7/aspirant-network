/**
 * USER PREPARATION LEVEL CONSTANTS
 * 
 * CRITICAL: These are the ONLY allowed preparation levels.
 * Users must select one during onboarding and can update in settings.
 */

// Enum of allowed preparation levels
const LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

// Array of level values for validation and iteration
const LEVEL_VALUES = Object.values(LEVELS);

// Level metadata with descriptions and characteristics
const LEVEL_METADATA = {
  [LEVELS.BEGINNER]: {
    name: 'Beginner',
    description: 'Just started preparation or new to the exam',
    characteristics: [
      'Building fundamentals',
      'Understanding exam pattern',
      'Starting with basics'
    ],
    color: '#10B981', // Green
    icon: '🌱'
  },
  [LEVELS.INTERMEDIATE]: {
    name: 'Intermediate',
    description: 'Comfortable with basics, working on advanced topics',
    characteristics: [
      'Practicing regularly',
      'Familiar with exam pattern',
      'Working on problem-solving'
    ],
    color: '#F59E0B', // Amber
    icon: '📚'
  },
  [LEVELS.ADVANCED]: {
    name: 'Advanced',
    description: 'Near exam-ready, focusing on speed and accuracy',
    characteristics: [
      'Taking full-length mocks',
      'Refining strategies',
      'Fine-tuning performance'
    ],
    color: '#8B5CF6', // Purple
    icon: '🎯'
  }
};

// Validation helper
const isValidLevel = (level) => {
  return LEVEL_VALUES.includes(level);
};

// Get level metadata
const getLevelMetadata = (level) => {
  return LEVEL_METADATA[level] || null;
};

// Mongoose enum validation helper
const getLevelEnum = () => {
  return LEVEL_VALUES;
};

// Get level badge color for UI
const getLevelColor = (level) => {
  return LEVEL_METADATA[level]?.color || '#6B7280';
};

// Get level icon
const getLevelIcon = (level) => {
  return LEVEL_METADATA[level]?.icon || '📖';
};

module.exports = {
  LEVELS,
  LEVEL_VALUES,
  LEVEL_METADATA,
  isValidLevel,
  getLevelMetadata,
  getLevelEnum,
  getLevelColor,
  getLevelIcon
};
