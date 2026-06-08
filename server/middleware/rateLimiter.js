import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for AI chat routes.
 * Limits to 20 requests per hour per user (keyed by userId + IP).
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Key by user ID only so each account has its own independent quota
    return req.user?._id?.toString() || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "You've reached your hourly limit. Try again later."
    });
  }
});

export default aiRateLimiter;
