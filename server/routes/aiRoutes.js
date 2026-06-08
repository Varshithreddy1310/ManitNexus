import express from 'express';
import {
  askQuestion,
  getChatHistory,
  deleteChatEntry,
  clearAllHistory
} from '../controllers/aiController.js';
import requireAuth from '../middleware/requireAuth.js';
import aiRateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// All AI routes require authentication
router.use(requireAuth);

// POST /api/ai/ask — Rate limited: 20 per hour per user
router.post('/ai/ask', aiRateLimiter, askQuestion);

// GET /api/ai/history — Retrieve user's chat history
router.get('/ai/history', getChatHistory);

// DELETE /api/ai/history/:id — Delete single chat entry
router.delete('/ai/history/:id', deleteChatEntry);

// DELETE /api/ai/history — Clear all chat history
router.delete('/ai/history', clearAllHistory);

export default router;
