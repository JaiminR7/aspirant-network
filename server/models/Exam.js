const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const examSchema = new mongoose.Schema({
  // Exam Code (Unique identifier)
  examCode: {
    type: String,
    required: [true, 'Exam code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam code'
    }
  },

  // Display Name
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },

  // Full Name
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [200, 'Full name cannot exceed 200 characters']
  },

  // Description
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Management', 'Engineering', 'Medical', 'Government Services', 'Banking', 'International', 'Language'],
      message: '{VALUE} is not a valid category'
    }
  },

  // Subjects (controlled list per exam)
  subjects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    topics: [{
      type: String,
      trim: true
    }]
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  metadata: {
    eligibility: String,
    examPattern: String,
    officialWebsite: String,
    totalMarks: Number,
    duration: String, // e.g., "3 hours"
    frequency: String // e.g., "Once a year"
  },

  // Statistics (for analytics)
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
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
  collection: 'exams'
});

// ==================== INDEXES ====================

examSchema.index({ examCode: 1 }, { unique: true });
examSchema.index({ isActive: 1 });
examSchema.index({ category: 1 });

// ==================== INSTANCE METHODS ====================

// Increment user count
examSchema.methods.incrementUsers = function() {
  this.stats.totalUsers += 1;
  return this.save();
};

// Decrement user count
examSchema.methods.decrementUsers = function() {
  if (this.stats.totalUsers > 0) {
    this.stats.totalUsers -= 1;
  }
  return this.save();
};

// Increment question count
examSchema.methods.incrementQuestions = function() {
  this.stats.totalQuestions += 1;
  return this.save();
};

// Increment resource count
examSchema.methods.incrementResources = function() {
  this.stats.totalResources += 1;
  return this.save();
};

// Add subject to exam
examSchema.methods.addSubject = function(subjectName, topics = []) {
  const existingSubject = this.subjects.find(s => s.name === subjectName);
  
  if (!existingSubject) {
    this.subjects.push({ name: subjectName, topics });
  }
  
  return this.save();
};

// Get all subject names
examSchema.methods.getSubjectNames = function() {
  return this.subjects.map(s => s.name);
};

// Get topics for a subject
examSchema.methods.getTopicsForSubject = function(subjectName) {
  const subject = this.subjects.find(s => s.name === subjectName);
  return subject ? subject.topics : [];
};

// ==================== STATIC METHODS ====================

// Get all active exams
examSchema.statics.getActiveExams = function() {
  return this.find({ isActive: true }).select('examCode displayName fullName description category');
};

// Get exam by code
examSchema.statics.getByCode = function(examCode) {
  return this.findOne({ examCode: examCode.toUpperCase(), isActive: true });
};

// Get exams by category
examSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true });
};

// Get subjects for exam code
examSchema.statics.getSubjectsByExamCode = async function(examCode) {
  const exam = await this.findOne({ examCode: examCode.toUpperCase() });
  return exam ? exam.getSubjectNames() : [];
};

// ==================== VIRTUAL PROPERTIES ====================

// URL-friendly slug
examSchema.virtual('slug').get(function() {
  return this.examCode.toLowerCase();
});

// Ensure virtuals are included in JSON
examSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

examSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Exam', examSchema);
