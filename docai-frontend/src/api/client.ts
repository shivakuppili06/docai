import axios, { AxiosRequestConfig, AxiosResponse, AxiosProgressEvent, AxiosError } from "axios";
import { AuthResponse, Document, UploadResponse, ChatMessage, PaginatedResponse, LoginRequest, RegisterRequest } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docai_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Generate a correlation ID for tracing
  config.headers['X-Correlation-ID'] = crypto.randomUUID();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("docai_token");
      localStorage.removeItem("docai_email");
      localStorage.removeItem("docai_fullName");
      if (window.location.hash !== "#/login" && window.location.pathname !== "/login") {
        window.location.href = "/#/login";
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data: RegisterRequest) => api.post<AuthResponse>("/api/auth/register", data),
  login: (data: LoginRequest) => api.post<AuthResponse>("/api/auth/login", data),
};

export const documentApi = {
  upload: (file: File, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<UploadResponse>("/api/documents/upload", formData, {
      onUploadProgress,
    });
  },
  list: (page = 0, size = 10, sort = "uploadedAt", direction = "DESC") => 
    api.get<PaginatedResponse<Document>>("/api/documents", { params: { page, size, sort, direction } }),
  get: (id: string) => api.get<Document>(`/api/documents/${id}`),
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
  /** true when the answer is an error message, not a real LLM response */
  isError?: boolean;
}

export const chatApi = {
  ask: (documentId: string, question: string, documentIds?: string[]) => 
    api.post<AskResponse>("/api/chat/ask", { 
      documentId, 
      documentIds: documentIds && documentIds.length > 0 ? documentIds : undefined,
      question 
    }),
  history: (documentId: string) => api.get<AskResponse[]>(`/api/chat/history/${documentId}`),
  askStream: async (
    documentId: string, 
    question: string, 
    onChunk: (text: string) => void, 
    onSources: (sources: any[]) => void,
    onComplete: () => void,
    onError: (err: string | Error) => void,
    documentIds?: string[]
  ) => {
    const token = localStorage.getItem('docai_token');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': crypto.randomUUID(),
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          documentId, 
          documentIds: documentIds && documentIds.length > 0 ? documentIds : undefined,
          question 
        })
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
                // Server yielded a structured error event (e.g. Gemini rate-limit).
                // Surface it as a visible error in the message bubble, not as text.
                onError(data.error as string);
                // No need to read further — close the stream.
                reader.cancel();
                onComplete();
                return;
              }
            } catch (e) {
              // parsing error, ignore partial chunk
            }
          }
        }
      }
      onComplete();
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
};

export default api;
