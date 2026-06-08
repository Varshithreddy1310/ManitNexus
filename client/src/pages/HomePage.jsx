import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BrainCircuit, Users, Compass, ShieldCheck } from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="homepage-container">
      

      <header className="hero-section">
        <h1 className="hero-title">
          The Collective Knowledge <br />
          <span className="accent-text">of MANIT</span>
        </h1>
        <p className="hero-subtitle">
          Manit Nexus is an exclusive, AI-powered knowledge sharing network built for students and alumni of MANIT Bhopal. Store placement experiences, hostel guides, course tips, and query them instantly.
        </p>

      </header>

      <section className="features-grid">
        <div className="ui-card feature-card">
          <div className="feature-icon-wrapper blue">
            <Users size={24} />
          </div>
          <h3 className="feature-title">Preserve Alumni Wisdom</h3>
          <p className="feature-desc">
            Keep the experiences of graduating classes alive. Access placement reviews, interview round logs, and advice directly from seniors who cracked tech roles.
          </p>
        </div>

        <div className="ui-card feature-card">
          <div className="feature-icon-wrapper purple">
            <BrainCircuit size={24} />
          </div>
          <h3 className="feature-title">AI Doubt Resolution</h3>
          <p className="feature-desc">
            Juniors stop asking repetitive questions. Our AI references actual student experiences and posts to answer your academic or college life questions instantly.
          </p>
        </div>

        <div className="ui-card feature-card">
          <div className="feature-icon-wrapper green">
            <Compass size={24} />
          </div>
          <h3 className="feature-title">Semantic RAG Search</h3>
          <p className="feature-desc">
            Find relevant stories even when you don't use exact match keywords. Semantic vector index identifies identical experiences in real-time.
          </p>
        </div>
      </section>

      <footer className="compliance-footer">
        <p>This platform is exclusively built for the students and alumni of Maulana Azad National Institute of Technology (MANIT) Bhopal.</p>
      </footer>

      <style>{`
        .homepage-container {
          min-height: calc(100vh - 70px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          position: relative;
        }

        .hero-section {
          text-align: center;
          max-width: 800px;
          margin-bottom: 5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #c084fc;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2rem;
          animation: pulse 2s infinite ease-in-out;
        }

        .hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.2;
          margin-bottom: 1.5rem;
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: -0.03em;
        }

        .accent-text {
          color: var(--accent-primary);
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          max-width: 650px;
          line-height: 1.6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          width: 100%;
          max-width: 1100px;
        }

        .feature-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .feature-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .feature-icon-wrapper.blue {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent-blue);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .feature-icon-wrapper.purple {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .feature-icon-wrapper.green {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-green);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .feature-title {
          font-size: 1.35rem;
          margin-bottom: 0.75rem;
        }

        .feature-desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.97); }
        }

        .compliance-footer {
          margin-top: 4rem;
          padding-top: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          border-top: 1px solid var(--border-default);
          width: 100%;
          max-width: 1100px;
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
