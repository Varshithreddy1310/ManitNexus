import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Key } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [passkey, setPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { adminLogin, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/feed');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email !== 'admin@stu.manit.ac.in') {
      toast.error('Only authorized admin email is allowed.');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Authenticating admin...');

    try {
      await adminLogin(email, passkey);
      toast.dismiss(loadingToast);
      toast.success('Admin authorization granted');
      navigate('/admin');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Authorization failed. Check passkey.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      

      <div className="ui-card auth-card admin-auth-card">
        <div className="auth-header">
          <ShieldCheck size={40} className="auth-logo admin-logo" />
          <h2 className="auth-title">Administrative Portal</h2>
          <p className="auth-subtitle">Verify passkey credentials to access analytics and moderation systems</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input form-input-has-icon"
                placeholder="admin@stu.manit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Secret Passkey</label>
            <div className="input-container">
              <Key size={18} className="input-icon" />
              <input
                type="password"
                className="form-input form-input-has-icon"
                placeholder="Enter your password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary auth-submit-btn admin-submit-btn ${submitting ? 'btn-disabled' : ''}`}
            disabled={submitting}
          >
            Login
          </button>
        </form>
      </div>

      <style>{`
        .auth-page-container {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
        }

        .auth-card {
          width: 100%;
          max-width: 480px;
          border-radius: 20px;
          padding: 3rem 2.5rem;
          text-align: center;
          box-shadow: var(--glow-subtle);
        }

        .admin-auth-card {
          border-color: rgba(139, 92, 246, 0.2);
        }

        .auth-header {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .admin-logo {
          color: var(--accent-purple);
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4));
          margin-bottom: 1rem;
        }

        .auth-title {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-family: var(--font-display);
        }

        .auth-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .auth-form {
          text-align: left;
          margin-bottom: 1.5rem;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .admin-submit-btn {
          background-color: var(--accent-primary);
          color: #ffffff;
        }

        .admin-submit-btn:hover {
          background-color: var(--accent-primary-hover);
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
