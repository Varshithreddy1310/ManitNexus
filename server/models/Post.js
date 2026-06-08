import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorRole: {
    type: String,
    enum: ["student", "alumni"],
    required: true
  },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  links: [{
    type: String
  }],
  category: {
    type: String,
    enum: [
      "Semester Exam Tips",
      "Placement Experiences",
      "Coding Resources",
      "Hostel Reviews",
      "Faculty Reviews",
      "Career Advice",
      "Others"
    ],
    default: "Others"
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "flagged"],
    default: "pending"
  },
  moderationReason: {
    type: String,
    default: null
  },
  embedding: {
    type: [Number],
    default: []
  }
}, { timestamps: true });

// Create indexes for sorting & filtering
postSchema.index({ moderationStatus: 1, category: 1 });
postSchema.index({ upvotes: -1, downvotes: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;
