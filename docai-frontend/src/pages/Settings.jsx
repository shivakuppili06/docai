import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="fade-in">
      <div className="dashboard-toolbar">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{ color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-main)' }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'profile' && (
            <div className="settings-card">
              <h2 className="section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Profile Information</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '600'
                }}>
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <button className="btn btn-secondary" disabled>Change Avatar</button>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" defaultValue={user?.fullName || ''} disabled />
              </div>
              
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label">Email Address</label>
                <input type="text" className="form-input" defaultValue={user?.email || ''} disabled />
              </div>
              
              <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Save Changes</button>
                <span className="settings-note">Note: Profile updates require a backend API endpoint which is not yet implemented.</span>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-card">
              <h2 className="section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Preferences</h2>
              <p style={{ color: 'var(--text-muted)' }}>Notification settings and theme preferences will be available here soon.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-card">
              <h2 className="section-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Security</h2>
              
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" disabled placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" disabled placeholder="••••••••" />
              </div>
              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" disabled placeholder="••••••••" />
              </div>
              
              <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Update Password</button>
                <span className="settings-note">Note: Password reset functionality is currently disabled in this environment.</span>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="settings-card danger-zone">
              <h2 className="section-title" style={{ borderBottom: '1px solid #fecaca', paddingBottom: '16px', marginBottom: '24px', color: 'var(--danger)' }}>Danger Zone</h2>
              <div style={{ padding: '24px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <h3 style={{ fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>Delete Account</h3>
                <p style={{ fontSize: '14px', color: '#b91c1c', marginBottom: '24px' }}>
                  Permanently delete your account and all associated documents. This action cannot be undone.
                </p>
                <button className="btn btn-danger" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Delete Account</button>
                <span className="settings-note" style={{ color: '#b91c1c' }}>Note: Account deletion API is pending backend implementation.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
