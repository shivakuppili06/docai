import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, MessageSquare, Trash2, ArrowLeft, Download, EyeOff } from 'lucide-react';

const DocumentViewer = () => {
  const { documentId } = useParams({ strict: false });
  const [doc, setDoc] = useState<any>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast() as any;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await documentApi.list();
        const found = res.data.find(d => d.id.toString() === documentId);
        if (found) {
          setDoc(found);
          try {
            const urlRes = await documentApi.getUrl(found.id.toString());
            setDocUrl(urlRes.data.url);
          } catch (e) {
            console.error("Failed to load PDF URL");
          }
        } else {
          toast('Document not found', 'error');
          navigate({ to: '/documents' });
        }
      } catch (err) {
        toast('Failed to load document details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId, navigate, toast]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentApi.delete(doc.id);
      toast('Document deleted', 'success');
      navigate({ to: '/documents' });
    } catch (err) {
      toast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton height="40px" width="200px" />
        <Skeleton height="500px" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate({ to: '/documents' })} style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }} className="flex items-center gap-3">
              {doc.fileName} <Badge status={doc.status}>{doc.status}</Badge>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Uploaded on {new Date(doc.uploadedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {doc.status === 'INDEXED' && (
            <Button onClick={() => navigate({ to: '/chat/$documentId', params: { documentId: doc.id.toString() } })} className="flex items-center gap-2">
              <MessageSquare size={16} /> Open in Chat
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete} className="flex items-center gap-2">
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Info Panel */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', borderBottom: 'var(--border-thin)', paddingBottom: '0.75rem' }}>
            Document Details
          </h3>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Name</div>
            <div style={{ fontWeight: '500', wordBreak: 'break-all' }}>{doc.fileName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Status</div>
            <div style={{ marginTop: '0.25rem' }}><Badge status={doc.status}>{doc.status}</Badge></div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Date Added</div>
            <div style={{ fontWeight: '500' }}>{new Date(doc.uploadedAt).toLocaleString()}</div>
          </div>
          
          {/* Missing endpoints noted in spec */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: 'var(--border-thin)' }}>
            <Button variant="secondary" className="w-full flex justify-center items-center gap-2" disabled>
              <Download size={16} /> Download PDF <br/><span style={{fontSize: '10px'}}>(Coming Soon)</span>
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
          {docUrl ? (
            <iframe 
              src={docUrl} 
              title="PDF Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <EyeOff size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>PDF Preview Loading</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
