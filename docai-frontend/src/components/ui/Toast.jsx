import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: t.type === 'error' ? 'var(--color-danger)' : t.type === 'success' ? 'var(--color-success)' : 'var(--color-primary)',
            color: '#fff',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.875rem',
            fontWeight: '500',
            animation: 'slideIn 0.2s ease-out'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
