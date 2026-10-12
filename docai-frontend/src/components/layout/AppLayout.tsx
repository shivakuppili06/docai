import React from 'react';
import { Outlet, Navigate, Link, useLocation } from '@tanstack/react-router';
import { useAuth } from '../../context/AuthContext';
import { FileText, LayoutDashboard, MessageSquare, PieChart, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const Topbar = () => {
  return (
    <header style={{
      backgroundColor: 'var(--color-card, #ffffff)',
      borderBottom: '1px solid var(--color-border, #e2e8f0)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text-dark, #0f172a)' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          backgroundColor: 'var(--color-primary-light, #eef2ff)',
          color: 'var(--color-primary, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <FileText size={18} />
        </div>
        <span>Doc<span style={{ color: 'var(--color-primary, #4f46e5)' }}>AI</span></span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link 
          to="/login" 
          style={{ 
            padding: '0.5rem 1.1rem', 
            fontWeight: '500', 
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #334155)',
            borderRadius: 'var(--radius-sm, 8px)',
            transition: 'all var(--transition-fast)'
          }}
          className="hover:text-slate-900 hover:bg-slate-100"
        >
          Sign In
        </Link>
        <Link 
          to="/register" 
          style={{ 
            padding: '0.5rem 1.25rem', 
            fontWeight: '600', 
            fontSize: '0.875rem',
            backgroundColor: 'var(--color-primary, #4f46e5)', 
            color: '#ffffff', 
            borderRadius: 'var(--radius-sm, 8px)',
            boxShadow: '0 1px 2px 0 rgba(79, 70, 229, 0.2)',
            transition: 'background-color var(--transition-fast)'
          }}
          className="hover:bg-indigo-700"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
};

const Sidebar = ({ isMobileOpen, setMobileOpen }: { isMobileOpen: boolean; setMobileOpen: (open: boolean) => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/documents', icon: FileText, label: 'Documents' },
    { to: '/analytics', icon: PieChart, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const sidebarStyle = {
    width: '260px',
    backgroundColor: 'var(--color-card, #ffffff)',
    borderRight: '1px solid var(--color-border, #e2e8f0)',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0, bottom: 0, left: 0,
    zIndex: 40,
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 30 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside style={{ ...sidebarStyle }} className="sidebar-container">
        <style>{`
          @media (max-width: 768px) {
            .sidebar-container {
              transform: ${isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            }
          }
        `}</style>
        
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            backgroundColor: 'var(--color-primary-light, #eef2ff)',
            color: 'var(--color-primary, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={20} />
          </div>
          <Link to="/dashboard" style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-text-dark, #0f172a)' }}>
            Doc<span style={{ color: 'var(--color-primary, #4f46e5)' }}>AI</span>
          </Link>
        </div>

        <nav style={{ padding: '1.25rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <Link 
                key={to} 
                to={to} 
                onClick={() => setMobileOpen(false)} 
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.65rem 0.875rem', borderRadius: '8px',
                  color: isActive ? 'var(--color-primary, #4f46e5)' : 'var(--color-text-secondary, #334155)',
                  backgroundColor: isActive ? 'var(--color-primary-light, #eef2ff)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.925rem',
                  transition: 'all 0.15s ease',
                  borderLeft: isActive ? '3px solid var(--color-primary, #4f46e5)' : '3px solid transparent'
                }}
                className={!isActive ? 'hover:bg-slate-100 hover:text-slate-900' : ''}
              >
                <Icon size={19} style={{ color: isActive ? 'var(--color-primary, #4f46e5)' : 'inherit' }} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--color-border, #e2e8f0)', backgroundColor: '#fafbfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ 
              width: '38px', height: '38px', borderRadius: '50%', 
              backgroundColor: 'var(--color-primary-light, #eef2ff)', color: 'var(--color-primary, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '600', fontSize: '0.95rem',
              border: '1px solid rgba(79, 70, 229, 0.2)'
            }}>
              {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--color-text-dark, #0f172a)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.fullName || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            data-testid="logout-button"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
              padding: '0.5rem', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff',
              color: 'var(--color-danger, #ef4444)', fontWeight: '500', fontSize: '0.825rem', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="hover:bg-red-50"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const [isMobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) return null;

  // The landing page at "/" renders its own dedicated, full-width SaaS layout with custom navbar and footer
  if (location.pathname === '/') {
    return <Outlet />;
  }

  // Auth pages (/login, /register) or unauthenticated state: show Topbar layout, never dashboard Sidebar
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg, #f8fafc)' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--color-bg, #f8fafc)' }}>
      <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px', width: 'calc(100% - 260px)' }}>
        <style>{`
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0 !important;
              width: 100% !important;
            }
          }
        `}</style>
        
        {/* Mobile Header */}
        <header className="mobile-header" style={{ 
          display: 'none', padding: '1rem 1.25rem', backgroundColor: 'var(--color-card, #ffffff)', 
          borderBottom: '1px solid var(--color-border, #e2e8f0)', alignItems: 'center', gap: '1rem' 
        }}>
          <style>{`
            @media (max-width: 768px) {
              .mobile-header { display: flex !important; }
            }
          `}</style>
          <button 
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--color-text-dark, #0f172a)', cursor: 'pointer' }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-dark, #0f172a)' }}>
            Doc<span style={{ color: 'var(--color-primary, #4f46e5)' }}>AI</span>
          </span>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
