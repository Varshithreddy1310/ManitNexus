import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, BookOpen, Clock, CheckCircle, AlertTriangle,
  Hourglass, TrendingUp, MessageSquare, ChevronUp, ChevronDown,
  PenSquare, Sparkles, Trophy, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyPosts } from '../services/postService';
import { formatRelativeTime } from '../utils/timeUtils';
import RoleBadge from '../components/RoleBadge';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  approved: { label: 'Approved', color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)', Icon: CheckCircle },
  pending: { label: 'Pending Review', color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)', Icon: Hourglass },
  flagged: { label: 'Flagged', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)', Icon: AlertTriangle },
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'flagged'
  const [expandedPost, setExpandedPost] = useState(null);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        const res = await getMyPosts();
        if (res.success) {
          setPosts(res.data.posts || []);
        }
      } catch (err) {
        toast.error('Failed to load your posts');
      } finally {
        setLoading(false);
      }
    };
    fetchMyPosts();
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.moderationStatus === filter);

  const stats = {
    total: posts.length,
    approved: posts.filter(p => p.moderationStatus === 'approved').length,
    pending: posts.filter(p => p.moderationStatus === 'pending').length,
    flagged: posts.filter(p => p.moderationStatus === 'flagged').length,
    totalUpvotes: posts.reduce((s, p) => s + (p.upvotes || 0), 0),
  };

  const ROLE_LABEL = {
    student: 'Student',
    alumni: 'Alumni',
    admin: 'Administrator',
  };

  return (
    <div className="profile-page">
      {/* Hero Header */}
      <motion.div
        className="profile-hero ui-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="profile-avatar-ring">
          <div className="profile-avatar">
            <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h1>{user?.name}</h1>
            <RoleBadge role={user?.role} />
          </div>
          <div className="profile-meta-row">
            <span className="profile-meta-item">
              <Mail size={14} />
              {user?.email}
            </span>
            <span className="profile-meta-item">
              <BookOpen size={14} />
              {ROLE_LABEL[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <Link to="/post/new" className="btn btn-primary profile-cta">
          <PenSquare size={16} />
          Create Post
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="profile-stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {[
          { label: 'Total Posts', value: stats.total, icon: FileText, color: 'var(--accent-blue)' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'var(--accent-green)' },
          { label: 'Pending', value: stats.pending, icon: Hourglass, color: 'var(--accent-amber)' },
          { label: 'Total Upvotes', value: stats.totalUpvotes, icon: TrendingUp, color: 'var(--accent-purple)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="profile-stat-card ui-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <div className="profile-stat-icon" style={{ color: stat.color, background: `${stat.color}18` }}>
              <stat.icon size={20} />
            </div>
            <div className="profile-stat-info">
              <span className="profile-stat-value">{stat.value}</span>
              <span className="profile-stat-label">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Posts Section */}
      <motion.div
        className="profile-posts-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="profile-posts-header">
          <h2><Sparkles size={20} /> My Posts</h2>
          <div className="profile-filter-tabs">
            {['all', 'approved', 'pending', 'flagged'].map(f => (
              <button
                key={f}
                className={`profile-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && (
                  <span className="profile-filter-count">{stats[f] ?? 0}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="profile-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="profile-skeleton ui-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="profile-empty ui-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Trophy size={48} />
            <h3>No posts yet</h3>
            <p>
              {filter === 'all'
                ? "You haven't created any posts yet. Share your knowledge with the community!"
                : `No ${filter} posts found.`}
            </p>
            {filter === 'all' && (
              <Link to="/post/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Create Your First Post
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="profile-posts-list">
            <AnimatePresence>
              {filtered.map((post, idx) => {
                const statusCfg = STATUS_CONFIG[post.moderationStatus] || STATUS_CONFIG.pending;
                const isExpanded = expandedPost === post._id;
                const isTruncated = post.content?.length > 250;

                return (
                  <motion.div
                    key={post._id}
                    className="profile-post-card ui-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ delay: idx * 0.04 }}
                    layout
                  >
                    {/* Status Badge */}
                    <div
                      className="profile-post-status"
                      style={{ color: statusCfg.color, background: statusCfg.bg }}
                    >
                      <statusCfg.Icon size={13} />
                      {statusCfg.label}
                    </div>

                    {/* Category */}
                    {post.category && (
                      <span className="profile-post-category">{post.category}</span>
                    )}

                    {/* Content */}
                    <p className="profile-post-content">
                      {isTruncated && !isExpanded
                        ? post.content.substring(0, 250) + '...'
                        : post.content}
                    </p>
                    {isTruncated && (
                      <button
                        className="profile-post-expand"
                        onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                      >
                        {isExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                      </button>
                    )}

                    {/* Footer */}
                    <div className="profile-post-footer">
                      <div className="profile-post-stats">
                        <span title="Upvotes"><ChevronUp size={15} /> {post.upvotes || 0}</span>
                        <span title="Downvotes"><ChevronDown size={15} /> {post.downvotes || 0}</span>
                      </div>
                      <div className="profile-post-time">
                        <Clock size={13} />
                        {formatRelativeTime(post.createdAt)}
                      </div>
                    </div>

                    {/* Flagged reason */}
                    {post.moderationStatus === 'flagged' && post.moderationReason && (
                      <div className="profile-post-flag-reason">
                        <AlertTriangle size={13} />
                        <span>{post.moderationReason}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <style>{`
        .profile-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        /* Hero */
        .profile-hero {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          flex-wrap: wrap;
        }

        .profile-avatar-ring {
          flex-shrink: 0;
          padding: 3px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
        }

        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent-purple);
          border: 3px solid var(--bg-primary);
        }

        .profile-info {
          flex: 1;
          min-width: 200px;
        }

        .profile-name-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.5rem;
        }

        .profile-name-row h1 {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .profile-meta-row {
          display: flex;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .profile-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }

        .profile-cta {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
        }

        /* Stats Grid */
        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .profile-stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
        }

        .profile-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .profile-stat-label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* Posts Section */
        .profile-posts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .profile-posts-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .profile-filter-tabs {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .profile-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .profile-filter-btn:hover {
          color: var(--text-primary);
          border-color: rgba(139, 92, 246, 0.3);
        }

        .profile-filter-btn.active {
          color: var(--accent-purple);
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.35);
          font-weight: 600;
        }

        .profile-filter-count {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 0.1rem 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Skeleton */
        .profile-loading {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .profile-skeleton {
          height: 130px;
          border-radius: 16px;
          background: var(--bg-surface);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Empty */
        .profile-empty {
          text-align: center;
          padding: 3.5rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
        }

        .profile-empty h3 {
          font-size: 1.2rem;
          color: var(--text-primary);
          margin: 0;
        }

        .profile-empty p { margin: 0; font-size: 0.95rem; }

        /* Post Cards */
        .profile-posts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .profile-post-card {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding: 1.4rem 1.6rem;
        }

        .profile-post-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.77rem;
          font-weight: 600;
          padding: 0.25rem 0.7rem;
          border-radius: 20px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .profile-post-category {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 0.2rem 0.65rem;
          border-radius: 8px;
          width: fit-content;
        }

        .profile-post-content {
          color: var(--text-primary);
          font-size: 0.95rem;
          line-height: 1.65;
          margin: 0;
          white-space: pre-wrap;
        }

        .profile-post-expand {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--accent-purple);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          transition: opacity var(--transition-fast);
        }

        .profile-post-expand:hover { opacity: 0.75; }

        .profile-post-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-default);
          margin-top: 0.25rem;
        }

        .profile-post-stats {
          display: flex;
          gap: 1rem;
        }

        .profile-post-stats span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .profile-post-time {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .profile-post-flag-reason {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          font-size: 0.82rem;
          color: var(--accent-red);
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          margin-top: 0.25rem;
        }

        @media (max-width: 600px) {
          .profile-page { padding: 1rem; }
          .profile-hero { flex-direction: column; text-align: center; }
          .profile-name-row { justify-content: center; }
          .profile-meta-row { justify-content: center; }
          .profile-cta { width: 100%; justify-content: center; }
          .profile-posts-header { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
