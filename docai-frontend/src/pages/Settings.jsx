import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Manage your account settings and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                backgroundColor: activeTab === tab.id ? 'var(--color-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: '500', textAlign: 'left', border: 'none',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: 'var(--border-thin)', paddingBottom: '1rem' }}>Profile Information</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  backgroundColor: 'var(--color-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: '600'
                }}>
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <Button variant="secondary" disabled>Change Avatar</Button>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '400px' }}>
                <Input label="Full Name" defaultValue={user?.fullName || ''} disabled />
                <Input label="Email Address" defaultValue={user?.email || ''} disabled />
              </div>
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: 'var(--border-thin)' }}>
                <Button disabled>Save Changes</Button>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                  Profile updates require an API endpoint which is currently under development.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="flex flex-col gap-6">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: 'var(--border-thin)', paddingBottom: '1rem' }}>Preferences</h2>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Notification settings and theme preferences will be available here soon.
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-6">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', borderBottom: 'var(--border-thin)', paddingBottom: '1rem' }}>Security</h2>
              <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '400px' }}>
                <Input label="Current Password" type="password" disabled placeholder="••••••••" />
                <Input label="New Password" type="password" disabled placeholder="••••••••" />
                <Input label="Confirm New Password" type="password" disabled placeholder="••••••••" />
              </div>
              <div>
                <Button disabled>Update Password</Button>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                  Password reset functionality is currently disabled in this environment.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="flex flex-col gap-6">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-danger)', borderBottom: 'var(--border-thin)', paddingBottom: '1rem' }}>Danger Zone</h2>
              <div style={{ padding: '1.5rem', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)' }}>
                <h3 style={{ fontWeight: '600', color: 'var(--color-danger-text)', marginBottom: '0.5rem' }}>Delete Account</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-danger-text)', marginBottom: '1.5rem' }}>
                  Permanently delete your account and all associated documents. This action cannot be undone.
                </p>
                <Button variant="danger" disabled>Delete Account</Button>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-danger-text)', marginTop: '0.75rem', opacity: 0.8 }}>
                  Account deletion API is pending backend implementation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
