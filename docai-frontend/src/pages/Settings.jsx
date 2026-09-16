import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Settings() {
  useDocumentTitle("Settings");
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("docai_theme");
    setIsDark(savedTheme !== "light");
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
    <div className="fade-in" style={{ maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem' }}>Settings</h1>
      
      <div className="doc-card" style={{ marginBottom: '24px', cursor: 'default' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Profile Information</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Full Name</label>
            <div style={{ padding: '10px 16px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {user?.fullName || "Not provided"}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Email Address</label>
            <div style={{ padding: '10px 16px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="doc-card" style={{ marginBottom: '24px', cursor: 'default' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Preferences</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Theme</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Choose your preferred color mode</span>
          </div>
          <button onClick={toggleTheme} style={{
            background: 'var(--glass-bg)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {isDark ? "Dark Mode" : "Light Mode"}
          </button>
        </div>
      </div>

      <div className="doc-card" style={{ cursor: 'default' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', color: 'var(--danger)' }}>Danger Zone</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Sign Out</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sign out of your account on this device</span>
          </div>
          <button onClick={logout} style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', fontWeight: '500'
          }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
