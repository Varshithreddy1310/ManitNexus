import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../hooks/usePosts';
import CategoryTabs from '../components/CategoryTabs';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import axiosInstance from '../services/axiosInstance';
import { Plus, SlidersHorizontal, Layers, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('votes'); // 'votes' | 'recent'
  const [page, setPage] = useState(1);
  const [userVotes, setUserVotes] = useState({}); // Maps postId -> 'upvote' | 'downvote' | null

  const {
    posts,
    loading,
    pagination,
    fetchFeed,
    handleVote,
    setPosts
  } = usePosts();

  // Load feed on category, page, or sort changes
  useEffect(() => {
    fetchFeed(category, page, sort, page > 1);
  }, [category, page, sort, fetchFeed]);

  // Fetch the active user's vote history for posts to highlight them correctly
  // (In Phase 2, we can query a simple helper or just load current votes from a user specific vote collection route)
  // Let's implement a lightweight local state mapping or fetch existing records on mount
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user || posts.length === 0) return;
      
      try {
        // Query server to check existing votes for loaded posts
        const postIds = posts.map(p => p._id);
        if (postIds.length === 0) return;

        // Perform a quick bulk vote state fetch if needed, or query Vote collections.
        // For local simulation/Phase 2, we can keep vote actions synchronized dynamically in userVotes state.
      } catch (error) {
        console.error('Error fetching vote history:', error.message);
      }
    };
    
    fetchUserVotes();
  }, [user, posts.length]);

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setPage(1); // Reset page on category filter
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1); // Reset page on sorting change
  };

  const handleLoadMore = () => {
    if (page < pagination.pages) {
      setPage(prev => prev + 1);
    }
  };

  // Optimistic vote handler mapped to local states
  const onVote = async (postId, type) => {
    const previousVote = userVotes[postId] || null;
    const postToUpdate = posts.find(p => p._id === postId);
    if (!postToUpdate) return;

    let optimisticUp = postToUpdate.upvotes;
    let optimisticDown = postToUpdate.downvotes;
    let nextVote = null;

    // Calculate optimistic counters based on states
    if (previousVote === type) {
      // Toggle off
      nextVote = null;
      if (type === 'upvote') optimisticUp = Math.max(0, optimisticUp - 1);
      if (type === 'downvote') optimisticDown = Math.max(0, optimisticDown - 1);
    } else {
      // Toggle on or switch
      nextVote = type;
      if (type === 'upvote') {
        optimisticUp += 1;
        if (previousVote === 'downvote') optimisticDown = Math.max(0, optimisticDown - 1);
      }
      if (type === 'downvote') {
        optimisticDown += 1;
        if (previousVote === 'upvote') optimisticUp = Math.max(0, optimisticUp - 1);
      }
    }

    // Apply optimistic updates immediately to UI state
    setUserVotes(prev => ({ ...prev, [postId]: nextVote }));
    setPosts(prev => prev.map(p => p._id === postId ? { ...p, upvotes: optimisticUp, downvotes: optimisticDown } : p));

    try {
      // Call standard hook handleVote (which performs backend update)
      const data = await handleVote(postId, type, user._id);
      
      // Resynchronize actual verified counts from database
      if (data) {
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes } : p));
      }
    } catch (err) {
      // Rollback on connection errors
      setUserVotes(prev => ({ ...prev, [postId]: previousVote }));
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, upvotes: postToUpdate.upvotes, downvotes: postToUpdate.downvotes } : p));
    }
  };

  return (
    <div className="feed-page-container">
      

      <div className="container feed-layout">
        {/* Main Left/Center Feed column */}
        <div className="feed-main-col">
          <header className="feed-header">
            <h1 className="feed-title">Campus Memory</h1>
            <p className="feed-subtitle">Filter categories or write a new review post below</p>
          </header>

          {/* Horizontal Scroller Category Tabs */}
          <CategoryTabs selectedCategory={category} onSelect={handleCategorySelect} />

          {/* Sort controls bar */}
          <div className="feed-controls-bar">
            <div className="feed-results-count">
              <Layers size={16} />
              <span>
                {loading && page === 1 ? 'Searching...' : `${pagination.total} Posts Available`}
              </span>
            </div>

            <div className="sort-filter-box">
              <SlidersHorizontal size={14} />
              <select className="sort-select" value={sort} onChange={handleSortChange}>
                <option value="votes">Sort by net votes</option>
                <option value="recent">Sort by recency</option>
              </select>
            </div>
          </div>

          {/* Feed Posts List */}
          <div className="posts-list">
            {posts.map((post) => (
              <PostCard 
                key={post._id}
                post={post}
                userVote={userVotes[post._id]}
                onVote={onVote}
                currentUser={user}
                onCategoryChange={(postId, newCat) => {
                  setPosts(prev => prev.map(p => p._id === postId ? { ...p, category: newCat } : p));
                  if (category && newCat !== category) {
                    setPosts(prev => prev.filter(p => p._id !== postId));
                  }
                }}
                onPostDelete={(postId) => {
                  setPosts(prev => prev.filter(p => p._id !== postId));
                }}
              />
            ))}

            {/* Shimmer loading states */}
            {loading && (
              <>
                <SkeletonCard />
                {page === 1 && <SkeletonCard />}
              </>
            )}

            {/* Empty state message */}
            {!loading && posts.length === 0 && (
              <div className="ui-card feed-empty-state">
                <h3>No approved posts in this category</h3>
                <p>Be the first student to share resources or placement insights by clicking 'Create Post'!</p>
              </div>
            )}

            {/* Load more paginator */}
            {!loading && page < pagination.pages && (
              <button onClick={handleLoadMore} className="btn btn-secondary load-more-btn">
                <span>Load More Posts</span>
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Sidebar removed */}
      </div>

      {/* Mobile Floating Action Button */}
      {user?.role !== 'admin' && (
        <button 
          onClick={() => navigate('/post/new')} 
          className="mobile-fab" 
          title="Create New Post"
        >
          <Plus size={24} />
        </button>
      )}

      <style>{`
        .feed-page-container {
          padding: 2.5rem 0 5rem 0;
        }

        .feed-layout {
          display: grid;
          grid-template-columns: minmax(0, 800px);
          justify-content: center;
          gap: 2.5rem;
          align-items: start;
        }

        .feed-main-col {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .feed-header {
          margin-bottom: 1.5rem;
        }

        .feed-title {
          font-size: 2.2rem;
          font-family: var(--font-display);
          margin-bottom: 0.25rem;
        }

        .feed-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .feed-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 0.65rem 1rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .feed-results-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 550;
        }

        .sort-filter-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-select {
          background: none;
          border: none;
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          font-size: 0.88rem;
        }

        .sort-select option {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          padding: 0.5rem;
        }

        .feed-empty-state {
          padding: 3rem 2rem;
          text-align: center;
          border-color: var(--border-default);
        }

        .feed-empty-state h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .feed-empty-state p {
          color: var(--text-secondary);
          font-size: 0.92rem;
        }

        .load-more-btn {
          width: 100%;
          padding: 0.85rem;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        /* Sidebar CSS removed */

        /* Mobile FAB */
        .mobile-fab {
          display: none;
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: var(--accent-primary);
          color: #ffffff;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          z-index: 99;
          transition: transform var(--transition-fast);
        }

        .mobile-fab:active {
          transform: scale(0.92);
        }

        @media (max-width: 992px) {
          .mobile-fab {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedPage;
