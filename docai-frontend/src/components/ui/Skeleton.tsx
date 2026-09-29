import React, { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  borderRadius?: string;
  style?: CSSProperties;
}

export const Skeleton = ({ width, height, className = '', borderRadius = 'var(--radius-md)', style }: SkeletonProps) => {
  const baseStyle: CSSProperties = {
    width: width || '100%',
    height: height || '1rem',
    borderRadius,
    backgroundColor: 'var(--color-border)',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    ...style
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={baseStyle} className={className} />
    </>
  );
};
