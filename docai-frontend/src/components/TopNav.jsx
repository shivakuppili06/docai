import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function TopNav({ onMenuClick }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("docai_theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("docai_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("docai_theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-btn mobile-menu-btn" onClick={onMenuClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="topnav-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Search everywhere..." />
        </div>
      </div>
      <div className="topnav-actions">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="4.22" x2="19.78" y2="5.64"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
        <button className="icon-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border-color)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', display: 'none' }} className="user-name-desktop">{user?.fullName || user?.email}</span>
        </div>
      </div>
    </header>
  );
}
