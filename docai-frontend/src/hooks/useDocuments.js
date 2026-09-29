import { useState, useEffect, useCallback, useRef } from 'react';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';

export function useDocuments(pollingInterval = 0) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const timeoutRef = useRef(null);

  const fetchDocuments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await documentApi.list();
      setDocuments(res.data);
      setError(null);
    } catch (err) {
      const msg = 'Failed to load documents';
      setError(msg);
      if (!silent) toast(msg, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (pollingInterval > 0) {
      const checkPending = async () => {
        const hasProcessing = documents.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
        if (hasProcessing) {
          await fetchDocuments(true);
        }
        timeoutRef.current = setTimeout(checkPending, pollingInterval);
      };
      
      timeoutRef.current = setTimeout(checkPending, pollingInterval);
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [pollingInterval, fetchDocuments, documents]);

  const deleteDocument = async (id) => {
    try {
      await documentApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast('Document deleted successfully', 'success');
      return true;
    } catch (err) {
      toast('Failed to delete', 'error');
      return false;
    }
  };

  const uploadDocument = async (file, onProgress) => {
    try {
      await documentApi.upload(file, onProgress);
      toast('Document uploaded successfully. Indexing started.', 'success');
      await fetchDocuments(true);
      return true;
    } catch (err) {
      toast(err.response?.data?.error || 'Upload failed', 'error');
      return false;
    }
  };

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    deleteDocument,
    uploadDocument
  };
}
