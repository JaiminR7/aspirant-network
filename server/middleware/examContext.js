const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const { getExamEnum } = require('../constants/exams');

const validateExamContext = (req, res, next) => {
  if (!req.examContext) {
    return res.status(400).json({ success: false, message: 'Exam context missing' });
  }
  next();
};

const validateSubjectInExam = async (req, res, next) => {
  try {
    const subjectId = req.body.subject || req.params.subjectId;
    if (!subjectId) return res.status(400).json({ success: false, message: 'Subject ID required' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    if (subject.exam.toString() !== req.examContext.toString()) {
      return res.status(403).json({ success: false, message: 'Subject not in your exam context' });
    }

    req.subject = subject;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
};

const validateTopicInExam = async (req, res, next) => {
  try {
    const topicId = req.body.topic || req.params.topicId;
    if (!topicId) return res.status(400).json({ success: false, message: 'Topic ID required' });

    const topic = await Topic.findById(topicId).populate('subject');
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });

    if (topic.exam.toString() !== req.examContext.toString()) {
      return res.status(403).json({ success: false, message: 'Topic not in your exam context' });
    }

    req.topic = topic;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Validation failed' });
  }
};

const attachExamContext = async (req, res, next) => {
  try {
    const examId = req.body.examId || req.params.examId || req.query.examId;
    if (!examId) return res.status(400).json({ success: false, message: 'Exam ID required' });

    const exam = await Exam.findById(examId);
    if (!exam || !exam.isActive) return res.status(404).json({ success: false, message: 'Exam not found or inactive' });

    req.examContext = exam._id;
    req.exam = exam;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to attach exam context' });
  }
};

/**
 * Enforce Exam Context
 * 
 * Enforces that users can only access content from their own exam.
 * Must be used AFTER auth middleware.
 */
const enforceExamContext = (req, res, next) => {
  try {
    // Skip if no user (handled by auth middleware)
    if (!req.user || !req.examContext) {
      return next();
    }

    const userExam = req.examContext;

    // Check query parameters for exam
    if (req.query.exam && req.query.exam !== userExam) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only access content from your exam (${userExam}).`,
        attemptedExam: req.query.exam,
        userExam: userExam
      });
    }

    // Check request body for exam (only if body exists)
    if (req.body && req.body.exam && req.body.exam !== userExam) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only create content for your exam (${userExam}).`,
        attemptedExam: req.body.exam,
        userExam: userExam
      });
    }

    // Check route parameters for exam
    if (req.params.exam && req.params.exam !== userExam) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only access ${userExam} content.`,
        attemptedExam: req.params.exam,
        userExam: userExam
      });
    }

    // Force exam context in request body (if creating/updating content)
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      req.body = req.body || {};
      req.body.exam = userExam;
    }

    // Force exam context in query (if querying content)
    if (req.method === 'GET') {
      req.query.exam = userExam;
    }

    next();
  } catch (error) {
    console.error('Exam context enforcement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error enforcing exam context.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Validate Exam Parameter
 * 
 * Validates that the exam parameter is a valid exam from the allowed list.
 * Use this for public routes that accept exam as parameter.
 */
const validateExamParam = (paramName = 'exam') => {
  return (req, res, next) => {
    const exam = req.params[paramName] || req.query[paramName] || req.body[paramName];

    if (!exam) {
      return res.status(400).json({
        success: false,
        message: `${paramName} is required.`
      });
    }

    const validExams = getExamEnum();
    
    if (!validExams.includes(exam)) {
      return res.status(400).json({
        success: false,
        message: `Invalid exam. Allowed values: ${validExams.join(', ')}`,
        providedExam: exam
      });
    }

    next();
  };
};

/**
 * Inject Exam Context
 * 
 * Automatically injects user's exam context into queries and operations.
 * This ensures all database queries are automatically scoped to the user's exam.
 * 
 * Must be used AFTER auth middleware.
 */
const injectExamContext = (req, res, next) => {
  if (req.user && req.examContext) {
    // Inject into query
    req.query = req.query || {};
    if (!req.query.exam) {
      req.query.exam = req.examContext;
    }

    // Inject into body
    req.body = req.body || {};
    if (!req.body.exam) {
      req.body.exam = req.examContext;
    }

    // Create a filter object for MongoDB queries
    req.examFilter = { exam: req.examContext };
  }

  next();
};

/**
 * Allow Exam Change
 * 
 * Special middleware for routes that allow exam change (like settings).
 * Validates the new exam but doesn't enforce current exam context.
 */
const allowExamChange = (req, res, next) => {
  const newExam = req.body.primaryExam || req.body.exam;

  if (newExam) {
    const validExams = getExamEnum();
    
    if (!validExams.includes(newExam)) {
      return res.status(400).json({
        success: false,
        message: `Invalid exam. Allowed values: ${validExams.join(', ')}`,
        providedExam: newExam
      });
    }
  }

  next();
};

/**
 * Cross-Exam Access Denied
 * 
 * Explicitly denies any cross-exam access.
 * Use this for sensitive routes where exam isolation is critical.
 */
const strictExamIsolation = async (req, res, next) => {
  try {
    if (!req.user || !req.examContext) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for exam-isolated resources.'
      });
    }

    // Check all possible sources of exam parameter
    const requestedExam = 
      req.params.exam || 
      req.query.exam || 
      req.body.exam ||
      req.examContext; // Default to user's exam

    // CRITICAL: Reject if exam doesn't match user's exam
    if (requestedExam !== req.examContext) {
      return res.status(403).json({
        success: false,
        message: 'Cross-exam access is strictly prohibited.',
        userExam: req.examContext,
        requestedExam: requestedExam
      });
    }

    next();
  } catch (error) {
    console.error('Strict exam isolation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error enforcing exam isolation.'
    });
  }
};

/**
 * Exam Context Validator for Resource Creation
 * 
 * Validates that subject and topic belong to the user's exam.
 * Use this when creating questions, resources, etc.
 */
const validateExamContextForCreation = async (req, res, next) => {
  try {
    if (!req.user || !req.examContext) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { subject, topic } = req.body;

    if (subject) {
      const Subject = require('../models/Subject');
      const subjectDoc = await Subject.findById(subject);

      if (!subjectDoc) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found.'
        });
      }

      if (subjectDoc.exam !== req.examContext) {
        return res.status(403).json({
          success: false,
          message: `Subject belongs to ${subjectDoc.exam}, but you are enrolled in ${req.examContext}.`
        });
      }
    }

    if (topic) {
      const Topic = require('../models/Topic');
      const topicDoc = await Topic.findById(topic);

      if (!topicDoc) {
        return res.status(404).json({
          success: false,
          message: 'Topic not found.'
        });
      }

      if (topicDoc.exam !== req.examContext) {
        return res.status(403).json({
          success: false,
          message: `Topic belongs to ${topicDoc.exam}, but you are enrolled in ${req.examContext}.`
        });
      }
    }

    next();
  } catch (error) {
    console.error('Exam context validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating exam context.'
    });
  }
};

module.exports = {
  // Old/legacy middleware (kept for backward compatibility)
  validateExamContext,
  validateSubjectInExam,
  validateTopicInExam,
  attachExamContext,
  
  // New middleware
  enforceExamContext,
  validateExamParam,
  injectExamContext,
  allowExamChange,
  strictExamIsolation,
  validateExamContextForCreation
};
