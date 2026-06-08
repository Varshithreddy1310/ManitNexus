import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to sign JWT
const signToken = (id, role) => {
  return jwt.sign({ _id: id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register a new student or alumnus
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long',
      });
    }

    // 2. Email format validation
    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Only MANIT student emails are allowed.',
      });
    }

    // 3. Password validation
    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include at least one number',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already registered with this email',
      });
    }

    // 4. Role assignment logic
    // Email is like 24112011371@stu.manit.ac.in
    const prefix = email.split('@')[0];
    const batchYear = parseInt(prefix.substring(0, 2), 10);

    if (isNaN(batchYear)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roll number format in email',
      });
    }

    const role = batchYear >= 23 ? 'student' : 'alumni';

    // 5. Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Save user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      batchYear,
    });

    // 7. Return token & user object (exclude password)
    const token = signToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          batchYear: user.batchYear,
        },
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Login student or alumnus
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Return JWT + user object
    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          batchYear: user.batchYear,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Admin passkey login
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  const { email, passkey } = req.body;

  try {
    if (!email || !passkey) {
      return res.status(400).json({
        success: false,
        message: 'Email and passkey are required',
      });
    }

    // Check email matches admin email in .env
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    // Compare with hashed passkey in .env
    const isMatch = await bcrypt.compare(passkey, process.env.ADMIN_PASSKEY_HASH);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials',
      });
    }

    // Sign admin token
    const token = signToken('admin_id', 'admin');

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: 'admin_id',
          name: 'Administrator',
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
        },
      },
      message: 'Admin login successful',
    });
  } catch (error) {
    console.error('Admin Login Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
    });
  }
};

// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user profile',
    });
  }
};
