import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="ui-card skeleton-card-container">
      <div className="skeleton-header">
        <div className="skeleton-avatar shimmer"></div>
        <div className="skeleton-meta">
          <div className="skeleton-title shimmer"></div>
          <div className="skeleton-subtitle shimmer"></div>
        </div>
      </div>
      
      <div className="skeleton-body">
        <div className="skeleton-line shimmer" style={{ width: '100%' }}></div>
        <div className="skeleton-line shimmer" style={{ width: '92%' }}></div>
        <div className="skeleton-line shimmer" style={{ width: '40%', marginTop: '0.5rem' }}></div>
      </div>

      <div className="skeleton-footer">
        <div className="skeleton-btn shimmer"></div>
        <div className="skeleton-btn shimmer" style={{ width: '70px' }}></div>
      </div>

      <style>{`
        .skeleton-card-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          padding: 1.75rem;
          border-radius: 16px;
          pointer-events: none;
        }

        .skeleton-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .skeleton-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
        }

        .skeleton-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }

        .skeleton-title {
          width: 140px;
          height: 14px;
          border-radius: 4px;
        }

        .skeleton-subtitle {
          width: 80px;
          height: 10px;
          border-radius: 4px;
        }

        .skeleton-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .skeleton-line {
          height: 14px;
          border-radius: 4px;
        }

        .skeleton-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-default);
          padding-top: 1rem;
          margin-top: 0.25rem;
        }

        .skeleton-btn {
          width: 90px;
          height: 28px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;
