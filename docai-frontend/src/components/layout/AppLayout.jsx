import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileText, LayoutDashboard, MessageSquare, PieChart, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const Topbar = () => {
  return (
    <header style={{
      backgroundColor: 'var(--color-card)', borderBottom: 'var(--border-thin)',
      padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
        DocAI
      </Link>
      <div className="flex gap-4">
        <Link to="/login" style={{ padding: '0.5rem 1rem', fontWeight: '500' }}>Login</Link>
        <Link to="/register" style={{ 
          padding: '0.5rem 1rem', fontWeight: '500', 
          backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)' 
        }}>Sign Up</Link>
      </div>
    </header>
  );
};

const Sidebar = ({ isMobileOpen, setMobileOpen }) => {
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
    backgroundColor: 'var(--color-card)',
    borderRight: 'var(--border-thin)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0, bottom: 0, left: 0,
    zIndex: 40,
    transition: 'transform 0.3s ease',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 30 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside style={{ ...sidebarStyle, transform: isMobileOpen ? 'translateX(0)' : 'translateX(0)' }} className="sidebar-container">
        <style>{`
          @media (max-width: 768px) {
            .sidebar-container {
              transform: ${isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            }
          }
        `}</style>
        
        <div style={{ padding: '1.5rem', borderBottom: 'var(--border-thin)' }}>
          <Link to="/dashboard" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            DocAI
          </Link>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-info-bg)' : 'transparent',
                fontWeight: isActive ? '600' : '500',
              }}>
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: 'var(--border-thin)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: 'var(--radius-full)', 
              backgroundColor: 'var(--color-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '600', fontSize: '1.125rem'
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-text-dark)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.fullName || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
              padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent',
              color: 'var(--color-danger)', fontWeight: '500', cursor: 'pointer'
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export const AppLayout = () => {
  const { user, loading } = useAuth();
  const [isMobileOpen, setMobileOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
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
          display: 'none', padding: '1rem', backgroundColor: 'var(--color-card)', 
          borderBottom: 'var(--border-thin)', alignItems: 'center', gap: '1rem' 
        }}>
          <style>{`
            @media (max-width: 768px) {
              .mobile-header { display: flex !important; }
            }
          `}</style>
          <button 
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', padding: '0.25rem', color: 'var(--color-text-dark)' }}
          >
            <Menu size={24} />
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>DocAI</span>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
