import React, { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ 
  title, 
  description, 
  icon = <FileText size={48} />, 
  actionLabel, 
  onAction 
}: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: '500', fontSize: '16px', color: 'var(--color-text-main)' }}>{title}</p>
        <p style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} style={{ marginTop: '16px' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
