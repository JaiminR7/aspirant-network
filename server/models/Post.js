const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required'],
      index: true
    },
    exam: {
      type: String,
      required: [true, 'Post exam is required'],
      enum: {
        values: getExamEnum(),
        message: '{VALUE} is not a valid exam'
      },
      index: true
    },
    type: {
      type: String,
      required: [true, 'Post type is required'],
      enum: {
        values: ['question', 'resource', 'story'],
        message: '{VALUE} is not a valid post type'
      },
      default: 'question',
      index: true
    },
    sourceModel: {
      type: String,
      enum: ['Question', 'Story', 'Resource'],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [220, 'Title cannot exceed 220 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: [30, 'Tag cannot exceed 30 characters']
        }
      ],
      default: []
    },
    fileUrl: {
      type: String,
      trim: true,
      default: null
    },
    fileType: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      enum: {
        values: [null, 'pdf'],
        message: '{VALUE} is not a supported file type'
      }
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    dislikesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    strict: true,
    collection: 'posts'
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ likesCount: -1, commentsCount: -1 });
postSchema.index({ exam: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ sourceModel: 1, sourceId: 1 }, { unique: true });

postSchema.set('toJSON', {
  transform: function transformPost(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Post', postSchema);
