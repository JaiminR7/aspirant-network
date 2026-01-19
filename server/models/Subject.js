
const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const subjectSchema = new mongoose.Schema({
  // Subject Name
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },

  // Exam Reference (CRITICAL: Subject belongs to ONE exam only)
  exam: {
    type: String,
    required: [true, 'Exam is required'],
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
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
    maxlength: [300, 'Description cannot exceed 300 characters']
  },

  // Topics under this subject (controlled list)
  topics: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],

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
  collection: 'subjects'
});

// ==================== INDEXES ====================

// Unique subject per exam (prevents duplicate subjects in same exam)
subjectSchema.index({ exam: 1, name: 1 }, { unique: true });
subjectSchema.index({ exam: 1, slug: 1 }, { unique: true });

// Query optimization
subjectSchema.index({ exam: 1, isActive: 1 });
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ displayOrder: 1 });

// ==================== MIDDLEWARE ====================

// Auto-generate slug from name before saving
subjectSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Auto-generate slug for topics
subjectSchema.pre('save', function(next) {
  this.topics.forEach(topic => {
    if (!topic.slug && topic.name) {
      topic.slug = topic.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  });
  next();
});

// ==================== INSTANCE METHODS ====================

// Add topic to subject
subjectSchema.methods.addTopic = function(topicName, description = '') {
  const existingTopic = this.topics.find(t => t.name === topicName);
  
  if (!existingTopic) {
    const slug = topicName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    this.topics.push({ 
      name: topicName, 
      slug,
      description 
    });
  }
  
  return this.save();
};

// Remove topic from subject
subjectSchema.methods.removeTopic = function(topicName) {
  this.topics = this.topics.filter(t => t.name !== topicName);
  return this.save();
};

// Get active topics
subjectSchema.methods.getActiveTopics = function() {
  return this.topics.filter(t => t.isActive);
};

// Get topic names
subjectSchema.methods.getTopicNames = function() {
  return this.topics.filter(t => t.isActive).map(t => t.name);
};

// Increment question count
subjectSchema.methods.incrementQuestions = function() {
  this.stats.totalQuestions += 1;
  return this.save();
};

// Increment resource count
subjectSchema.methods.incrementResources = function() {
  this.stats.totalResources += 1;
  return this.save();
};

// ==================== STATIC METHODS ====================

// Get all subjects for a specific exam
subjectSchema.statics.getByExam = function(exam, activeOnly = true) {
  const query = { exam };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Get subject by exam and name
subjectSchema.statics.getByExamAndName = function(exam, subjectName) {
  return this.findOne({ 
    exam, 
    name: subjectName, 
    isActive: true 
  });
};

// Get subject by exam and slug
subjectSchema.statics.getByExamAndSlug = function(exam, slug) {
  return this.findOne({ 
    exam, 
    slug: slug.toLowerCase(), 
    isActive: true 
  });
};

// Get topics for a subject
subjectSchema.statics.getTopicsBySubject = async function(exam, subjectName) {
  const subject = await this.findOne({ exam, name: subjectName, isActive: true });
  return subject ? subject.getTopicNames() : [];
};

// Get all subject names for an exam
subjectSchema.statics.getSubjectNamesByExam = async function(exam) {
  const subjects = await this.find({ exam, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .select('name');
  
  return subjects.map(s => s.name);
};

// Check if subject exists for exam
subjectSchema.statics.existsForExam = async function(exam, subjectName) {
  const count = await this.countDocuments({ 
    exam, 
    name: subjectName 
  });
  return count > 0;
};

// ==================== VIRTUAL PROPERTIES ====================

// Full display name with exam
subjectSchema.virtual('fullName').get(function() {
  return `${this.exam} - ${this.name}`;
});

// URL path
subjectSchema.virtual('path').get(function() {
  return `/exams/${this.exam.toLowerCase()}/subjects/${this.slug}`;
});

// Ensure virtuals are included in JSON
subjectSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

subjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subject', subjectSchema);
