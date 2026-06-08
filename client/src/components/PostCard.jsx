import React, { useState, useEffect } from 'react';
import RoleBadge from './RoleBadge';
import LinkPreview from './LinkPreview';
import { formatRelativeTime } from '../utils/timeUtils';
import { ChevronUp, ChevronDown, Share2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { changeCategory, deletePost } from '../services/adminService';

const PostCard = ({ post, userVote, onVote, currentUser, onCategoryChange, onPostDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [localCategory, setLocalCategory] = useState(post.category);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  useEffect(() => {
    setLocalCategory(post.category);
  }, [post.category]);

  const {
    _id,
    authorName,
    authorRole,
    content,
    links,
    upvotes,
    downvotes,
    createdAt
  } = post;

  const isTruncated = content.length > 250;
  const displayText = expanded ? content : isTruncated ? `${content.substring(0, 250)}...` : content;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed#post-${_id}`);
    toast.success('Link copied to clipboard!');
  };

  const handleVoteClick = (type) => {
    if (onVote) {
      onVote(_id, type);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return;
    setDeletingPost(true);
    const loadingToast = toast.loading('Deleting post...');
    try {
      await deletePost(_id);
      toast.dismiss(loadingToast);
      toast.success('Post deleted successfully');
      if (onPostDelete) onPostDelete(_id);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to delete post');
      setDeletingPost(false);
    }
  };

  const handleCategoryChange = async (e) => {
    const newCat = e.target.value;
    setUpdatingCategory(true);
    const loadingToast = toast.loading('Updating category...');
    try {
      await changeCategory(_id, newCat);
      setLocalCategory(newCat);
      toast.dismiss(loadingToast);
      toast.success('Category updated successfully');
      if (onCategoryChange) {
        onCategoryChange(_id, newCat);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to update category');
    } finally {
      setUpdatingCategory(false);
    }
  };

  return (
    <article className="ui-card post-card-container" id={`post-${_id}`}>
      {/* Post Header */}
      <header className="post-header">
        <div className="post-author-info">
          <div className="author-avatar-placeholder">
            {authorName.substring(0, 2).toUpperCase()}
          </div>
          <div className="author-meta">
            <div className="author-name-row">
              <span className="author-name">{authorName}</span>
              <RoleBadge role={authorRole} />
            </div>
            <span className="post-date">{formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        {currentUser && currentUser.role === 'admin' ? (
          <select 
            className="post-category-select" 
            value={localCategory} 
            onChange={handleCategoryChange}
            disabled={updatingCategory}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="Semester Exam Tips">Semester Exam Tips</option>
            <option value="Placement Experiences">Placement Experiences</option>
            <option value="Coding Resources">Coding Resources</option>
            <option value="Hostel Reviews">Hostel Reviews</option>
            <option value="Faculty Reviews">Faculty Reviews</option>
            <option value="Career Advice">Career Advice</option>
            <option value="Others">Others</option>
          </select>
        ) : (
          <span className="post-category-pill">{localCategory}</span>
        )}
      </header>

      {/* Post Body Content */}
      <section className="post-body">
        <p className="post-text">{displayText}</p>
        
        {isTruncated && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="read-more-btn"
          >
            {expanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </section>

      {/* Embedded Link Previews */}
      {links && links.length > 0 && (
        <section className="post-links-section">
          {links.map((link, idx) => (
            <LinkPreview key={idx} url={link} />
          ))}
        </section>
      )}

      {/* Card Footer controls */}
      <footer className="post-footer">
        <div className="vote-panel">
          <button 
            className={`vote-btn vote-btn-up ${userVote === 'upvote' ? 'vote-btn-up-active' : ''}`}
            onClick={() => handleVoteClick('upvote')}
            title="Upvote post"
          >
            <ChevronUp size={20} />
            <span className="vote-count">{upvotes}</span>
          </button>

          <button 
            className={`vote-btn vote-btn-down ${userVote === 'downvote' ? 'vote-btn-down-active' : ''}`}
            onClick={() => handleVoteClick('downvote')}
            title="Downvote post"
          >
            <ChevronDown size={20} />
            <span className="vote-count">{downvotes}</span>
          </button>
        </div>

        <div className="post-footer-right">
          <button onClick={handleShare} className="post-share-btn" title="Share post link">
            <Share2 size={16} />
            <span>Share</span>
          </button>
          {currentUser?.role === 'admin' && (
            <button 
              onClick={handleDeletePost} 
              className="post-delete-btn"
              title="Delete post permanently"
              disabled={deletingPost}
            >
              <Trash2 size={16} />
              <span>{deletingPost ? 'Deleting...' : 'Delete'}</span>
            </button>
          )}
        </div>
      </footer>

      <style>{`
        .post-card-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          padding: 1.75rem;
          border-radius: 16px;
        }

        .post-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .post-author-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .author-avatar-placeholder {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-blue) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(139, 92, 246, 0.15);
        }

        .author-meta {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .author-name-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .author-name {
          font-weight: 650;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .post-date {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .post-category-pill {
          padding: 0.25rem 0.65rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .post-category-select {
          padding: 0.25rem 1.75rem 0.25rem 0.65rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--accent-purple);
          cursor: pointer;
          outline: none;
          transition: all var(--transition-fast);
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 0.8em;
        }
        
        .post-category-select:hover {
          background-color: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.2);
        }

        .post-category-select option {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
        }

        .post-body {
          text-align: left;
        }

        .post-text {
          font-size: 0.98rem;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.6;
        }

        .read-more-btn {
          color: var(--accent-purple);
          font-weight: 600;
          font-size: 0.88rem;
          margin-top: 0.5rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .read-more-btn:hover {
          color: var(--accent-blue);
          text-decoration: underline;
        }

        .post-links-section {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.25rem 0;
        }

        .post-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-default);
          padding-top: 1rem;
          margin-top: 0.25rem;
        }

        .vote-panel {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          padding: 0.2rem;
        }

        .vote-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 650;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .vote-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        .vote-btn-up-active {
          color: var(--accent-blue) !important;
          background: rgba(59, 130, 246, 0.08) !important;
        }

        .vote-btn-down-active {
          color: var(--accent-red) !important;
          background: rgba(239, 68, 68, 0.08) !important;
        }

        .vote-count {
          min-width: 12px;
          text-align: center;
        }

        .post-share-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: 10px;
          border: 1px solid var(--border-default);
          background: rgba(255, 255, 255, 0.01);
          transition: all var(--transition-fast);
        }

        .post-share-btn:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .post-footer-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .post-delete-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--accent-red);
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.05);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .post-delete-btn:hover {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.15);
        }

        .post-delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .post-card-container {
            padding: 1.25rem;
          }
          .post-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .post-category-pill {
            align-self: flex-start;
          }
        }
      `}</style>
    </article>
  );
};

export default PostCard;
