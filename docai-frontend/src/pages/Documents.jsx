import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { FileText, Search, Trash2, MessageSquare, Loader2 } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  
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
  }, []);

  const filteredDocs = useMemo(() => {
    if (!search) return documents;
    const lowerSearch = search.toLowerCase();
    return documents.filter(d => d.fileName.toLowerCase().includes(lowerSearch));
  }, [documents, search]);

  const confirmDelete = (e, doc) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    try {
      await documentApi.delete(documentToDelete.id);
      toast('Document deleted successfully', 'success');
      setDocuments(documents.filter(d => d.id !== documentToDelete.id));
    } catch (err) {
      toast('Failed to delete', 'error');
    } finally {
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="dashboard-toolbar">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage and search through all your uploaded files.</p>
        </div>
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search documents by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="empty-state">
            <FileText />
            <div>
              <p style={{ fontWeight: '500', fontSize: '16px', color: 'var(--text-main)' }}>No documents found</p>
              <p style={{ marginTop: '4px' }}>{search ? 'Try a different search term.' : 'You haven\'t uploaded any documents yet.'}</p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr 
                    key={doc.id} 
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="doc-name-cell">
                        <FileText size={18} className="file-icon-small" />
                        <span>{doc.fileName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        {doc.status === 'INDEXED' && (
                          <button 
                            className="icon-btn" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}
                            title="Ask questions"
                          >
                            <MessageSquare size={18} />
                          </button>
                        )}
                        <button 
                          className="icon-btn delete" 
                          onClick={(e) => confirmDelete(e, doc)}
                          title="Delete document"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete document?">
        <p className="modal-body">
          Are you sure you want to delete <strong>{documentToDelete?.fileName}</strong>? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;
