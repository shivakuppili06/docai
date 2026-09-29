import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { FileText, MessageSquare, Trash2, ArrowLeft, Download, ExternalLink, Loader2 } from 'lucide-react';

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
          
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: 'var(--border-thin)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button
              variant="secondary"
              className="w-full flex justify-center items-center gap-2"
              disabled={!docUrl}
              onClick={() => docUrl && window.open(docUrl, '_blank')}
            >
              <ExternalLink size={16} /> View PDF
            </Button>
            <Button
              variant="secondary"
              className="w-full flex justify-center items-center gap-2"
              disabled={!docUrl}
              onClick={() => {
                if (!docUrl) return;
                const a = document.createElement('a');
                a.href = docUrl;
                a.download = doc.fileName;
                a.click();
              }}
            >
              <Download size={16} /> Download PDF
            </Button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="card" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', gap: '1rem' }}>
          {docUrl ? (
            <>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={40} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{doc.fileName}</h3>
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
                Click the button below to open the PDF in a new tab, or use the sidebar buttons to view or download.
              </p>
              <Button onClick={() => window.open(docUrl, '_blank')} className="flex items-center gap-2">
                <ExternalLink size={16} /> Open PDF in New Tab
              </Button>
            </>
          ) : (
            <>
              <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>Loading document...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
