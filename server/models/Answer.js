const mongoose = require('mongoose');
const { getExamEnum } = require('../constants/exams');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true, trim: true },
  images: [{ url: String, publicId: String }],
  exam: { 
    type: String, 
    required: true,
    enum: {
      values: getExamEnum(),
      message: '{VALUE} is not a valid exam'
    }
  },
  upvotes: { type: Number, default: 0 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: { type: Number, default: 0 },
  downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isAccepted: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

answerSchema.index({ question: 1, exam: 1 });
answerSchema.index({ author: 1, exam: 1 });
answerSchema.index({ isAccepted: 1 });

answerSchema.pre('save', async function() {
  if (this.isModified('isAccepted') && this.isAccepted) {
    await this.constructor.updateMany(
      { question: this.question, _id: { $ne: this._id } },
      { isAccepted: false }
    );
  }
});

answerSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.isAnonymous) {
      delete ret.author;
    }
    return ret;
  }
});

module.exports = mongoose.model('Answer', answerSchema);
