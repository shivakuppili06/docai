import axios, { AxiosRequestConfig, AxiosResponse, AxiosProgressEvent, AxiosError } from "axios";
import { AuthResponse, Document, UploadResponse, ChatMessage } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("docai_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data: any) => api.post<AuthResponse>("/api/auth/register", data),
  login: (data: any) => api.post<AuthResponse>("/api/auth/login", data),
};

export const documentApi = {
  upload: (file: File, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<UploadResponse>("/api/documents/upload", formData, {
      onUploadProgress,
    });
  },
  list: () => api.get<Document[]>("/api/documents"),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  getUrl: (id: string) => api.get<{url: string}>(`/api/documents/${id}/url`),
  // Share a document with another user (VIEWER or EDITOR role)
  share: (id: string, userId: string, role = "VIEWER") =>
    api.post(`/api/documents/${id}/share`, null, { params: { userId, role } }),
};

export interface AskResponse {
  id?: string;
  question: string;
  answer: string;
  sourceCitations?: string;
}

export const chatApi = {
  ask: (documentId: string, question: string) => api.post<AskResponse>("/api/chat/ask", { documentId, question }),
  history: (documentId: string) => api.get<AskResponse[]>(`/api/chat/history/${documentId}`),
  askStream: async (
    documentId: string, 
    question: string, 
    onChunk: (text: string) => void, 
    onSources: (sources: any[]) => void,
    onComplete: () => void,
    onError: (err: any) => void
  ) => {
    const token = localStorage.getItem('docai_token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ documentId, question })
      });

      if (!response.ok) {
        throw new Error('Stream failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');
      
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const rawData = line.slice(5).trim();
              if(!rawData) continue;
              const data = JSON.parse(rawData);
              if (data.text) {
                onChunk(data.text);
              }
              if (data.sources) {
                onSources(data.sources);
              }
              if (data.error) {
                onError(new Error(data.error));
              }
            } catch (e) {
              // parsing error, ignore partial chunk
            }
          }
        }
      }
      onComplete();
    } catch (err) {
      onError(err);
    }
  }
};

export default api;
