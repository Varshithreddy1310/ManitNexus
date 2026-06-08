import express from 'express';
import { 
  getFlaggedPosts, approveFlaggedPost, deletePost, 
  changePostCategory, getAnalytics 
} from '../controllers/adminController.js';
import requireAuth from '../middleware/requireAuth.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

// Enforce authentication on all sub-routes
router.use(requireAuth);

// Accessible to all logged-in users (Dashboard)
router.get('/analytics', getAnalytics);

// Admin-only routes below this line
router.use(requireAdmin);

router.get('/flagged-posts', getFlaggedPosts);
router.put('/approve/:id', approveFlaggedPost);
router.delete('/delete/:id', deletePost);
router.put('/category/:id', changePostCategory);

export default router;
