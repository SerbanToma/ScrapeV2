import React, { useState } from 'react';
import { AuthModal } from './AuthModal';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-brand">
            <img src="/scrapelight.png" alt="Scrapelight" className="nav-logo" />
            <span className="nav-title">Scrapelight</span>
          </div>
          <div className="nav-actions">
            <button 
              className="nav-button secondary" 
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </button>
            <button 
              className="nav-button primary" 
              onClick={() => openAuthModal('register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Find Products with
              <span className="gradient-text"> AI-Powered Search</span>
            </h1>
            <p className="hero-description">
              Upload an image or describe specifications to instantly find matching products 
              from our extensive catalog. Perfect for interior designers, architects, 
              and procurement professionals.
            </p>
            <div className="hero-actions">
              <button 
                className="cta-button primary"
                onClick={() => openAuthModal('register')}
              >
                Start Free Trial
              </button>
              <button 
                className="cta-button secondary"
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">100K+</span>
                <span className="stat-label">Products Indexed</span>
              </div>
              <div className="stat">
                <span className="stat-number">99.5%</span>
                <span className="stat-label">Match Accuracy</span>
              </div>
              <div className="stat">
                <span className="stat-number">&lt;2s</span>
                <span className="stat-label">Search Time</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="demo-card">
              <div className="demo-header">
                <div className="demo-tabs">
                  <div className="demo-tab active">Image Search</div>
                  <div className="demo-tab">Spec Search</div>
                </div>
              </div>
              <div className="demo-content">
                <div className="upload-area">
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">
                    <strong>Drop an image here</strong>
                    <span>or click to browse</span>
                  </div>
                </div>
                <div className="demo-results">
                  <div className="result-item">
                    <div className="result-image"></div>
                    <div className="result-info">
                      <div className="result-title">Modern Pendant Light</div>
                      <div className="result-match">94% Match</div>
                    </div>
                  </div>
                  <div className="result-item">
                    <div className="result-image"></div>
                    <div className="result-info">
                      <div className="result-title">Industrial Ceiling Lamp</div>
                      <div className="result-match">91% Match</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-content">
          <div className="section-header">
            <h2>Why Professionals Choose Scrapelight</h2>
            <p>Advanced AI technology meets intuitive design for faster product discovery</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Visual Search</h3>
              <p>Upload any product image and find exact or similar matches instantly using advanced computer vision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Specification Search</h3>
              <p>Search by dimensions, materials, categories, and technical specifications with natural language.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Get results in under 3 seconds with our optimized AI infrastructure and indexed catalog.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>High Precision</h3>
              <p>99.2% accuracy rate with advanced machine learning models trained on millions of products.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Direct Integration</h3>
              <p>Connect directly to supplier catalogs and get real-time pricing and availability.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Track your searches, save favorites, and analyze procurement patterns over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Product Search?</h2>
          <p>Join thousands of professionals who save hours every week with AI-powered product discovery.</p>
          <button 
            className="cta-button primary large"
            onClick={() => openAuthModal('register')}
          >
            Start Your Free Trial
          </button>
          <div className="cta-note">
            No credit card required • 14-day free trial • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/scrapelight.png" alt="Scrapelight" className="footer-logo" />
            <span className="footer-title">Scrapelight</span>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: var(--navy-900);
          color: var(--sand-200);
        }

        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(14, 43, 58, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(230, 209, 163, 0.1);
          z-index: 100;
          padding: 0 24px;
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-logo {
          height: 36px;
          width: 36px;
          object-fit: contain;
        }

        .nav-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--accent);
        }

        .nav-actions {
          display: flex;
          gap: 12px;
        }

        .nav-button {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1.5px solid;
        }

        .nav-button.secondary {
          background: transparent;
          color: var(--sand-200);
          border-color: rgba(230, 209, 163, 0.3);
        }

        .nav-button.secondary:hover {
          background: rgba(230, 209, 163, 0.1);
          border-color: var(--sand-300);
        }

        .nav-button.primary {
          background: var(--sand-300);
          color: var(--navy-900);
          border-color: var(--sand-300);
        }

        .nav-button.primary:hover {
          background: var(--accent);
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        /* Hero Section */
        .hero {
          padding: 120px 24px 80px;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .hero-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 24px;
          color: var(--sand-200);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--accent), var(--sand-300));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 18px;
          line-height: 1.6;
          margin: 0 0 36px;
          color: var(--sand-300);
          opacity: 0.9;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }

        .cta-button {
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .cta-button.primary {
          background: linear-gradient(135deg, var(--sand-300), var(--accent));
          color: var(--navy-900);
          border-color: var(--sand-300);
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(230, 209, 163, 0.3);
        }

        .cta-button.secondary {
          background: transparent;
          color: var(--sand-200);
          border-color: rgba(230, 209, 163, 0.4);
        }

        .cta-button.secondary:hover {
          background: rgba(230, 209, 163, 0.1);
          border-color: var(--sand-300);
        }

        .cta-button.large {
          padding: 18px 36px;
          font-size: 18px;
        }

        .hero-stats {
          display: flex;
          gap: 32px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 12px;
          color: var(--sand-300);
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Demo Visual */
        .hero-visual {
          display: flex;
          justify-content: center;
        }

        .demo-card {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.6), rgba(18, 52, 68, 0.4));
          border: 1px solid rgba(230, 209, 163, 0.2);
          border-radius: 16px;
          padding: 0;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .demo-header {
          padding: 20px 20px 0;
        }

        .demo-tabs {
          display: flex;
          gap: 4px;
          background: rgba(13, 37, 49, 0.5);
          border-radius: 8px;
          padding: 4px;
        }

        .demo-tab {
          flex: 1;
          padding: 8px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .demo-tab.active {
          background: var(--sand-300);
          color: var(--navy-900);
        }

        .demo-content {
          padding: 20px;
        }

        .upload-area {
          border: 2px dashed rgba(230, 209, 163, 0.3);
          border-radius: 12px;
          padding: 32px 20px;
          text-align: center;
          margin-bottom: 20px;
          background: rgba(13, 37, 49, 0.3);
        }

        .upload-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .upload-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
        }

        .upload-text strong {
          color: var(--sand-200);
        }

        .upload-text span {
          color: var(--sand-300);
          opacity: 0.7;
          font-size: 12px;
        }

        .demo-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .result-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 12px;
          background: rgba(13, 37, 49, 0.4);
          border-radius: 8px;
          border: 1px solid rgba(230, 209, 163, 0.1);
        }

        .result-image {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--sand-400), var(--accent));
          border-radius: 6px;
        }

        .result-info {
          flex: 1;
        }

        .result-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--sand-200);
          margin-bottom: 2px;
        }

        .result-match {
          font-size: 11px;
          color: var(--accent);
          font-weight: 600;
        }

        /* Features Section */
        .features {
          padding: 80px 24px;
          background: rgba(18, 52, 68, 0.3);
        }

        .features-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-header h2 {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 16px;
          color: var(--sand-200);
        }

        .section-header p {
          font-size: 18px;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 32px;
        }

        .feature-card {
          background: linear-gradient(180deg, rgba(18, 52, 68, 0.6), rgba(18, 52, 68, 0.4));
          border: 1px solid rgba(230, 209, 163, 0.15);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(230, 209, 163, 0.3);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 20px;
          display: block;
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--sand-200);
        }

        .feature-card p {
          font-size: 15px;
          line-height: 1.6;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0;
        }

        /* CTA Section */
        .cta-section {
          padding: 80px 24px;
          text-align: center;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta-content h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 16px;
          color: var(--sand-200);
        }

        .cta-content p {
          font-size: 18px;
          color: var(--sand-300);
          opacity: 0.9;
          margin: 0 0 32px;
        }

        .cta-note {
          margin-top: 16px;
          font-size: 14px;
          color: var(--sand-300);
          opacity: 0.7;
        }

        /* Footer */
        .footer {
          border-top: 1px solid rgba(230, 209, 163, 0.15);
          padding: 32px 24px;
          background: rgba(18, 52, 68, 0.5);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-logo {
          height: 28px;
          width: 28px;
          object-fit: contain;
        }

        .footer-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--accent);
        }

        .footer-links {
          display: flex;
          gap: 24px;
        }

        .footer-links a {
          color: var(--sand-300);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--accent);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 40px;
            text-align: center;
          }

          .hero-title {
            font-size: 40px;
          }

          .features-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .nav-content {
            padding: 0 16px;
          }

          .hero {
            padding: 100px 16px 60px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-description {
            font-size: 16px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: center;
          }

          .cta-button {
            width: 100%;
            max-width: 280px;
          }

          .hero-stats {
            justify-content: center;
          }

          .features {
            padding: 60px 16px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .cta-section {
            padding: 60px 16px;
          }

          .footer-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .nav-actions {
            gap: 8px;
          }

          .nav-button {
            padding: 6px 12px;
            font-size: 13px;
          }

          .hero-title {
            font-size: 28px;
          }

          .section-header h2 {
            font-size: 28px;
          }

          .cta-content h2 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
