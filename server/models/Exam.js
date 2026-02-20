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

}, { timestamps: true, collection: 'exams' });

examSchema.index({ examCode: 1 }, { unique: true });
examSchema.index({ isActive: 1 });
examSchema.index({ category: 1 });

examSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Exam', examSchema);
