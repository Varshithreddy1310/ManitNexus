import React from 'react';

const SkeletonMessage = () => {
  return (
    <div className="skeleton-message-container">
      <div className="skeleton-message-avatar shimmer"></div>
      <div className="skeleton-message-content">
        <div className="skeleton-message-line shimmer" style={{ width: '80%' }}></div>
        <div className="skeleton-message-line shimmer" style={{ width: '100%' }}></div>
        <div className="skeleton-message-line shimmer" style={{ width: '60%' }}></div>
      </div>

      <style>{`
        .skeleton-message-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          opacity: 0.7;
          pointer-events: none;
        }

        .skeleton-message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .skeleton-message-content {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          flex: 1;
          padding-top: 0.4rem;
        }

        .skeleton-message-line {
          height: 12px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default SkeletonMessage;
