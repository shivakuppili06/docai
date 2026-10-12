import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FileText, MessageSquare, Trash2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Document } from '@/types';

export interface DocumentRowProps {
  doc: Document;
  onDeleteClick?: (doc: Document) => void;
  isCompact?: boolean;
}

export const DocumentRow = React.memo(({ doc, onDeleteClick, isCompact = false }: DocumentRowProps) => {
  const navigate = useNavigate();

  if (isCompact) {
    return (
      <div 
        data-testid="document-row"
        onClick={() => navigate({ to: '/documents/$documentId', params: { documentId: doc.id.toString() } })}
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
      data-testid="document-row"
      onClick={() => navigate({ to: '/documents/$documentId', params: { documentId: doc.id.toString() } })}
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
              onClick={(e) => { e.stopPropagation(); navigate({ to: '/chat/$documentId', params: { documentId: doc.id.toString() } }); }}
              title="Ask questions"
              aria-label="Ask questions"
              data-testid="chat-document-btn"
            >
              <MessageSquare size={18} />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            style={{ color: 'var(--color-danger)' }}
            onClick={(e) => { e.stopPropagation(); onDeleteClick && onDeleteClick(doc); }}
            title="Delete document"
            aria-label="Delete document"
            data-testid="delete-document-btn"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </td>
    </tr>
  );
});
