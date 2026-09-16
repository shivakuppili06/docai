import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  const pollRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchDocuments = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await documentApi.list();
      setDocuments(data);
    } catch {
      // Suppress polling errors
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
    pollRef.current = setInterval(() => fetchDocuments(false), 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await documentApi.upload(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      toast.success("Document uploaded successfully!");
      await fetchDocuments();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this document? Chat history will be lost.")) return;
    
    try {
      await documentApi.delete(id);
      toast.success("Document deleted");
      fetchDocuments();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleFileChange = (e) => {
    handleUpload(e.target.files[0]);
    e.target.value = "";
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === "processing" || s === "pending") {
      return (
        <span className={`badge ${s}`}>
          <span className="spinner-mini"></span> {status}
        </span>
      );
    }
    return <span className={`badge ${s}`}>{status}</span>;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "ALL" || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalDocs = documents.length;
  const indexedDocs = documents.filter(d => d.status === "INDEXED").length;
  const processingDocs = documents.filter(d => d.status === "PROCESSING" || d.status === "PENDING").length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '700' }}>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Documents" 
          value={totalDocs} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} 
        />
        <StatCard 
          label="Indexed & Ready" 
          value={indexedDocs} 
          color="var(--status-indexed)"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>} 
        />
        <StatCard 
          label="Processing" 
          value={processingDocs} 
          color="var(--status-processing)"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>} 
        />
      </div>

      <label 
        className={`upload-label ${uploading ? 'disabled' : ''} ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {uploading ? (
          <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <p style={{ marginBottom: '12px' }}>Uploading & Processing... {uploadProgress}%</p>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', width: `${uploadProgress}%`, transition: 'width 0.3s' }}></div>
            </div>
          </div>
        ) : (
          <div className="upload-prompt">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>Click to upload or drag and drop</div>
            <span style={{ fontSize: '0.85rem' }}>PDF or TXT up to 10MB</span>
          </div>
        )}
        <input type="file" accept=".pdf,.txt" onChange={handleFileChange} disabled={uploading} hidden />
      </label>

      <div className="dashboard-toolbar">
        <div className="filter-group">
          {['ALL', 'INDEXED', 'FAILED'].map(status => (
            <button 
              key={status} 
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search files by name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="doc-grid">
        {loading ? (
          // Skeleton Loaders
          [1, 2, 3].map(i => (
            <div key={i} className="doc-card">
              <div className="skeleton" style={{ height: '24px', width: '60%' }}></div>
              <div className="skeleton" style={{ height: '16px', width: '40%', marginTop: 'auto' }}></div>
            </div>
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="empty-state glass-panel fade-in">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <h3>No documents found</h3>
            <p>Upload a file or change your filters to see results.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isReady = doc.status === "INDEXED";
            const isPdf = doc.fileName.toLowerCase().endsWith(".pdf");
            const date = new Date(doc.uploadedAt).toLocaleDateString();

            return (
              <div 
                key={doc.id} 
                className={`doc-card ${isReady ? 'ready' : ''} fade-in`}
                onClick={() => isReady && navigate(`/chat/${doc.id}`)}
              >
                <div className="doc-card-header">
                  <div className={`file-icon ${isPdf ? 'file-pdf' : 'file-txt'}`}>
                    {isPdf ? "PDF" : "TXT"}
                  </div>
                  <button 
                    className="btn-delete" 
                    title="Delete Document"
                    onClick={(e) => handleDelete(e, doc.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                
                <h3 className="doc-name" title={doc.fileName}>{doc.fileName}</h3>
                
                <div className="doc-meta">
                  <span>{date}</span>
                </div>
                
                {/* Advanced Processing Tracker */}
                {(doc.status === "PROCESSING" || doc.status === "PENDING") ? (
                  <div className="status-tracker">
                    <div className="status-step completed">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Uploading
                    </div>
                    <div className="status-step active">
                      <span className="spinner-mini"></span>
                      Extracting text & Indexing
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 'auto' }}>
                    {getStatusBadge(doc.status)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
