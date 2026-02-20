const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const questionSchema = new mongoose.Schema({
  // Question Title
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Question Description/Content
  description: {
    type: String,
    required: [true, 'Question description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },

  // CRITICAL: Exam Context (Question is strictly exam-scoped)
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

  // Subject Name (denormalized for faster filtering)
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },

  // Topic Reference (ObjectId)
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },

  // Topic Name (denormalized for faster filtering)
  topicName: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true
  },

  // Created By (User reference)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },

  // Images/Attachments (Cloudinary)
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System Tags (Predefined tags for categorization)
  systemTags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // User Tags (CRITICAL: Max 3 tags)
  userTags: {
    type: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    validate: {
      validator: function(tags) {
        return tags.length <= 3;
      },
      message: 'Cannot add more than 3 user tags'
    }
  },

  // Question Status
  isSolved: {
    type: Boolean,
    default: false
  },

  solvedAt: {
    type: Date
  },

  // Accepted Answer (marked as solution)
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },

  // Voting System
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },

  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Answer Count
  answerCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Views
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },

  reportCount: {
    type: Number,
    default: 0,
    min: 0
  },

  isHidden: {
    type: Boolean,
    default: false
  },

  // Activity Tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  strict: true,
  collection: 'questions'
});

questionSchema.index({ exam: 1, createdAt: -1 });
questionSchema.index({ exam: 1, subject: 1, topic: 1 });
questionSchema.index({ createdBy: 1, createdAt: -1 });
questionSchema.index({ upvotes: -1 });
questionSchema.index({ lastActivityAt: -1 });

questionSchema.pre('save', async function() {
  if (this.isNew || this.isModified('exam') || this.isModified('subject') || this.isModified('topic')) {
    const Subject = mongoose.model('Subject');
    const Topic = mongoose.model('Topic');
    
    const [subject, topic] = await Promise.all([
      Subject.findById(this.subject),
      Topic.findById(this.topic)
    ]);
    
    if (!subject || !topic) throw new Error('Subject or topic not found');
    if (subject.exam !== this.exam || topic.exam !== this.exam) throw new Error('Exam mismatch');
    if (topic.subject.toString() !== this.subject.toString()) throw new Error('Topic-subject mismatch');
    
    this.subjectName = subject.name;
    this.topicName = topic.name;
  }
});

questionSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.viewedBy;
    delete ret.upvotedBy;
    delete ret.downvotedBy;
    return ret;
  }
});

module.exports = mongoose.model('Question', questionSchema);
