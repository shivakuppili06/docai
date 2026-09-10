import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const pollRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();

  const fetchDocuments = async () => {
    try {
      const { data } = await documentApi.list();
      setDocuments(data);
    } catch {
      // Suppress error toast here to avoid spam on polling
    }
  };

  useEffect(() => {
    fetchDocuments();
    pollRef.current = setInterval(fetchDocuments, 3000);
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
    if (!window.confirm("Are you sure you want to delete this document? This will also delete your chat history.")) return;
    
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

  const getFileIcon = (fileName) => {
    const isPdf = fileName.toLowerCase().endsWith(".pdf");
    return (
      <div className={`file-icon ${isPdf ? 'file-pdf' : 'file-txt'}`}>
        {isPdf ? "PDF" : "TXT"}
      </div>
    );
  };

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <h1>My Documents</h1>
        <div className="user-controls">
          <span className="user-email">{user?.email}</span>
          <button onClick={logout} className="btn-logout">Sign out</button>
        </div>
      </header>

      <section className="upload-section">
        <label 
          className={`upload-label ${uploading ? 'disabled' : ''} ${isDragActive ? 'drag-active' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="upload-progress-container">
              <p>Uploading & Processing... {uploadProgress}%</p>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <div className="upload-prompt">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Click to upload or drag and drop</p>
              <span className="upload-hint">PDF or TXT up to 10MB</span>
            </div>
          )}
          <input 
            type="file" 
            accept=".pdf,.txt" 
            onChange={handleFileChange}
            disabled={uploading} 
            hidden 
          />
        </label>
      </section>

      <section className="doc-grid">
        {documents.length === 0 && (
          <div className="empty-state glass-panel fade-in">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3>No documents yet</h3>
            <p>Upload a file above to start analyzing and chatting with it.</p>
          </div>
        )}
        
        {documents.map((doc) => {
          const isReady = doc.status === "INDEXED";
          return (
            <div 
              key={doc.id} 
              className={`doc-card ${isReady ? 'ready' : ''} fade-in`}
              onClick={() => isReady && navigate(`/chat/${doc.id}`)}
            >
              <div className="doc-card-header">
                {getFileIcon(doc.fileName)}
                <button 
                  className="btn-icon btn-delete" 
                  title="Delete Document"
                  onClick={(e) => handleDelete(e, doc.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              <h3 className="doc-name">{doc.fileName}</h3>
              <div className="doc-card-footer">
                <span className="doc-meta">Just now • 1.2 MB</span>
                {getStatusBadge(doc.status)}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
