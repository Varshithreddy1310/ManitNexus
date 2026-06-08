import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Vote from '../models/Vote.js';
import { processPost } from '../services/postProcessingService.js';

// @desc    Get all posts by the current user (all statuses)
// @route   GET /api/posts/mine
// @access  Private
export const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    console.error('Get My Posts Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your posts'
    });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { content, links } = req.body;

  try {
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    if (content.length < 20 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post content must be between 20 and 2000 characters'
      });
    }

    // Safeguard links array
    const linksArray = Array.isArray(links) ? links.filter(link => typeof link === 'string' && link.trim() !== '') : [];

    const newPost = await Post.create({
      authorId: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      content,
      links: linksArray,
      moderationStatus: 'pending'
    });

    // Run the live AI pipeline (moderate, categorize, embed) asynchronously in background
    processPost(newPost._id);

    res.status(201).json({
      success: true,
      data: {
        post: newPost
      },
      message: 'Post submitted successfully! It will appear on the feed after moderation.'
    });
  } catch (error) {
    console.error('Create Post Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    });
  }
};

// @desc    Get all approved posts (with pagination, filtering, and sorting)
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res) => {
  const { category, page = 1, limit = 10, sort = 'votes' } = req.query;

  try {
    const matchQuery = { moderationStatus: 'approved' };
    if (category) {
      matchQuery.category = category;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Build the sort stage based on query params
    let sortStage = {};
    if (sort === 'recent') {
      sortStage = { createdAt: -1 };
    } else {
      // Default: sort by netVotes descending, then createdAt as tiebreaker
      sortStage = { netVotes: -1, createdAt: -1 };
    }

    // Aggregate to fetch netVotes (upvotes - downvotes)
    const posts = await Post.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          netVotes: { $subtract: ['$upvotes', '$downvotes'] }
        }
      },
      { $sort: sortStage },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum }
    ]);

    // Count total matched posts for pagination info
    const totalCount = await Post.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get Feed Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feed'
    });
  }
};

// @desc    Get post details by ID
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post identifier'
      });
    }

    const post = await Post.findById(id);
    if (!post || post.moderationStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Post not found or pending review'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        post
      }
    });
  } catch (error) {
    console.error('Get Post Details Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving post details'
    });
  }
};

// @desc    Vote on a post (upvote / downvote)
// @route   PUT /api/posts/vote
// @access  Private
export const votePost = async (req, res) => {
  const { postId, voteType } = req.body;
  const userId = req.user._id;

  try {
    if (!postId || !voteType) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and vote type are required'
      });
    }

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return res.status(400).json({
        success: false,
        message: "Vote type must be either 'upvote' or 'downvote'"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    // Verify post exists and is approved
    const post = await Post.findById(postId);
    if (!post || post.moderationStatus !== 'approved') {
      return res.status(404).json({
        success: false,
        message: 'Approved post not found'
      });
    }

    // Check for existing vote
    const existingVote = await Vote.findOne({ userId, postId });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off if clicking the same button
        await Vote.deleteOne({ _id: existingVote._id });
      } else {
        // Switch vote type if clicking the opposite button
        existingVote.voteType = voteType;
        await existingVote.save();
      }
    } else {
      // Create new vote record
      await Vote.create({ userId, postId, voteType });
    }

    // Recalculate upvotes and downvotes
    const upvotesCount = await Vote.countDocuments({ postId, voteType: 'upvote' });
    const downvotesCount = await Vote.countDocuments({ postId, voteType: 'downvote' });

    // Update Post document
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { upvotes: upvotesCount, downvotes: downvotesCount },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        postId,
        upvotes: updatedPost.upvotes,
        downvotes: updatedPost.downvotes
      },
      message: 'Vote registered successfully'
    });
  } catch (error) {
    console.error('Voting Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error logging vote'
    });
  }
};
