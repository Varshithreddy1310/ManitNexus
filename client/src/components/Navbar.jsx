import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { LogOut, MessageSquare, Compass, Shield, Network, Plus } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <Network className="logo-icon" size={28} />
          <span className="logo-text">
            Manit <span className="logo-accent">Nexus</span>
          </span>
        </Link>

        {user ? (
          <div className="navbar-links-group">
            <Link 
              to="/feed" 
              className={`navbar-link ${isActive('/feed') ? 'navbar-link-active' : ''}`}
            >
              <Compass size={18} />
              <span>Feed</span>
            </Link>

            {user.role !== 'admin' && (
              <>
                <Link 
                  to="/post/new" 
                  className={`navbar-link ${isActive('/post/new') ? 'navbar-link-active' : ''}`}
                >
                  <Plus size={18} />
                  <span>Create Post</span>
                </Link>
                <Link 
                  to="/chat" 
                  className={`navbar-link ${isActive('/chat') ? 'navbar-link-active' : ''}`}
                >
                  <MessageSquare size={18} />
                  <span>Doubt Chat</span>
                </Link>
              </>
            )}

            <Link 
              to="/dashboard" 
              className={`navbar-link ${isActive('/dashboard') ? 'navbar-link-active' : ''}`}
            >
              <Shield size={18} />
              <span>Dashboard</span>
            </Link>

            <div className="navbar-user-profile">
              <Link to="/profile" className={`navbar-avatar-link ${isActive('/profile') ? 'active' : ''}`} title="View Profile">
                <div className="navbar-avatar">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <RoleBadge role={user.role} />
                </div>
              </Link>
              <button onClick={handleLogoutClick} className="navbar-logout-btn" title="Sign Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth-buttons">
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Register
            </Link>
          </div>
        )}
      </div>

      {showLogoutModal && createPortal(
        <div className="logout-modal-overlay">
          <div className="ui-card logout-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="logout-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmLogout}>Log Out</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(12, 12, 20, 0.7);
          border-bottom: 1px solid var(--border-default);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all var(--transition-normal);
        }
        
        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.35rem;
          font-family: 'Space Grotesk', var(--font-display);
          letter-spacing: -0.03em;
        }

        .logo-icon {
          color: var(--accent-primary);
        }

        .logo-accent {
          color: var(--accent-primary);
        }

        .navbar-links-group {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .navbar-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.95rem;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          transition: all var(--transition-fast);
        }

        .navbar-link:hover {
          color: var(--text-primary);
          background: var(--bg-surface);
        }

        .navbar-link-active {
          color: var(--text-primary);
          background-color: var(--bg-surface-hover);
          border: 1px solid var(--border-focused);
        }

        .navbar-user-profile {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          border-left: 1px solid var(--border-default);
          padding-left: 1.25rem;
        }

        .navbar-avatar-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border-radius: 10px;
          padding: 0.25rem 0.5rem;
          transition: background var(--transition-fast);
          text-decoration: none;
        }

        .navbar-avatar-link:hover {
          background: var(--bg-surface);
        }

        .navbar-avatar-link.active .navbar-avatar {
          box-shadow: 0 0 0 2px var(--accent-purple);
        }

        .navbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background-color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
          color: #fff;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .navbar-logout-btn {
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-default);
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 500;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
        }

        .navbar-logout-btn:hover {
          color: var(--accent-red);
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        .navbar-auth-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .navbar-content {
            padding: 0.75rem 1rem;
          }
          
          .navbar-links-group {
            gap: 0.5rem;
          }

          .navbar-link span, 
          .navbar-logout-btn span, 
          .user-name,
          .logo-text {
            display: none;
          }

          .navbar-user-profile {
            border-left: none;
            padding-left: 0.25rem;
            gap: 0.25rem;
          }

          .navbar-logout-btn {
            padding: 0.5rem;
          }

          .user-details {
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .navbar-content {
            padding: 0.5rem 0.5rem;
          }
          
          .navbar-links-group {
            gap: 0.25rem;
          }

          .navbar-link {
            padding: 0.4rem 0.4rem;
          }

          .navbar-user-profile {
            gap: 0.15rem;
          }

          .navbar-logout-btn {
            padding: 0.4rem;
          }
        }

        .logout-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .logout-modal {
          width: 90%;
          max-width: 400px;
          text-align: center;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logout-modal h3 {
          margin-bottom: 0.5rem;
          font-size: 1.25rem;
        }

        .logout-modal p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .logout-modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .logout-modal-actions button {
          flex: 1;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
