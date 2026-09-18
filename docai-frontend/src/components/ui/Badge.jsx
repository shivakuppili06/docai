import React from 'react';

export const Badge = ({ children, status = 'default' }) => {
  const styles = {
    padding: '0.25rem 0.625rem',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'inline-block',
  };

  const statusStyles = {
    INDEXED: { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
    PROCESSING: { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
    FAILED: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' },
    PENDING: { backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info-text)' },
    default: { backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: 'var(--border-thin)' }
  };

  const style = {
    ...styles,
    ...(statusStyles[status] || statusStyles.default)
  };

  return <span style={style}>{children}</span>;
};
