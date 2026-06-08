import React from 'react';
import { detectLinkType, getLinkDisplayTitle } from '../utils/linkUtils';
import { Youtube, Github, HardDrive, ExternalLink } from 'lucide-react';

const LinkPreview = ({ url }) => {
  if (!url) return null;

  const type = detectLinkType(url);
  const title = getLinkDisplayTitle(url);

  let Icon = ExternalLink;
  let className = 'link-preview-pill ';

  if (type === 'youtube') {
    Icon = Youtube;
    className += 'link-preview-youtube';
  } else if (type === 'github') {
    Icon = Github;
    className += 'link-preview-github';
  } else if (type === 'drive') {
    Icon = HardDrive;
    className += 'link-preview-drive';
  } else {
    className += 'link-preview-other';
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={className}
      onClick={(e) => e.stopPropagation()} // Prevent card click event
    >
      <Icon size={14} className="link-preview-icon" />
      <span className="link-preview-title">{title}</span>
      <style>{`
        .link-preview-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 550;
          border: 1px solid var(--border-default);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .link-preview-icon {
          flex-shrink: 0;
        }

        .link-preview-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .link-preview-pill:hover {
          transform: translateY(-1px);
          color: var(--text-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .link-preview-youtube:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .link-preview-github:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          color: var(--text-primary);
        }

        .link-preview-drive:hover {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .link-preview-other:hover {
          background: var(--bg-surface-hover);
          border-color: var(--border-focused);
          color: var(--accent-purple);
        }
      `}</style>
    </a>
  );
};

export default LinkPreview;
