import express from 'express';
import { register, login, adminLogin, getMe } from '../controllers/authController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Public auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/admin/login', adminLogin);

// Protected profile route
router.get('/auth/me', requireAuth, getMe);

export default router;
