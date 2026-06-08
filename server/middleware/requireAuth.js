import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required'
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id, role } = jwt.verify(token, process.env.JWT_SECRET);
    
    if (role === 'admin') {
      // Admin is not stored in MongoDB, set a mock user on req.user for admin actions
      req.user = {
        _id: 'admin_id',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        name: 'Administrator'
      };
      return next();
    }

    const user = await User.findById(_id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or authorization failed'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Request is not authorized'
    });
  }
};

export default requireAuth;
