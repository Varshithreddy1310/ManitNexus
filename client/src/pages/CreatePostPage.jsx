import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../services/postService';
import { detectLinkType } from '../utils/linkUtils';
import toast from 'react-hot-toast';
import { 
  FileText, Plus, Trash2, ArrowLeft, Send, 
  Youtube, Github, HardDrive, HelpCircle 
} from 'lucide-react';

const CreatePostPage = () => {
  const [content, setContent] = useState('');
  const [links, setLinks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleAddLink = () => {
    if (links.length >= 5) {
      toast.error('You can add a maximum of 5 references');
      return;
    }
    setLinks([...links, '']);
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (val, idx) => {
    const updated = [...links];
    updated[idx] = val;
    setLinks(updated);
  };

  const getLinkIcon = (url) => {
    const type = detectLinkType(url);
    if (type === 'youtube') return <Youtube size={16} style={{ color: '#ef4444' }} />;
    if (type === 'github') return <Github size={16} style={{ color: '#f8fafc' }} />;
    if (type === 'drive') return <HardDrive size={16} style={{ color: '#3b82f6' }} />;
    return <HelpCircle size={16} style={{ color: '#94a3b8' }} />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.trim().length < 20) {
      toast.error('Content must be at least 20 characters');
      return;
    }

    if (content.length > 2000) {
      toast.error('Content cannot exceed 2000 characters');
      return;
    }

    // Clean links
    const activeLinks = links.map(l => l.trim()).filter(l => l !== '');

    setSubmitting(true);
    const loadingToast = toast.loading('Submitting post for moderation...');

    try {
      await createPost(content, activeLinks);
      toast.dismiss(loadingToast);
      toast.success('Post submitted! It will appear on the feed after quick review.');
      navigate('/feed');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-post-container">
      

      <div className="container" style={{ maxWidth: '720px' }}>
        <button onClick={() => navigate('/feed')} className="back-feed-btn">
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </button>

        <div className="ui-card create-post-card">
          <h2 className="create-title">Share Knowledge</h2>
          <p className="create-subtitle">Contribute review guides, interviews, or hostel life advice</p>

          <form onSubmit={handleSubmit} className="create-form">
            {/* Textarea for content */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Content Details</span>
                <span className={`char-counter ${content.length > 2000 ? 'counter-danger' : ''}`}>
                  {content.length} / 2000
                </span>
              </label>
              <textarea
                className="form-input form-textarea"
                rows="8"
                placeholder="Share your detailed thoughts (e.g. preparation tips, experience, hostel room specs). Minimum 20 characters."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={submitting}
              ></textarea>
            </div>

            {/* Links input list */}
            <div className="form-group link-list-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Resource Links (Optional)</span>
                <button 
                  type="button" 
                  onClick={handleAddLink} 
                  className="add-link-btn"
                  disabled={submitting}
                >
                  <Plus size={14} />
                  <span>Add URL</span>
                </button>
              </label>

              {links.map((link, idx) => (
                <div key={idx} className="link-input-row">
                  <div className="link-icon-adornment">
                    {getLinkIcon(link)}
                  </div>
                  <input
                    type="url"
                    className="form-input form-input-has-icon"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="https://github.com/..."
                    value={link}
                    onChange={(e) => handleLinkChange(e.target.value, idx)}
                    disabled={submitting}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveLink(idx)} 
                    className="remove-link-btn"
                    title="Remove Link"
                    disabled={submitting}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary create-submit-btn ${submitting || content.length < 20 || content.length > 2000 ? 'btn-disabled' : ''}`}
              disabled={submitting || content.length < 20 || content.length > 2000}
            >
              <Send size={16} />
              <span>Submit Post</span>
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .create-post-container {
          padding: 3rem 0;
        }

        .back-feed-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          transition: color var(--transition-fast);
        }

        .back-feed-btn:hover {
          color: var(--text-primary);
        }

        .create-post-card {
          padding: 2.5rem;
          text-align: left;
        }

        .create-title {
          font-size: 1.85rem;
          margin-bottom: 0.5rem;
          font-family: var(--font-display);
        }

        .create-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }

        .form-textarea {
          resize: vertical;
          min-height: 150px;
          line-height: 1.6;
        }

        .char-counter {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .counter-danger {
          color: var(--accent-red);
          font-weight: 700;
        }

        .link-list-group {
          background: rgba(0, 0, 0, 0.1);
          border: 1px dashed var(--border-default);
          padding: 1.25rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .add-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--accent-purple);
          transition: color var(--transition-fast);
        }

        .add-link-btn:hover {
          color: var(--accent-blue);
        }

        .link-input-row {
          position: relative;
          display: flex;
          align-items: center;
          margin-top: 0.75rem;
          gap: 0.5rem;
        }

        .link-icon-adornment {
          position: absolute;
          left: 0.85rem;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .remove-link-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-red);
          border-radius: 10px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .remove-link-btn:hover {
          background: var(--accent-red);
          color: #ffffff;
        }

        .create-submit-btn {
          width: 100%;
          padding: 0.85rem;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default CreatePostPage;
