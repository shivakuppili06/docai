import { useState, useEffect, useCallback, useRef } from 'react';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Document } from '@/types';
import { AxiosProgressEvent, AxiosError } from 'axios';

export function useDocuments(pollingInterval = 0) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast() as any; // Temporary fix if toast is misaligned
  const timeoutRef = useRef<any>(null);

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
    const hasProcessing = documents.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
    
    if (pollingInterval > 0 && hasProcessing) {
      const checkPending = async () => {
        await fetchDocuments(true);
      };
      
      timeoutRef.current = setTimeout(checkPending, pollingInterval);
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [pollingInterval, fetchDocuments, documents]);

  const deleteDocument = async (id: string) => {
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

  const uploadDocument = async (file: File, onProgress?: (progressEvent: AxiosProgressEvent) => void) => {
    try {
      await documentApi.upload(file, onProgress);
      toast('Document uploaded successfully. Indexing started.', 'success');
      await fetchDocuments(true);
      return true;
    } catch (err: any) {
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
