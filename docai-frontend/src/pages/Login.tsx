import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setSession } = useAuth();
  const { toast } = useToast() as any;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await authApi.login({ email, password });
      setSession(res.data as any);
      toast('Login successful', 'success');
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
      toast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', height: '48px', backgroundColor: 'var(--color-info-bg)', 
            color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
          }}>
            <LogIn size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              name="password"
              autoComplete="current-password"
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
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', 
              color: 'var(--color-danger-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' 
            }}>
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Sign In
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: '500' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
