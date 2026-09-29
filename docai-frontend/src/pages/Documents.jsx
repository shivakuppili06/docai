import React, { useState, useMemo } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { useDebounce } from '../hooks/useDebounce';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { DocumentRow } from '../components/DocumentRow';
import { Search, Loader2 } from 'lucide-react';

const Documents = () => {
  const { documents, loading, deleteDocument } = useDocuments(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  const filteredDocs = useMemo(() => {
    if (!debouncedSearch) return documents;
    const lowerSearch = debouncedSearch.toLowerCase();
    return documents.filter(d => d.fileName.toLowerCase().includes(lowerSearch));
  }, [documents, debouncedSearch]);

  const confirmDelete = (doc) => {
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    const success = await deleteDocument(documentToDelete.id);
    if (success) {
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
          <Search className="search-icon" aria-hidden="true" />
          <label htmlFor="search-docs" className="sr-only">Search documents by name</label>
          <input 
            id="search-docs"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
            <Skeleton height="56px" borderRadius="0" />
            <Skeleton height="56px" borderRadius="0" />
            <Skeleton height="56px" borderRadius="0" />
            <Skeleton height="56px" borderRadius="0" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState 
            title="No documents found" 
            description={debouncedSearch ? 'Try a different search term.' : 'You haven\'t uploaded any documents yet.'}
          />
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
                  <DocumentRow 
                    key={doc.id} 
                    doc={doc} 
                    onDeleteClick={confirmDelete}
                  />
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
        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;
