import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Shield, FileText, Users, AlertTriangle,
  Trophy, Check, Trash2, ChevronDown, Loader2, RefreshCw,
  TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import {
  getAnalytics,
  getFlaggedPosts,
  approvePost,
  deletePost,
  changeCategory
} from '../../services/adminService';
import RoleBadge from '../../components/RoleBadge';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Semester Exam Tips',
  'Placement Experiences',
  'Coding Resources',
  'Hostel Reviews',
  'Faculty Reviews',
  'Career Advice',
  'Others'
];

const CHART_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1'
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [categoryDropdownId, setCategoryDropdownId] = useState(null);

  // Fetch analytics on mount and tab switch
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'flagged') {
      fetchFlaggedPosts();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await getAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      setLoadingFlagged(true);
      const response = await getFlaggedPosts();
      if (response.success) {
        setFlaggedPosts(response.data.posts || []);
      }
    } catch (err) {
      toast.error('Failed to load flagged posts');
    } finally {
      setLoadingFlagged(false);
    }
  };

  const handleApprove = async (postId) => {
    setProcessingId(postId);
    try {
      const response = await approvePost(postId);
      if (response.success) {
        setFlaggedPosts(prev => prev.filter(p => p._id !== postId));
        toast.success('Post approved and indexed');
      }
    } catch (err) {
      toast.error('Failed to approve post');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return;
    setProcessingId(postId);
    try {
      const response = await deletePost(postId);
      if (response.success) {
        setFlaggedPosts(prev => prev.filter(p => p._id !== postId));
        toast.success('Post permanently deleted');
      }
    } catch (err) {
      toast.error('Failed to delete post');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCategoryChange = async (postId, newCategory) => {
    setProcessingId(postId);
    setCategoryDropdownId(null);
    try {
      const response = await changeCategory(postId, newCategory);
      if (response.success) {
        setFlaggedPosts(prev =>
          prev.map(p => p._id === postId ? { ...p, category: newCategory } : p)
        );
        toast.success(`Category changed to ${newCategory}`);
      }
    } catch (err) {
      toast.error('Failed to change category');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="admin-chart-tooltip">
          <p className="admin-chart-tooltip-label">{label}</p>
          <p className="admin-chart-tooltip-value">{payload[0].value} posts</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Shield size={20} />
          <h3>Admin Panel</h3>
        </div>
        <nav className="admin-sidebar-nav">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3, show: true },
            { id: 'flagged', label: 'Flagged Posts', icon: AlertTriangle, show: user?.role === 'admin' },
          ].filter(tab => tab.show).map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`admin-tab-${tab.id}`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.id === 'flagged' && flaggedPosts.length > 0 && (
                <span className="admin-badge-count">{flaggedPosts.length}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="admin-section-header">
                <h2><TrendingUp size={24} /> Analytics Overview</h2>
                <button className="btn btn-secondary" onClick={fetchAnalytics} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {loadingAnalytics ? (
                <div className="admin-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Loading analytics...</p>
                </div>
              ) : analytics ? (
                <>
                  {/* Metric Cards */}
                  <div className="admin-metrics-grid">
                    {[
                      { label: 'Total Posts', value: analytics.totalPosts, icon: FileText, color: 'var(--accent-blue)' },
                      { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'var(--accent-green)' },
                      { label: 'Flagged Posts', value: analytics.flaggedCount, icon: AlertTriangle, color: 'var(--accent-red)' },
                      { label: 'Top Category', value: analytics.topCategory, icon: Trophy, color: 'var(--accent-amber)', isText: true },
                    ].map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        className="admin-metric-card ui-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="admin-metric-icon" style={{ color: metric.color, background: `${metric.color}15` }}>
                          <metric.icon size={22} />
                        </div>
                        <div className="admin-metric-info">
                          <span className="admin-metric-label">{metric.label}</span>
                          <span className={`admin-metric-value ${metric.isText ? 'text-value' : ''}`}>
                            {metric.value}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Category Chart */}
                  {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
                    <motion.div 
                      className="admin-chart-container ui-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3>Posts by Category</h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={analytics.categoryBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis 
                            dataKey="category" 
                            tick={{ fill: '#94a3b8', fontSize: 11 }} 
                            angle={-35} 
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {analytics.categoryBreakdown.map((entry, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {/* Top 3 Posts */}
                  {analytics.topPosts && analytics.topPosts.length > 0 && (
                    <motion.div
                      className="admin-top-posts ui-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3><Trophy size={18} /> Top Upvoted Posts</h3>
                      <div className="admin-top-posts-list">
                        {analytics.topPosts.map((post, idx) => (
                          <div key={post._id} className="admin-top-post-item">
                            <span className="admin-top-post-medal" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                            <div className="admin-top-post-content">
                              <p>{post.content?.length > 120 ? post.content.substring(0, 120) + '...' : post.content}</p>
                              <div className="admin-top-post-meta">
                                <span>{post.authorName}</span>
                                <span className="admin-top-post-category">{post.category}</span>
                                <span className="admin-top-post-votes">↑ {post.upvotes}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Top 3 Contributors */}
                  {analytics.topContributors && analytics.topContributors.length > 0 && (
                    <motion.div
                      className="admin-top-posts ui-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      style={{ marginTop: '1.5rem' }}
                    >
                      <h3><Users size={18} /> Top Contributors</h3>
                      <div className="admin-top-posts-list">
                        {analytics.topContributors.map((contributor, idx) => (
                          <div key={idx} className="admin-top-post-item">
                            <span className="admin-top-post-medal" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>#{idx + 1}</span>
                            <div className="admin-top-post-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{contributor.authorName}</span>
                              <span style={{ fontWeight: 600, color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                                {contributor.count} {contributor.count === 1 ? 'post' : 'posts'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="admin-empty">
                  <BarChart3 size={48} />
                  <p>No analytics data available</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'flagged' && (
            <motion.div
              key="flagged"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="admin-section-header">
                <h2><AlertTriangle size={24} /> Flagged Posts Queue</h2>
                <button className="btn btn-secondary" onClick={fetchFlaggedPosts} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {loadingFlagged ? (
                <div className="admin-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Loading flagged posts...</p>
                </div>
              ) : flaggedPosts.length === 0 ? (
                <div className="admin-empty ui-card">
                  <Check size={48} style={{ color: 'var(--accent-green)' }} />
                  <h3>All Clear!</h3>
                  <p>No flagged posts to review right now.</p>
                </div>
              ) : (
                <div className="admin-flagged-table-wrapper">
                  <table className="admin-flagged-table">
                    <thead>
                      <tr>
                        <th>Content</th>
                        <th>Author</th>
                        <th>Role</th>
                        <th>Flag Reason</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedPosts.map((post) => (
                        <motion.tr
                          key={post._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, x: -50 }}
                          layout
                        >
                          <td className="admin-td-content">
                            {post.content?.length > 100 
                              ? post.content.substring(0, 100) + '...' 
                              : post.content}
                          </td>
                          <td>{post.authorName}</td>
                          <td><RoleBadge role={post.authorRole} /></td>
                          <td className="admin-td-reason">
                            {post.moderationReason || 'N/A'}
                          </td>
                          <td>
                            <div className="admin-category-cell" style={{ position: 'relative' }}>
                              <button 
                                className="admin-category-btn"
                                onClick={() => setCategoryDropdownId(
                                  categoryDropdownId === post._id ? null : post._id
                                )}
                              >
                                {post.category || 'Others'}
                                <ChevronDown size={12} />
                              </button>
                              {categoryDropdownId === post._id && (
                                <div className="admin-category-dropdown">
                                  {CATEGORIES.map(cat => (
                                    <button
                                      key={cat}
                                      className={`admin-category-option ${post.category === cat ? 'active' : ''}`}
                                      onClick={() => handleCategoryChange(post._id, cat)}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="admin-td-date">{formatDate(post.createdAt)}</td>
                          <td>
                            <div className="admin-actions">
                              <button
                                className="admin-action-approve"
                                onClick={() => handleApprove(post._id)}
                                disabled={processingId === post._id}
                                title="Approve post"
                              >
                                {processingId === post._id 
                                  ? <Loader2 size={14} className="spin" />
                                  : <Check size={14} />}
                                Approve
                              </button>
                              <button
                                className="admin-action-delete"
                                onClick={() => handleDelete(post._id)}
                                disabled={processingId === post._id}
                                title="Delete post"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;
