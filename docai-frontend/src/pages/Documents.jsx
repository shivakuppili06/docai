import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, Search, Trash2, MessageSquare } from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(id);
      toast('Document deleted', 'success');
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err) {
      toast('Failed to delete', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Documents</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Manage and search through all your uploaded files.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
          <div style={{ position: 'absolute', left: '0.75rem', top: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <Search size={18} />
          </div>
          <Input 
            placeholder="Search documents by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height="70px" />)}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontWeight: '500' }}>No documents found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>Uploaded Date</th>
                  <th style={{ padding: '1rem 0.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr 
                    key={doc.id} 
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{ borderBottom: 'var(--border-thin)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div className="flex items-center gap-3">
                        <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '500' }}>{doc.fileName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}><Badge status={doc.status}>{doc.status}</Badge></td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        {doc.status === 'INDEXED' && (
                          <Button 
                            variant="secondary" size="sm" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}
                            title="Chat with Document"
                          >
                            <MessageSquare size={16} />
                          </Button>
                        )}
                        <Button 
                          variant="danger" size="sm" 
                          onClick={(e) => handleDelete(e, doc.id)}
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
