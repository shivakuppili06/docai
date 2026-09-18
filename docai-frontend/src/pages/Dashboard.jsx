import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { UploadCloud, FileText, ArrowRight, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const res = await documentApi.list();
      setDocuments(res.data);
    } catch (err) {
      toast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    // Auto refresh while there are pending/processing docs
    const interval = setInterval(() => {
      setDocuments(current => {
        const hasProcessing = current.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
        if (hasProcessing) fetchDocuments();
        return current;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      await documentApi.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      toast('Document uploaded successfully. Indexing started.', 'success');
      setUploadModalOpen(false);
      setFile(null);
      fetchDocuments();
    } catch (err) {
      toast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalCount = documents.length;
  const indexedCount = documents.filter(d => d.status === 'INDEXED').length;
  const processingCount = documents.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING').length;
  const recentDocs = documents.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Welcome back. Here is an overview of your documents.</p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)} className="flex items-center gap-2">
          <UploadCloud size={18} /> Upload Document
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Documents</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--color-primary)' }}>
            {loading ? <Skeleton width="60px" height="40px" /> : totalCount}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Indexed Ready</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--color-success)' }}>
            {loading ? <Skeleton width="60px" height="40px" /> : indexedCount}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Processing</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--color-warning)' }}>
            {loading ? <Skeleton width="60px" height="40px" /> : processingCount}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Documents</h2>
          <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} height="60px" />)}
          </div>
        ) : recentDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: '500', marginBottom: '1rem' }}>No documents uploaded yet</p>
            <Button onClick={() => setUploadModalOpen(true)}>Upload your first document</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentDocs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => navigate(`/documents/${doc.id}`)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '1rem', border: 'var(--border-thin)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', transition: 'background-color var(--transition-fast)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '600' }}>{doc.fileName}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge status={doc.status}>{doc.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={uploadModalOpen} onClose={() => { if (!uploading) setUploadModalOpen(false); }} title="Upload Document">
        {!uploading ? (
          <form onSubmit={handleUpload}>
            <div 
              style={{ 
                border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '3rem', 
                textAlign: 'center', backgroundColor: 'var(--color-bg)', marginBottom: '1.5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}
            >
              <UploadCloud size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontWeight: '500', marginBottom: '1rem' }}>Drag & drop your PDF here or click to browse</p>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
                style={{ display: 'block', margin: '0 auto', cursor: 'pointer' }}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!file}>Upload File</Button>
            </div>
          </form>
        ) : uploadProgress < 100 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Uploading...</h3>
            <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.2s' }} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>{uploadProgress}% completed</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)', marginBottom: '1.5rem', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Processing & Indexing...</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>This may take a few moments. You can close this window.</p>
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
