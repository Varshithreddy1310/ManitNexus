import Post from '../models/Post.js';
import User from '../models/User.js';
import { categorizeContent } from '../ai/categorizationService.js';
import { generateEmbedding } from '../ai/embeddingService.js';

// @desc    Get all flagged posts awaiting moderation review
// @route   GET /api/admin/flagged-posts
// @access  Admin Only
export const getFlaggedPosts = async (req, res) => {
  try {
    const flaggedPosts = await Post.find({ moderationStatus: 'flagged' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        posts: flaggedPosts
      }
    });
  } catch (error) {
    console.error('Get Flagged Posts Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving flagged posts queue'
    });
  }
};

// @desc    Approve a flagged post (triggers categorization and embeddings generation)
// @route   PUT /api/admin/approve/:id
// @access  Admin Only
export const approveFlaggedPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Process the approved post semantic systems
    const category = await categorizeContent(post.content);
    const embedding = await generateEmbedding(post.content);

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        moderationStatus: 'approved',
        moderationReason: null, // Clear flag reason
        category,
        embedding
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        post: updatedPost
      },
      message: 'Post successfully approved and indexed'
    });
  } catch (error) {
    console.error('Admin Post Approve Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error approving post'
    });
  }
};

// @desc    Permanently delete a post
// @route   DELETE /api/admin/delete/:id
// @access  Admin Only
export const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPost = await Post.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        postId: id
      },
      message: 'Post permanently deleted successfully'
    });
  } catch (error) {
    console.error('Delete Post Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    });
  }
};

// @desc    Manually change post category
// @route   PUT /api/admin/category/:id
// @access  Admin Only
export const changePostCategory = async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;

  const VALID_CATEGORIES = [
    "Semester Exam Tips",
    "Placement Experiences",
    "Coding Resources",
    "Hostel Reviews",
    "Faculty Reviews",
    "Career Advice",
    "Others"
  ];

  try {
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'A valid category is required'
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { category },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        post: updatedPost
      },
      message: 'Post category updated successfully'
    });
  } catch (error) {
    console.error('Change Category Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error updating post category'
    });
  }
};

// @desc    Get dashboard analytics metrics
// @route   GET /api/admin/analytics
// @access  Admin Only
export const getAnalytics = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();
    const flaggedCount = await Post.countDocuments({ moderationStatus: 'flagged' });

    // Aggregate category counts
    const categoryBreakdownAgg = await Post.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const VALID_CATEGORIES = [
      "Semester Exam Tips",
      "Placement Experiences",
      "Coding Resources",
      "Hostel Reviews",
      "Faculty Reviews",
      "Career Advice",
      "Others"
    ];

    const categoryBreakdown = VALID_CATEGORIES.map(cat => {
      const found = categoryBreakdownAgg.find(c => c._id === cat);
      return {
        category: cat,
        count: found ? found.count : 0
      };
    }).sort((a, b) => b.count - a.count);

    // Top Category string
    const topCategory = categoryBreakdown[0].count > 0 ? categoryBreakdown[0].category : 'None';

    // Fetch top 3 upvoted posts
    const topPosts = await Post.find({ moderationStatus: 'approved' })
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(3)
      .select('content category upvotes authorName');

    // Fetch top 3 contributors
    const topContributors = await Post.aggregate([
      { $match: { moderationStatus: 'approved' } },
      { $group: { _id: '$authorName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, authorName: '$_id', count: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        totalUsers,
        flaggedCount,
        topCategory,
        categoryBreakdown,
        topPosts,
        topContributors
      }
    });
  } catch (error) {
    console.error('Get Analytics Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving analytics metrics'
    });
  }
};
