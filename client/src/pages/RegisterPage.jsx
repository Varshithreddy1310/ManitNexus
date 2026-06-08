import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, Network, ShieldAlert, Award, GraduationCap } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [detectedRole, setDetectedRole] = useState(null);
  const [detectedBatch, setDetectedBatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  // Real-time roll prefix & role extraction
  useEffect(() => {
    if (!email) {
      setDetectedRole(null);
      setDetectedBatch(null);
      setEmailError('');
      return;
    }

    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setDetectedRole(null);
      setDetectedBatch(null);
      // Wait for blur to show hard format errors, but clear if user matches pattern
      return;
    }

    setEmailError('');
    const prefix = email.split('@')[0];
    const batchYear = parseInt(prefix.substring(0, 2), 10);
    
    if (!isNaN(batchYear)) {
      setDetectedBatch(2000 + batchYear);
      if (batchYear >= 23) {
        setDetectedRole('student');
      } else {
        setDetectedRole('alumni');
      }
    }
  }, [email]);

  const handleEmailBlur = () => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setEmailError('Only MANIT student emails are allowed (e.g., 24112011371@stu.manit.ac.in).');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (val.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
    } else if (!/\d/.test(val)) {
      setPasswordError('Password must include at least one number');
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Re-verify formats
    const emailRegex = /^\d+@stu\.manit\.ac\.in$/;
    if (!emailRegex.test(email)) {
      setEmailError('Only MANIT student emails are allowed.');
      toast.error('Please enter a valid MANIT email');
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setPasswordError('Password must be at least 8 characters and include a number');
      toast.error('Invalid password requirements');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Creating account...');

    try {
      await register(name, email, password);
      toast.dismiss(loadingToast);
      toast.success(`Welcome to Manit Nexus, ${name}!`);
      navigate('/feed');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Registration failed');
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join your classmates & alumni inside Manit Nexus</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-container">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="form-input form-input-has-icon"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

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

            {/* Dynamic Role Display */}
            {detectedRole && (
              <span className="feedback-text feedback-text-success role-preview-notice">
                {detectedRole === 'student' ? (
                  <GraduationCap size={16} />
                ) : (
                  <Award size={16} />
                )}
                <span>
                  You will be registered as:{' '}
                  <strong>
                    {detectedRole === 'student' ? 'Student' : 'Alumnus'} (Batch of {detectedBatch})
                  </strong>
                </span>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input form-input-has-icon ${passwordError ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
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
            {passwordError && (
              <span className="feedback-text feedback-text-error">
                <ShieldAlert size={14} />
                {passwordError}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`btn btn-primary auth-submit-btn ${submitting ? 'btn-disabled' : ''}`}
            disabled={submitting}
          >
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
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

        .role-preview-notice {
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-weight: 500;
          margin-top: 0.75rem;
          display: inline-flex;
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

export default RegisterPage;
