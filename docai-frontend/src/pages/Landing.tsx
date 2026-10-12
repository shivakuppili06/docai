import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  MessageSquare, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Send, 
  Bot, 
  Menu, 
  X, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import './Landing.css';

export const Landing = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="landing-page">
      {/* Ambient Canvas Lighting */}
      <div className="landing-canvas-glow" aria-hidden="true" />

      {/* ==========================================================================
          Navigation Bar
          ========================================================================== */}
      <header className="landing-navbar">
        <div className="landing-container">
          <div className="landing-nav-inner">
            {/* Logo */}
            <Link to="/" className="landing-brand" aria-label="DocAI Home">
              <div className="landing-brand-icon">
                <FileText size={20} />
              </div>
              <span className="landing-brand-text">
                Doc<span>AI</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="landing-nav-links" aria-label="Main Navigation">
              <a href="#features" className="landing-nav-link">Features</a>
              <a href="#how-it-works" className="landing-nav-link">How It Works</a>
              <a href="#pricing" className="landing-nav-link">Pricing</a>
            </nav>

            {/* Desktop Auth CTAs */}
            <div className="landing-nav-actions">
              {user ? (
                <Link to="/dashboard" className="landing-btn-primary">
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="landing-btn-ghost">
                    Login
                  </Link>
                  <Link to="/register" className="landing-btn-primary">
                    Get Started <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="landing-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className={`landing-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" className="landing-nav-link" onClick={closeMobileMenu}>Features</a>
            <a href="#how-it-works" className="landing-nav-link" onClick={closeMobileMenu}>How It Works</a>
            <a href="#pricing" className="landing-nav-link" onClick={closeMobileMenu}>Pricing</a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {user ? (
                <Link to="/dashboard" className="landing-btn-primary" onClick={closeMobileMenu}>
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="landing-btn-secondary" onClick={closeMobileMenu}>
                    Login
                  </Link>
                  <Link to="/register" className="landing-btn-primary" onClick={closeMobileMenu}>
                    Get Started <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ==========================================================================
          Hero Section
          ========================================================================== */}
      <main>
        <section className="landing-hero">
          <div className="landing-container">
            <div className="landing-hero-grid">
              {/* Left Column: Headline & CTAs */}
              <div className="landing-hero-content">
                <div className="landing-pill-badge">
                  <Sparkles size={14} />
                  <span>AI-powered document intelligence</span>
                </div>

                <h1 className="landing-hero-title">
                  Unlock the Power of Your{' '}
                  <span className="landing-gradient-text">Documents</span>
                </h1>

                <p className="landing-hero-desc">
                  DocAI helps you analyze documents, ask questions about PDFs, and discover valuable insights with AI-powered document intelligence.
                </p>

                <div className="landing-hero-actions">
                  {user ? (
                    <Link to="/dashboard" className="landing-btn-primary">
                      Go to Dashboard <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <>
                      <Link to="/register" className="landing-btn-primary">
                        Get Started <ArrowRight size={18} />
                      </Link>
                      <Link to="/login" className="landing-btn-secondary">
                        Login
                      </Link>
                    </>
                  )}
                </div>

                <div className="landing-hero-tagline">
                  <span>Your documents. Your questions. Smarter insights.</span>
                </div>

                <div className="landing-trust-pills">
                  <div className="landing-trust-item">
                    <CheckCircle2 size={16} />
                    <span>Instant Citations</span>
                  </div>
                  <div className="landing-trust-item">
                    <ShieldCheck size={16} />
                    <span>Private & Secure</span>
                  </div>
                  <div className="landing-trust-item">
                    <Zap size={16} />
                    <span>Multi-PDF Cross Analysis</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Document Illustration */}
              <div className="landing-illustration-wrap" aria-label="DocAI Interactive Interface Preview">
                <div className="landing-illustration-aura" aria-hidden="true" />

                {/* Floating PDF Document Card */}
                <div className="landing-floating-pdf-card">
                  <div className="landing-pdf-badge">
                    <span>PDF</span>
                  </div>
                  <div className="landing-pdf-meta">
                    <span className="landing-pdf-name">Annual_Financial_Report.pdf</span>
                    <span className="landing-pdf-sub">2.4 MB • 48 Pages • Indexed</span>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#10b981' }}>
                    <Check size={18} />
                  </div>
                </div>

                {/* Main AI Assistant Conversation Panel */}
                <div className="landing-ui-card">
                  {/* Panel Top Bar */}
                  <div className="landing-ui-topbar">
                    <div className="landing-ui-dots">
                      <span className="landing-ui-dot red" />
                      <span className="landing-ui-dot yellow" />
                      <span className="landing-ui-dot green" />
                    </div>
                    <div className="landing-ui-status">
                      <span className="landing-status-indicator" />
                      <span>DocAI RAG Assistant</span>
                    </div>
                  </div>

                  {/* Conversation Body */}
                  <div className="landing-ui-chat-body">
                    {/* User Question */}
                    <div className="landing-msg-user">
                      <div className="landing-bubble-user">
                        What are the key insights from this document?
                      </div>
                      <div className="landing-avatar-user" aria-hidden="true">
                        U
                      </div>
                    </div>

                    {/* AI Assistant Answer */}
                    <div className="landing-msg-ai">
                      <div className="landing-avatar-ai" aria-hidden="true">
                        <Bot size={18} />
                      </div>
                      <div className="landing-bubble-ai">
                        <div className="landing-ai-answer-intro">
                          Here are the primary insights synthesized from the report:
                        </div>
                        <ul className="landing-ai-bullets">
                          <li className="landing-ai-bullet-item">
                            <span className="landing-ai-bullet-bullet">•</span>
                            <span>Annual recurring revenue grew <strong>34% YoY to $4.8M</strong> driven by enterprise adoption.</span>
                          </li>
                          <li className="landing-ai-bullet-item">
                            <span className="landing-ai-bullet-bullet">•</span>
                            <span>Gross margin increased to <strong>78.2%</strong> following automated infrastructure efficiency gains.</span>
                          </li>
                          <li className="landing-ai-bullet-item">
                            <span className="landing-ai-bullet-bullet">•</span>
                            <span>Recommended focus: Accelerate European expansion in Q4.</span>
                          </li>
                        </ul>
                        <div className="landing-citation-pill">
                          <FileText size={12} />
                          <span>Page 4, Section 2.1 — Executive Summary</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated Input Bar */}
                    <div className="landing-ui-input-bar">
                      <div className="landing-ui-input-placeholder">
                        <Search size={15} />
                        <span>Ask anything about this document...</span>
                      </div>
                      <button type="button" className="landing-ui-send-btn" aria-label="Send query">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Metric Badge */}
                <div className="landing-floating-metric-badge">
                  <Sparkles size={16} className="landing-metric-sparkle" />
                  <span>99.4% Retrieval Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Features Section
            ========================================================================== */}
        <section id="features" className="landing-features-sec">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-badge">Core Capabilities</span>
              <h2 className="landing-section-title">Everything you need to work smarter</h2>
              <p className="landing-section-subtitle">Turn static documents into useful, searchable knowledge.</p>
            </div>

            <div className="landing-features-grid">
              {/* Card 1: Smart Document Analysis */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-box landing-icon-blue">
                  <FileText size={26} />
                </div>
                <h3 className="landing-feature-title">Smart Document Analysis</h3>
                <p className="landing-feature-desc">
                  Extract important information and insights from your documents using advanced AI.
                </p>
                <div className="landing-feature-footer">
                  <span>Structured synthesis</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              {/* Card 2: Chat with Your PDFs */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-box landing-icon-purple">
                  <MessageSquare size={26} />
                </div>
                <h3 className="landing-feature-title">Chat with Your PDFs</h3>
                <p className="landing-feature-desc">
                  Ask questions about your documents and get accurate, AI-generated answers instantly.
                </p>
                <div className="landing-feature-footer">
                  <span>Natural conversations</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              {/* Card 3: Intelligent Search */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-box landing-icon-indigo">
                  <Search size={26} />
                </div>
                <h3 className="landing-feature-title">Intelligent Search</h3>
                <p className="landing-feature-desc">
                  Find relevant information across your document collection quickly and easily.
                </p>
                <div className="landing-feature-footer">
                  <span>Semantic vector search</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            How It Works Section
            ========================================================================== */}
        <section id="how-it-works" className="landing-steps-sec">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-badge">Simple Process</span>
              <h2 className="landing-section-title">How It Works</h2>
              <p className="landing-section-subtitle">
                Go from static files to instant answers in three simple steps.
              </p>
            </div>

            <div className="landing-steps-grid">
              <div className="landing-step-card">
                <div className="landing-step-number">01</div>
                <h3 className="landing-step-title">Upload Documents</h3>
                <p className="landing-step-desc">
                  Drop your PDFs, reports, or research papers directly into DocAI. Files are securely encrypted in storage.
                </p>
              </div>

              <div className="landing-step-card">
                <div className="landing-step-number">02</div>
                <h3 className="landing-step-title">Instant Indexing</h3>
                <p className="landing-step-desc">
                  Our asynchronous RAG pipeline chunks, embeds, and indexes your document in high-dimensional vector space.
                </p>
              </div>

              <div className="landing-step-card">
                <div className="landing-step-number">03</div>
                <h3 className="landing-step-title">Ask & Extract Insights</h3>
                <p className="landing-step-desc">
                  Query in natural language to receive verified answers complete with page citations and cross-document comparison.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Pricing Section
            ========================================================================== */}
        <section id="pricing" className="landing-pricing-sec">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-badge">Pricing</span>
              <h2 className="landing-section-title">Transparent, simple pricing</h2>
              <p className="landing-section-subtitle">
                Start free and unlock unlimited intelligence as your library expands.
              </p>
            </div>

            <div className="landing-pricing-grid">
              {/* Starter Plan */}
              <div className="landing-pricing-card">
                <h3 className="landing-plan-name">Free Starter</h3>
                <p className="landing-plan-desc">Perfect for trying out DocAI with personal documents.</p>
                <div className="landing-plan-price">
                  <span className="landing-price-val">$0</span>
                  <span className="landing-price-unit">/ month</span>
                </div>
                <ul className="landing-plan-features">
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Up to 10 document uploads</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>20MB max file size per PDF</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Accurate page citations</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Standard vector search</span>
                  </li>
                </ul>
                <Link to={user ? "/dashboard" : "/register"} className="landing-btn-secondary">
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="landing-pricing-card popular">
                <div className="landing-popular-badge">Most Popular</div>
                <h3 className="landing-plan-name">Pro Team</h3>
                <p className="landing-plan-desc">For professionals and teams requiring deep document analysis.</p>
                <div className="landing-plan-price">
                  <span className="landing-price-val">$19</span>
                  <span className="landing-price-unit">/ month</span>
                </div>
                <ul className="landing-plan-features">
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Unlimited document uploads</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Up to 100MB file size</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Multi-document cross comparison</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Priority GPU RAG pipeline</span>
                  </li>
                  <li className="landing-plan-feat-item">
                    <Check size={18} className="landing-feat-check" />
                    <span>Document sharing with team roles</span>
                  </li>
                </ul>
                <Link to={user ? "/dashboard" : "/register"} className="landing-btn-primary">
                  {user ? "Go to Dashboard" : "Start Pro Trial"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================================
            Bottom CTA Banner
            ========================================================================== */}
        <section className="landing-cta-sec">
          <div className="landing-container">
            <div className="landing-cta-box">
              <div className="landing-cta-aura" aria-hidden="true" />
              <h2 className="landing-cta-title">Ready to transform how you read documents?</h2>
              <p className="landing-cta-desc">
                Stop wasting hours skimming pages. Ask DocAI and extract precise answers in seconds.
              </p>
              <div className="landing-cta-btn-wrap">
                <Link to={user ? "/dashboard" : "/register"} className="landing-btn-primary">
                  {user ? "Go to Dashboard" : "Get Started Now"} <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ==========================================================================
          Footer
          ========================================================================== */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <Link to="/" className="landing-brand">
              <div className="landing-brand-icon">
                <FileText size={18} />
              </div>
              <span className="landing-brand-text">
                Doc<span>AI</span>
              </span>
            </Link>

            <ul className="landing-footer-links">
              <li><a href="#features" className="landing-footer-link">Features</a></li>
              <li><a href="#how-it-works" className="landing-footer-link">How It Works</a></li>
              <li><a href="#pricing" className="landing-footer-link">Pricing</a></li>
              {user ? (
                <li><Link to="/dashboard" className="landing-footer-link">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link to="/login" className="landing-footer-link">Login</Link></li>
                  <li><Link to="/register" className="landing-footer-link">Register</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className="landing-footer-bottom">
            <span>© {new Date().getFullYear()} DocAI. All rights reserved.</span>
            <span>AI-powered Document Intelligence Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
