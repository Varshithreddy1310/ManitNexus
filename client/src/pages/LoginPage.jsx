import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Network, ShieldAlert } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/feed');
      }
    }
  }, [user, navigate]);

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid MANIT student email format (e.g. 24112011371@stu.manit.ac.in)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setEmailError('Only MANIT student emails are allowed.');
      toast.error('Please enter a valid MANIT email');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Signing in...');

    try {
      await login(email, password);
      toast.dismiss(loadingToast);
      toast.success('Welcome back!');
      navigate('/feed');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      

      <div className="ui-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Network size={36} className="text-accent" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to retrieve doubt history & share wisdom</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">MANIT Student Email</label>
            <div className="input-container">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className={`form-input form-input-has-icon ${emailError ? 'input-error' : ''}`}
                placeholder="24112011371@stu.manit.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
                disabled={submitting}
              />
            </div>
            {emailError && (
              <span className="feedback-text feedback-text-error">
                <ShieldAlert size={14} />
                {emailError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input form-input-has-icon"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary auth-submit-btn ${submitting ? 'btn-disabled' : ''}`}
            disabled={submitting}
          >
            Sign In
          </button>
        </form>

        <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <span>New to Manit Nexus? </span>
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
          </div>
          <div>
            <Link to="/admin/login" className="auth-link" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Are you an Admin?
            </Link>
          </div>
        </div>
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

        .auth-header {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-logo {
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

        .input-error {
          border-color: var(--accent-red) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.1) !important;
        }

        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .auth-footer {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .auth-link {
          color: var(--accent-purple);
          font-weight: 600;
          transition: color var(--transition-fast);
        }

        .auth-link:hover {
          color: var(--accent-blue);
          text-decoration: underline;
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

export default LoginPage;
