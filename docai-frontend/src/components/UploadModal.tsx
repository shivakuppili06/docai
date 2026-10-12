import React, { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AxiosProgressEvent } from 'axios';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress?: (progressEvent: AxiosProgressEvent) => void) => Promise<boolean>;
}

export const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const success = await onUpload(file, (progressEvent: AxiosProgressEvent) => {
      const total = progressEvent.total || 1;
      const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
      setProgress(percentCompleted);
    });

    if (success) {
      setFile(null);
      onClose();
    }
    setUploading(false);
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document">
      {!uploading ? (
        <form onSubmit={handleUpload}>
          <div 
            className="upload-dropzone"
            style={{ 
              border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '40px', 
              textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            <UploadCloud size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
            <p style={{ fontWeight: '500', marginBottom: '16px', color: 'var(--text-main)' }}>Drag & drop your PDF here or click to browse</p>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              style={{ display: 'block', margin: '0 auto', cursor: 'pointer', fontSize: '14px' }}
              required
              aria-label="Upload PDF document"
            />
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!file}>Upload File</Button>
          </div>
        </form>
      ) : progress < 100 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Uploading...</h3>
          <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>{progress}% completed</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)', marginBottom: '24px', animation: 'spin 1s linear infinite' }} />
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Processing & Indexing...</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>This may take a few moments. You can close this window.</p>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </Modal>
  );
};
