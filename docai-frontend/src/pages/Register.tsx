import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, setSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [user, navigate]);

  // Basic heuristic
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length > 5) strength += 33;
    if (/[A-Z]/.test(password)) strength += 33;
    if (/[0-9]/.test(password)) strength += 34;
    return strength;
  };

  const strength = getPasswordStrength();
  const strengthColor = strength < 40 ? 'var(--color-danger)' : strength < 80 ? 'var(--color-warning)' : 'var(--color-success)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // register returns a token directly — no second login call needed
      const res = await authApi.register({ email, password, fullName });
      setSession(res.data as any);
      toast('Registration successful!', 'success');
      navigate({ to: '/dashboard', replace: true });
      window.location.hash = '#/dashboard';
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      setError(serverMsg || 'Failed to register');
      toast(serverMsg || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: '80vh', padding: '2rem 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', height: '48px', backgroundColor: 'var(--color-info-bg)', 
            color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
          }}>
            <UserPlus size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Create an account</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Join DocAI today</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            label="Full Name" 
            name="name"
            autoComplete="name"
            value={fullName} 
            onChange={(e: any) => setFullName(e.target.value)} 
            required 
            placeholder="John Doe"
          />

          <Input 
            label="Email" 
            type="email" 
            name="email"
            autoComplete="email"
            value={email} 
            onChange={(e: any) => setEmail(e.target.value)} 
            required 
            placeholder="you@example.com"
          />
          
          <div style={{ position: 'relative' }}>
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e: any) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '0.75rem', top: '2.1rem',
                background: 'none', border: 'none', color: 'var(--color-text-secondary)'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                  <span>Password strength</span>
                  <span style={{ color: strengthColor, fontWeight: '500' }}>
                    {strength < 40 ? 'Weak' : strength < 80 ? 'Fair' : 'Strong'}
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${strength}%`, height: '100%', backgroundColor: strengthColor, transition: 'all 0.3s' }} />
                </div>
              </div>
            )}
          </div>

          <Input 
            label="Confirm Password" 
            type={showPassword ? 'text' : 'password'} 
            value={confirmPassword} 
            onChange={(e: any) => setConfirmPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />

          {error && (
            <div style={{ 
              padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', 
              color: 'var(--color-danger-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' 
            }}>
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Sign Up
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '500' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
