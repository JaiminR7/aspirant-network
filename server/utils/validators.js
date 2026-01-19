const { isValidExam } = require('../constants/exams');
const { isValidLevel } = require('../constants/levels');

/**
 * Validation Utilities
 * 
 * Reusable validation functions for data validation across controllers.
 * These functions return { valid: boolean, error: string } objects.
 */

// ==================== EXAM VALIDATION ====================

/**
 * Validate Exam
 * 
 * Checks if the provided exam is in the allowed list.
 * 
 * @param {string} exam - Exam code to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateExam = (exam) => {
  if (!exam) {
    return {
      valid: false,
      error: 'Exam is required.'
    };
  }

  if (typeof exam !== 'string') {
    return {
      valid: false,
      error: 'Exam must be a string.'
    };
  }

  if (!isValidExam(exam)) {
    return {
      valid: false,
      error: `Invalid exam: ${exam}. Please select from the allowed exam list.`
    };
  }

  return { valid: true };
};

// ==================== LEVEL VALIDATION ====================

/**
 * Validate Preparation Level
 * 
 * Checks if the provided level is valid (Beginner, Intermediate, Advanced).
 * 
 * @param {string} level - Level to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateLevel = (level) => {
  if (!level) {
    return {
      valid: false,
      error: 'Preparation level is required.'
    };
  }

  if (!isValidLevel(level)) {
    return {
      valid: false,
      error: `Invalid level: ${level}. Allowed values: Beginner, Intermediate, Advanced.`
    };
  }

  return { valid: true };
};

// ==================== TAG VALIDATION ====================

/**
 * Validate User Tags
 * 
 * CRITICAL: Validates user tags (max 3 tags, proper format).
 * 
 * @param {Array} tags - Array of tag strings
 * @param {number} maxTags - Maximum allowed tags (default: 3)
 * @returns {Object} { valid: boolean, error: string }
 */
const validateUserTags = (tags, maxTags = 3) => {
  if (!tags) {
    return { valid: true }; // Tags are optional
  }

  if (!Array.isArray(tags)) {
    return {
      valid: false,
      error: 'Tags must be an array.'
    };
  }

  // Check tag count
  if (tags.length > maxTags) {
    return {
      valid: false,
      error: `Cannot add more than ${maxTags} tags. You provided ${tags.length}.`
    };
  }

  // Validate each tag
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    if (typeof tag !== 'string') {
      return {
        valid: false,
        error: `Tag at index ${i} must be a string.`
      };
    }

    if (tag.trim().length === 0) {
      return {
        valid: false,
        error: `Tag at index ${i} cannot be empty.`
      };
    }

    if (tag.length > 30) {
      return {
        valid: false,
        error: `Tag "${tag}" exceeds maximum length of 30 characters.`
      };
    }

    // Check for special characters (optional, adjust as needed)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
      return {
        valid: false,
        error: `Tag "${tag}" contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores allowed.`
      };
    }
  }

  return { valid: true };
};

// ==================== QUESTION VALIDATION ====================

/**
 * Validate Question Metadata
 * 
 * Validates required fields for creating/updating a question.
 * 
 * @param {Object} data - Question data
 * @returns {Object} { valid: boolean, error: string }
 */
const validateQuestionMetadata = (data) => {
  const { title, description, exam, subject, topic } = data;

  // Title validation
  if (!title || title.trim().length === 0) {
    return {
      valid: false,
      error: 'Question title is required.'
    };
  }

  if (title.length < 10) {
    return {
      valid: false,
      error: 'Question title must be at least 10 characters.'
    };
  }

  if (title.length > 200) {
    return {
      valid: false,
      error: 'Question title cannot exceed 200 characters.'
    };
  }

  // Description validation
  if (!description || description.trim().length === 0) {
    return {
      valid: false,
      error: 'Question description is required.'
    };
  }

  if (description.length < 20) {
    return {
      valid: false,
      error: 'Question description must be at least 20 characters.'
    };
  }

  if (description.length > 5000) {
    return {
      valid: false,
      error: 'Question description cannot exceed 5000 characters.'
    };
  }

  // Exam validation
  const examValidation = validateExam(exam);
  if (!examValidation.valid) {
    return examValidation;
  }

  // Subject validation
  if (!subject) {
    return {
      valid: false,
      error: 'Subject is required.'
    };
  }

  // Topic validation
  if (!topic) {
    return {
      valid: false,
      error: 'Topic is required.'
    };
  }

  // User tags validation (if provided)
  if (data.userTags) {
    const tagsValidation = validateUserTags(data.userTags);
    if (!tagsValidation.valid) {
      return tagsValidation;
    }
  }

  return { valid: true };
};

// ==================== RESOURCE VALIDATION ====================

/**
 * Validate Resource Metadata
 * 
 * Validates required fields for creating/updating a resource.
 * 
 * @param {Object} data - Resource data
 * @returns {Object} { valid: boolean, error: string }
 */
const validateResourceMetadata = (data) => {
  const { title, type, exam, subject, topic } = data;

  // Title validation
  if (!title || title.trim().length === 0) {
    return {
      valid: false,
      error: 'Resource title is required.'
    };
  }

  if (title.length < 5) {
    return {
      valid: false,
      error: 'Resource title must be at least 5 characters.'
    };
  }

  if (title.length > 200) {
    return {
      valid: false,
      error: 'Resource title cannot exceed 200 characters.'
    };
  }

  // Type validation
  const validTypes = ['PDF', 'Image', 'Link', 'Video'];
  if (!type) {
    return {
      valid: false,
      error: 'Resource type is required.'
    };
  }

  if (!validTypes.includes(type)) {
    return {
      valid: false,
      error: `Invalid resource type. Allowed values: ${validTypes.join(', ')}`
    };
  }

  // Content validation based on type
  if (type === 'Link' || type === 'Video') {
    if (!data.content?.externalLink) {
      return {
        valid: false,
        error: 'External link is required for Link/Video type resources.'
      };
    }
  }

  // Exam validation
  const examValidation = validateExam(exam);
  if (!examValidation.valid) {
    return examValidation;
  }

  // Subject validation
  if (!subject) {
    return {
      valid: false,
      error: 'Subject is required.'
    };
  }

  // Topic validation
  if (!topic) {
    return {
      valid: false,
      error: 'Topic is required.'
    };
  }

  // User tags validation (if provided)
  if (data.userTags) {
    const tagsValidation = validateUserTags(data.userTags);
    if (!tagsValidation.valid) {
      return tagsValidation;
    }
  }

  return { valid: true };
};

// ==================== ANSWER VALIDATION ====================

/**
 * Validate Answer Content
 * 
 * Validates answer content before saving.
 * 
 * @param {string} content - Answer content
 * @returns {Object} { valid: boolean, error: string }
 */
const validateAnswerContent = (content) => {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      error: 'Answer content is required.'
    };
  }

  if (content.length < 10) {
    return {
      valid: false,
      error: 'Answer must be at least 10 characters.'
    };
  }

  if (content.length > 5000) {
    return {
      valid: false,
      error: 'Answer cannot exceed 5000 characters.'
    };
  }

  return { valid: true };
};

// ==================== COMMENT VALIDATION ====================

/**
 * Validate Comment Content
 * 
 * Validates comment content.
 * 
 * @param {string} content - Comment content
 * @returns {Object} { valid: boolean, error: string }
 */
const validateCommentContent = (content) => {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      error: 'Comment content is required.'
    };
  }

  if (content.length < 1) {
    return {
      valid: false,
      error: 'Comment must be at least 1 character.'
    };
  }

  if (content.length > 500) {
    return {
      valid: false,
      error: 'Comment cannot exceed 500 characters.'
    };
  }

  return { valid: true };
};

// ==================== USER VALIDATION ====================

/**
 * Validate Username
 * 
 * Validates username format and length.
 * 
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return {
      valid: false,
      error: 'Username is required.'
    };
  }

  if (username.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters.'
    };
  }

  if (username.length > 30) {
    return {
      valid: false,
      error: 'Username cannot exceed 30 characters.'
    };
  }

  // Only lowercase letters, numbers, and underscores
  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, and underscores.'
    };
  }

  return { valid: true };
};

/**
 * Validate Email
 * 
 * Validates email format.
 * 
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email is required.'
    };
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format.'
    };
  }

  return { valid: true };
};

/**
 * Validate Password
 * 
 * Validates password strength.
 * 
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error: string }
 */
const validatePassword = (password) => {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required.'
    };
  }

  if (password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters.'
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: 'Password cannot exceed 128 characters.'
    };
  }

  return { valid: true };
};

/**
 * Validate Attempt Year
 * 
 * Validates exam attempt year.
 * 
 * @param {number} year - Attempt year
 * @returns {Object} { valid: boolean, error: string }
 */
const validateAttemptYear = (year) => {
  if (!year) {
    return {
      valid: false,
      error: 'Attempt year is required.'
    };
  }

  if (!Number.isInteger(year)) {
    return {
      valid: false,
      error: 'Attempt year must be a valid integer.'
    };
  }

  if (year < 2024 || year > 2030) {
    return {
      valid: false,
      error: 'Attempt year must be between 2024 and 2030.'
    };
  }

  return { valid: true };
};

// ==================== RATING VALIDATION ====================

/**
 * Validate Rating
 * 
 * Validates rating value (1-5 stars).
 * 
 * @param {number} rating - Rating value
 * @returns {Object} { valid: boolean, error: string }
 */
const validateRating = (rating) => {
  if (rating === undefined || rating === null) {
    return {
      valid: false,
      error: 'Rating is required.'
    };
  }

  if (typeof rating !== 'number') {
    return {
      valid: false,
      error: 'Rating must be a number.'
    };
  }

  if (!Number.isInteger(rating)) {
    return {
      valid: false,
      error: 'Rating must be an integer.'
    };
  }

  if (rating < 1 || rating > 5) {
    return {
      valid: false,
      error: 'Rating must be between 1 and 5.'
    };
  }

  return { valid: true };
};

// ==================== UTILITY FUNCTION ====================

/**
 * Validate Multiple Fields
 * 
 * Helper to validate multiple fields at once.
 * Returns first error encountered.
 * 
 * @param {Array} validations - Array of validation results
 * @returns {Object} { valid: boolean, error: string }
 */
const validateAll = (validations) => {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }
  return { valid: true };
};

module.exports = {
  // Exam & Level
  validateExam,
  validateLevel,
  
  // Tags
  validateUserTags,
  
  // Content Metadata
  validateQuestionMetadata,
  validateResourceMetadata,
  validateAnswerContent,
  validateCommentContent,
  
  // User
  validateUsername,
  validateEmail,
  validatePassword,
  validateAttemptYear,
  
  // Rating
  validateRating,
  
  // Utility
  validateAll
};
