import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      
      <div ref={modalRef} style={{
        position: 'relative',
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '32rem',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modalIn 0.2s ease-out'
      }}>
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: 'var(--border-thin)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', color: 'var(--color-text-secondary)',
              cursor: 'pointer', padding: '0.25rem', borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
