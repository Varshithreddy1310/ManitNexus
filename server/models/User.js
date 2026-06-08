import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\d+@stu\.manit\.ac\.in$/
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "alumni"],
    required: true
  },
  batchYear: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
