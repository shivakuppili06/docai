import React from 'react';

export const Input = React.forwardRef(({ label, error, className = '', style, ...props }, ref) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    width: '100%',
    ...style
  };

  const inputStyle = {
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'var(--font-family)',
    backgroundColor: '#fff',
    color: 'var(--color-text-dark)',
    transition: 'border-color var(--transition-fast)',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-dark)' }}>{label}</label>}
      <input
        ref={ref}
        style={inputStyle}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
