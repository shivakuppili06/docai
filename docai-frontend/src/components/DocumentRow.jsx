import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export const DocumentRow = ({ doc, onDeleteClick, isCompact = false }) => {
  const navigate = useNavigate();

  if (isCompact) {
    return (
      <div 
        onClick={() => navigate(`/documents/${doc.id}`)}
        className="document-row-compact"
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px',
          cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'var(--card-bg)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'var(--text-muted)' }}>
            <FileText size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: '500', fontSize: '15px', color: 'var(--text-main)', marginBottom: '2px' }}>{doc.fileName}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {new Date(doc.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge status={doc.status}>{doc.status}</Badge>
      </div>
    );
  }

  return (
    <tr 
      onClick={() => navigate(`/documents/${doc.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div className="doc-name-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} className="file-icon-small" />
          <span>{doc.fileName}</span>
        </div>
      </td>
      <td>
        <Badge status={doc.status}>{doc.status}</Badge>
      </td>
      <td style={{ color: 'var(--text-muted)' }}>
        {new Date(doc.uploadedAt).toLocaleString()}
      </td>
      <td>
        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {doc.status === 'INDEXED' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}
              title="Ask questions"
              aria-label="Ask questions"
            >
              <MessageSquare size={18} />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            style={{ color: 'var(--color-danger)' }}
            onClick={(e) => { e.stopPropagation(); onDeleteClick(doc); }}
            title="Delete document"
            aria-label="Delete document"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </td>
    </tr>
  );
};

DocumentRow.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    fileName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    uploadedAt: PropTypes.string.isRequired
  }).isRequired,
  onDeleteClick: PropTypes.func,
  isCompact: PropTypes.bool
};
