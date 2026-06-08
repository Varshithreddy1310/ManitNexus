import { useState, useCallback } from 'react';
import { getPosts, votePost } from '../services/postService';
import toast from 'react-hot-toast';

export const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchFeed = useCallback(async (category = '', page = 1, sort = 'votes', append = false) => {
    setLoading(true);
    try {
      const response = await getPosts(category, page, 10, sort);
      if (response.success && response.data) {
        if (append) {
          setPosts((prev) => {
            // Filter duplicates if any
            const existingIds = new Set(prev.map(p => p._id));
            const newPosts = response.data.posts.filter(p => !existingIds.has(p._id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(response.data.posts);
        }
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Fetch feed error:', error.message);
      toast.error('Failed to load community feed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVote = useCallback(async (postId, voteType, activeUserId) => {
    // 1. Optimistic UI update
    let previousPosts = [];
    setPosts((prev) => {
      previousPosts = [...prev];
      return prev.map((post) => {
        if (post._id !== postId) return post;

        let userVote = null; // We can compute the optimistic vote changes
        // Since vote collections are separate, we don't have userVotes inside post itself.
        // But we can let PostCard manage its own UI vote highlights.
        // Let's just update the local upvotes/downvotes numbers based on previous count.
        // We'll pass the actual vote handler to the parent FeedPage which keeps track of userVotes state map!
        return post;
      });
    });

    try {
      const response = await votePost(postId, voteType);
      if (response.success && response.data) {
        // 2. Commit backend numbers to state
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, upvotes: response.data.upvotes, downvotes: response.data.downvotes }
              : post
          )
        );
        return response.data;
      }
    } catch (error) {
      // 3. Rollback
      setPosts(previousPosts);
      toast.error(error.message || 'Failed to register vote');
      throw error;
    }
  }, []);

  return {
    posts,
    loading,
    pagination,
    fetchFeed,
    handleVote,
    setPosts
  };
};
export default usePosts;
