import axios from "axios";

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
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("docai_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
};

export const documentApi = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/documents/upload", formData, {
      onUploadProgress,
    });
  },
  list: () => api.get("/api/documents"),
  delete: (id) => api.delete(`/api/documents/${id}`),
  // Share a document with another user (VIEWER or EDITOR role)
  share: (id, userId, role = "VIEWER") =>
    api.post(`/api/documents/${id}/share`, null, { params: { userId, role } }),
};

export const chatApi = {
  ask: (documentId, question) => api.post("/api/chat/ask", { documentId, question }),
  history: (documentId) => api.get(`/api/chat/history/${documentId}`),
};

export default api;
