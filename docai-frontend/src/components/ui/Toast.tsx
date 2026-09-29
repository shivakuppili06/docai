import React, { createContext, useContext, ReactNode } from 'react';
import { toast as sonnerToast, Toaster } from 'sonner';

export interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'success') {
      sonnerToast.success(message);
    } else if (type === 'error') {
      sonnerToast.error(message);
    } else {
      sonnerToast.info(message);
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster position="bottom-right" richColors />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
