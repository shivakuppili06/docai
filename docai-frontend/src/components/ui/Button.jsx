import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading, 
  disabled, 
  ...props 
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-fast)',
    border: 'none',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-dark)',
      border: 'var(--border-thin)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#fff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    }
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' },
  };

  const style = {
    ...baseStyle,
    ...variants[variant],
    ...sizes[size],
    ...(isLoading || disabled ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
  };

  return (
    <button style={style} disabled={disabled || isLoading} className={className} {...props}>
      {isLoading ? '...' : children}
    </button>
  );
};
