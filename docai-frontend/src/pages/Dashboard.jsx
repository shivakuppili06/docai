import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { UploadCloud, FileText, ArrowRight, Loader2, CheckCircle, Clock } from 'lucide-react';

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
    <div className="fade-in">
      <div className="dashboard-toolbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's an overview of your documents.</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
          <UploadCloud size={18} /> Upload Document
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Documents</span>
            <span className="stat-value">{loading ? '-' : totalCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{color: '#10b981', background: '#dcfce7'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Indexed Ready</span>
            <span className="stat-value">{loading ? '-' : indexedCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{color: '#f59e0b', background: '#fef3c7'}}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Processing</span>
            <span className="stat-value">{loading ? '-' : processingCount}</span>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title" style={{marginBottom: 0}}>Recent Documents</h2>
          <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <div>
              <p style={{ fontWeight: '500', fontSize: '16px', color: 'var(--text-main)' }}>No documents yet</p>
              <p style={{ marginTop: '4px' }}>Upload your first document to start asking questions.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>
              <UploadCloud size={18} /> Upload Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDocs.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => navigate(`/documents/${doc.id}`)}
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
                <span className={`badge ${doc.status.toLowerCase()}`}>
                  {doc.status}
                </span>
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
                onChange={(e) => setFile(e.target.files[0])} 
                style={{ display: 'block', margin: '0 auto', cursor: 'pointer', fontSize: '14px' }}
                required
              />
            </div>
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
              <button type="button" className="btn btn-secondary" onClick={() => setUploadModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!file}>Upload File</button>
            </div>
          </form>
        ) : uploadProgress < 100 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>Uploading...</h3>
            <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '16px' }}>{uploadProgress}% completed</p>
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
    </div>
  );
};

export default Dashboard;
