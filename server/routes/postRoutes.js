import express from 'express';
import { createPost, getPosts, getPostById, votePost, getMyPosts } from '../controllers/postController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Secure all post routes under requireAuth
router.use(requireAuth);

router.post('/posts', createPost);
router.get('/posts', getPosts);
router.get('/posts/mine', getMyPosts);  // Must be before /posts/:id
router.get('/posts/vote', (req, res) => res.status(405).json({ success: false, message: 'Use PUT to register votes' }));
router.put('/posts/vote', votePost);
router.get('/posts/:id', getPostById);

export default router;
