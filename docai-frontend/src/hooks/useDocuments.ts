import { useState, useEffect, useCallback, useRef } from 'react';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Document } from '@/types';
import { AxiosProgressEvent } from 'axios';

export function useDocuments(pollingInterval = 0) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const { toast } = useToast(); 
  const timeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchDocuments = useCallback(async (silent = false, targetPage = page) => {
    if (!silent) setLoading(true);
    try {
      const res = await documentApi.list(targetPage, 10, 'uploadedAt', 'DESC');
      if (!isMountedRef.current) return;
      const docs = Array.isArray(res.data?.content)
        ? res.data.content
        : Array.isArray(res.data)
          ? res.data
          : [];
      setDocuments(docs);
      setTotalPages(res.data?.totalPages ?? 1);
      setTotalElements(res.data?.totalElements ?? docs.length);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = 'Failed to load documents';
      setError(msg);
      setDocuments([]);
      if (!silent) toast(msg, 'error');
    } finally {
      if (isMountedRef.current && !silent) setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchDocuments(false, page);
  }, [page, fetchDocuments]);

  useEffect(() => {
    const safeDocs = Array.isArray(documents) ? documents : [];
    const hasProcessing = safeDocs.some(d => d.status === 'PENDING' || d.status === 'PROCESSING');
    
    if (pollingInterval > 0 && hasProcessing) {
      const checkPending = async () => {
        await fetchDocuments(true, page);
      };
      
      timeoutRef.current = setTimeout(checkPending, pollingInterval);
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [pollingInterval, fetchDocuments, documents, page]);

  const deleteDocument = async (id: string) => {
    try {
      await documentApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast('Document deleted successfully', 'success');
      // If we deleted the last item on the page and there's a previous page, go back
      if (documents.length === 1 && page > 0) {
        setPage(p => p - 1);
      } else {
        await fetchDocuments(true, page);
      }
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
      // If we upload, usually it goes to the first page (newest first)
      if (page !== 0) {
        setPage(0);
      } else {
        await fetchDocuments(true, 0);
      }
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
    refresh: () => fetchDocuments(false, page),
    deleteDocument,
    uploadDocument,
    page,
    setPage,
    totalPages,
    totalElements
  };
}
