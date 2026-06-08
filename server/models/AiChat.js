import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  question: {
    type: String,
    required: true
  },
  aiAnswer: {
    type: String,
    required: true
  },
  referencedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }]
}, { timestamps: true });

// Index for fast retrieval of a user's chat history, newest first
aiChatSchema.index({ studentId: 1, createdAt: -1 });

const AiChat = mongoose.model('AiChat', aiChatSchema);
export default AiChat;
