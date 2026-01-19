const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const topicSchema = new mongoose.Schema({
  // Topic Name
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters']
  },

  // Exam Reference (CRITICAL: Must match subject's exam)
  exam: {
    type: String,
    required: [true, 'Exam is required'],
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
  },

  // Subject Reference (ObjectId)
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },

  // Subject Name (denormalized for faster queries)
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },

  // Slug (URL-friendly)
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // Description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Difficulty Level
  difficulty: {
    type: String,
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: '{VALUE} is not a valid difficulty level'
    },
    default: 'Medium'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Display Order (for UI sorting)
  displayOrder: {
    type: Number,
    default: 0
  },

  // Statistics
  stats: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    totalResources: {
      type: Number,
      default: 0
    }
  }

}, {
  timestamps: true,
  strict: true,
  collection: 'topics'
});

// ==================== INDEXES ====================

// Unique topic per subject per exam (prevents duplicate topics)
topicSchema.index({ exam: 1, subject: 1, name: 1 }, { unique: true });
topicSchema.index({ exam: 1, subjectName: 1, slug: 1 }, { unique: true });

// Query optimization
topicSchema.index({ exam: 1, subject: 1, isActive: 1 });
topicSchema.index({ exam: 1, subjectName: 1 });
topicSchema.index({ subject: 1, isActive: 1 });
topicSchema.index({ difficulty: 1 });
topicSchema.index({ displayOrder: 1 });

// ==================== MIDDLEWARE ====================

// Auto-generate slug from name before saving
topicSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// CRITICAL: Validate that topic's exam matches subject's exam
topicSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('subject') || this.isModified('exam')) {
    try {
      const Subject = mongoose.model('Subject');
      const subject = await Subject.findById(this.subject);
      
      if (!subject) {
        return next(new Error('Subject not found'));
      }
      
      if (subject.exam !== this.exam) {
        return next(new Error(`Topic exam (${this.exam}) must match subject exam (${subject.exam})`));
      }
      
      // Auto-populate subjectName
      this.subjectName = subject.name;
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// ==================== INSTANCE METHODS ====================

// Increment question count
topicSchema.methods.incrementQuestions = function() {
  this.stats.totalQuestions += 1;
  return this.save();
};

// Increment resource count
topicSchema.methods.incrementResources = function() {
  this.stats.totalResources += 1;
  return this.save();
};

// Update difficulty
topicSchema.methods.updateDifficulty = function(difficulty) {
  this.difficulty = difficulty;
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get all topics for a specific exam
topicSchema.statics.getByExam = function(exam, activeOnly = true) {
  const query = { exam };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query)
    .populate('subject', 'name slug')
    .sort({ displayOrder: 1, name: 1 });
};

// Get topics for a specific subject
topicSchema.statics.getBySubject = function(subjectId, activeOnly = true) {
  const query = { subject: subjectId };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Get topics by exam and subject name
topicSchema.statics.getByExamAndSubject = function(exam, subjectName, activeOnly = true) {
  const query = { exam, subjectName };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Get topic by exam, subject name, and topic name
topicSchema.statics.getByExamSubjectAndName = function(exam, subjectName, topicName) {
  return this.findOne({ 
    exam, 
    subjectName, 
    name: topicName, 
    isActive: true 
  }).populate('subject', 'name slug');
};

// Get topic by exam, subject name, and slug
topicSchema.statics.getByExamSubjectAndSlug = function(exam, subjectName, slug) {
  return this.findOne({ 
    exam, 
    subjectName, 
    slug: slug.toLowerCase(), 
    isActive: true 
  }).populate('subject', 'name slug');
};

// Get topics by difficulty
topicSchema.statics.getByDifficulty = function(exam, difficulty, activeOnly = true) {
  const query = { exam, difficulty };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Get all topic names for a subject
topicSchema.statics.getTopicNamesBySubject = async function(subjectId) {
  const topics = await this.find({ subject: subjectId, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('name');
  
  return topics.map(t => t.name);
};

// Check if topic exists
topicSchema.statics.existsForSubject = async function(subjectId, topicName) {
  const count = await this.countDocuments({ 
    subject: subjectId, 
    name: topicName 
  });
  return count > 0;
};

// ==================== VIRTUAL PROPERTIES ====================

// Full display name with subject and exam
topicSchema.virtual('fullName').get(function() {
  return `${this.exam} - ${this.subjectName} - ${this.name}`;
});

// URL path
topicSchema.virtual('path').get(function() {
  return `/exams/${this.exam.toLowerCase()}/subjects/${this.subjectName.toLowerCase().replace(/\s+/g, '-')}/topics/${this.slug}`;
});

// Difficulty badge color (for UI)
topicSchema.virtual('difficultyColor').get(function() {
  const colors = {
    'Easy': '#10B981',    // Green
    'Medium': '#F59E0B',  // Amber
    'Hard': '#EF4444'     // Red
  };
  return colors[this.difficulty] || '#6B7280';
});

// Ensure virtuals are included in JSON
topicSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

topicSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Topic', topicSchema);
