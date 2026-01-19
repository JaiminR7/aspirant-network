const Question = require('../models/Question');
const Resource = require('../models/Resource');

// ==================== HELPER: SAFE REGEX ====================

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build safe regex pattern for search
 */
function buildSafeRegex(searchTerm) {
  const escapedTerm = escapeRegex(searchTerm.trim());
  return new RegExp(escapedTerm, 'i');
}

// ==================== GLOBAL SEARCH ====================

/**
 * @desc    Search across questions and resources
 * @route   GET /api/search
 * @access  Protected
 */
const globalSearch = async (req, res, next) => {
  try {
    const {
      q, // search query
      type, // 'question' | 'resource' | 'all'
      subject,
      topic,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'relevance' // 'relevance' | 'recent' | 'popular'
    } = req.query;

    const exam = req.examContext;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    if (q.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Search query must not exceed 100 characters'
      });
    }

    const searchType = type || 'all';
    const skip = (page - 1) * limit;

    let questions = [];
    let resources = [];
    let questionCount = 0;
    let resourceCount = 0;

    // Build safe regex pattern
    const searchRegex = buildSafeRegex(q);

    // Build common filters
    const commonFilters = { exam };
    if (subject) commonFilters.subject = subject;
    if (topic) commonFilters.topic = topic;

    // Search Questions
    if (searchType === 'all' || searchType === 'question') {
      const questionFilter = {
        ...commonFilters,
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      };

      // Add tag filter if provided
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        questionFilter.$or.push(
          { systemTags: { $in: tagArray } },
          { userTags: { $in: tagArray } }
        );
      }

      // Get sort options
      const questionSort = getQuestionSort(sortBy);

      [questions, questionCount] = await Promise.all([
        Question.find(questionFilter)
          .populate('author', 'username profilePicture credibilityScore')
          .populate('subject', 'name slug')
          .populate('topic', 'name slug')
          .sort(questionSort)
          .skip(searchType === 'all' ? 0 : skip)
          .limit(searchType === 'all' ? Math.ceil(limit / 2) : parseInt(limit))
          .lean(),
        Question.countDocuments(questionFilter)
      ]);

      // Add content type to results
      questions = questions.map(q => ({ ...q, contentType: 'question' }));
    }

    // Search Resources
    if (searchType === 'all' || searchType === 'resource') {
      const resourceFilter = {
        ...commonFilters,
        $or: [
          { title: searchRegex },
          { description: searchRegex }
        ]
      };

      // Add tag filter if provided
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        resourceFilter.$or.push(
          { systemTags: { $in: tagArray } },
          { userTags: { $in: tagArray } }
        );
      }

      // Get sort options
      const resourceSort = getResourceSort(sortBy);

      [resources, resourceCount] = await Promise.all([
        Resource.find(resourceFilter)
          .populate('author', 'username profilePicture credibilityScore')
          .populate('subject', 'name slug')
          .populate('topic', 'name slug')
          .sort(resourceSort)
          .skip(searchType === 'all' ? 0 : skip)
          .limit(searchType === 'all' ? Math.ceil(limit / 2) : parseInt(limit))
          .lean(),
        Resource.countDocuments(resourceFilter)
      ]);

      // Add content type to results
      resources = resources.map(r => ({ ...r, contentType: 'resource' }));
    }

    // Combine and sort results for 'all' type
    let results = [];
    let total = 0;

    if (searchType === 'all') {
      results = [...questions, ...resources];
      
      // Sort combined results
      if (sortBy === 'recent') {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'popular') {
        results.sort((a, b) => {
          const aScore = (a.upvotes?.length || 0) + (a.savedBy?.length || 0);
          const bScore = (b.upvotes?.length || 0) + (b.savedBy?.length || 0);
          return bScore - aScore;
        });
      }

      // Paginate combined results
      results = results.slice(skip, skip + parseInt(limit));
      total = questionCount + resourceCount;
    } else if (searchType === 'question') {
      results = questions;
      total = questionCount;
    } else {
      results = resources;
      total = resourceCount;
    }

    res.status(200).json({
      success: true,
      data: results,
      counts: {
        questions: questionCount,
        resources: resourceCount,
        total: searchType === 'all' ? questionCount + resourceCount : total
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      query: {
        searchTerm: q,
        type: searchType,
        subject,
        topic,
        tags
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEARCH QUESTIONS ONLY ====================

/**
 * @desc    Search questions with advanced filters
 * @route   GET /api/search/questions
 * @access  Protected
 */
const searchQuestions = async (req, res, next) => {
  try {
    const {
      q,
      subject,
      topic,
      difficulty,
      tags,
      solved,
      hasAcceptedAnswer,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = req.query;

    const exam = req.examContext;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = buildSafeRegex(q);
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      exam,
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (solved === 'true') filter.isSolved = true;
    if (solved === 'false') filter.isSolved = false;
    if (hasAcceptedAnswer === 'true') filter.acceptedAnswer = { $ne: null };

    // Add tag filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.$or.push(
        { systemTags: { $in: tagArray } },
        { userTags: { $in: tagArray } }
      );
    }

    const sort = getQuestionSort(sortBy);

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      query: {
        searchTerm: q,
        filters: { subject, topic, difficulty, tags, solved, hasAcceptedAnswer }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEARCH RESOURCES ONLY ====================

/**
 * @desc    Search resources with advanced filters
 * @route   GET /api/search/resources
 * @access  Protected
 */
const searchResources = async (req, res, next) => {
  try {
    const {
      q,
      subject,
      topic,
      type,
      tags,
      verified,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = req.query;

    const exam = req.examContext;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = buildSafeRegex(q);
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      exam,
      $or: [
        { title: searchRegex },
        { description: searchRegex }
      ]
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (type) filter.type = type;
    if (verified === 'true') filter.isVerified = true;

    // Add tag filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.$or.push(
        { systemTags: { $in: tagArray } },
        { userTags: { $in: tagArray } }
      );
    }

    const sort = getResourceSort(sortBy);

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('author', 'username profilePicture credibilityScore')
        .populate('subject', 'name slug')
        .populate('topic', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      query: {
        searchTerm: q,
        filters: { subject, topic, type, tags, verified }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== SEARCH BY TAGS ====================

/**
 * @desc    Search content by tags only
 * @route   GET /api/search/tags
 * @access  Protected
 */
const searchByTags = async (req, res, next) => {
  try {
    const {
      tags,
      type = 'all', // 'question' | 'resource' | 'all'
      subject,
      topic,
      page = 1,
      limit = 20,
      sortBy = 'recent'
    } = req.query;

    const exam = req.examContext;

    // Validate tags
    if (!tags || (Array.isArray(tags) && tags.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one tag is required'
      });
    }

    const tagArray = Array.isArray(tags) ? tags : [tags];
    const skip = (page - 1) * limit;

    // Build common filters
    const commonFilters = { exam };
    if (subject) commonFilters.subject = subject;
    if (topic) commonFilters.topic = topic;

    let questions = [];
    let resources = [];
    let questionCount = 0;
    let resourceCount = 0;

    // Search Questions by tags
    if (type === 'all' || type === 'question') {
      const questionFilter = {
        ...commonFilters,
        $or: [
          { systemTags: { $in: tagArray } },
          { userTags: { $in: tagArray } }
        ]
      };

      [questions, questionCount] = await Promise.all([
        Question.find(questionFilter)
          .populate('author', 'username profilePicture credibilityScore')
          .populate('subject', 'name slug')
          .populate('topic', 'name slug')
          .sort(getQuestionSort(sortBy))
          .skip(type === 'all' ? 0 : skip)
          .limit(type === 'all' ? Math.ceil(limit / 2) : parseInt(limit))
          .lean(),
        Question.countDocuments(questionFilter)
      ]);

      questions = questions.map(q => ({ ...q, contentType: 'question' }));
    }

    // Search Resources by tags
    if (type === 'all' || type === 'resource') {
      const resourceFilter = {
        ...commonFilters,
        $or: [
          { systemTags: { $in: tagArray } },
          { userTags: { $in: tagArray } }
        ]
      };

      [resources, resourceCount] = await Promise.all([
        Resource.find(resourceFilter)
          .populate('author', 'username profilePicture credibilityScore')
          .populate('subject', 'name slug')
          .populate('topic', 'name slug')
          .sort(getResourceSort(sortBy))
          .skip(type === 'all' ? 0 : skip)
          .limit(type === 'all' ? Math.ceil(limit / 2) : parseInt(limit))
          .lean(),
        Resource.countDocuments(resourceFilter)
      ]);

      resources = resources.map(r => ({ ...r, contentType: 'resource' }));
    }

    // Combine results
    let results = [];
    let total = 0;

    if (type === 'all') {
      results = [...questions, ...resources];
      if (sortBy === 'recent') {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      results = results.slice(skip, skip + parseInt(limit));
      total = questionCount + resourceCount;
    } else if (type === 'question') {
      results = questions;
      total = questionCount;
    } else {
      results = resources;
      total = resourceCount;
    }

    res.status(200).json({
      success: true,
      data: results,
      counts: {
        questions: questionCount,
        resources: resourceCount,
        total: type === 'all' ? questionCount + resourceCount : total
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      },
      query: {
        tags: tagArray,
        type,
        subject,
        topic
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== AUTOCOMPLETE SEARCH ====================

/**
 * @desc    Autocomplete search suggestions
 * @route   GET /api/search/autocomplete
 * @access  Protected
 */
const autocomplete = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    const exam = req.examContext;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchRegex = buildSafeRegex(q);
    const limit = 10;

    let suggestions = [];

    // Get question titles
    if (type === 'all' || type === 'question') {
      const questions = await Question.find({
        exam,
        title: searchRegex
      })
        .select('title')
        .limit(limit)
        .lean();

      suggestions.push(...questions.map(q => ({
        text: q.title,
        type: 'question',
        id: q._id
      })));
    }

    // Get resource titles
    if (type === 'all' || type === 'resource') {
      const resources = await Resource.find({
        exam,
        title: searchRegex
      })
        .select('title')
        .limit(limit)
        .lean();

      suggestions.push(...resources.map(r => ({
        text: r.title,
        type: 'resource',
        id: r._id
      })));
    }

    // Remove duplicates and limit
    suggestions = suggestions.slice(0, limit);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

// ==================== HELPER: SORT OPTIONS ====================

/**
 * Get sort options for questions
 */
function getQuestionSort(sortBy) {
  const sortOptions = {
    relevance: { upvotes: -1, createdAt: -1 },
    recent: { createdAt: -1 },
    popular: { upvotes: -1, views: -1 },
    unanswered: { answerCount: 1, createdAt: -1 },
    mostAnswered: { answerCount: -1 }
  };
  return sortOptions[sortBy] || sortOptions.relevance;
}

/**
 * Get sort options for resources
 */
function getResourceSort(sortBy) {
  const sortOptions = {
    relevance: { averageRating: -1, createdAt: -1 },
    recent: { createdAt: -1 },
    popular: { savedBy: -1, views: -1 },
    topRated: { averageRating: -1, ratings: -1 },
    mostSaved: { savedBy: -1 }
  };
  return sortOptions[sortBy] || sortOptions.relevance;
}

module.exports = {
  globalSearch,
  searchQuestions,
  searchResources,
  searchByTags,
  autocomplete
};
