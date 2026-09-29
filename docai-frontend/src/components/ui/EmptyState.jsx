import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import { Button } from './Button';

/**
 * EmptyState component for lists and tables
 * @param {Object} props
 * @param {string} props.title - The title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} [props.icon] - Icon to display, defaults to FileText
 * @param {string} [props.actionLabel] - Label for the action button
 * @param {Function} [props.onAction] - Action to perform when button is clicked
 */
export const EmptyState = ({ 
  title, 
  description, 
  icon = <FileText size={48} />, 
  actionLabel, 
  onAction 
}) => {
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

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func
};
