import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const Landing = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
        Unlock the Power of Your Documents
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', maxWidth: '600px', marginBottom: '3rem' }}>
        DocAI allows you to instantly extract insights, chat with your PDFs, and index vast amounts of data using state-of-the-art AI.
      </p>
      
      <div className="flex gap-4">
        {user ? (
          <Link to="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link to="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Login</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
