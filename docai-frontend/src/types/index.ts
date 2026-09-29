export type DocumentStatus = "PENDING" | "PROCESSING" | "INDEXED" | "FAILED";

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  id?: string;
}

export interface Document {
  id: string;
  fileName: string;
  status: DocumentStatus;
  uploadedAt: string;
  ownerId: string;
}

export interface DocumentShare {
  documentId: string;
  userId: string;
  permission: "VIEWER" | "EDITOR";
}

export interface SourceCitation {
  chunkIndex: number;
  textSnippet: string;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  role: "USER" | "AI";
  content: string;
  createdAt: string;
  sources?: SourceCitation[];
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface UploadResponse {
  id: string;
  fileName: string;
  status: DocumentStatus;
  uploadedAt: string;
}

export interface DashboardStatistics {
  totalDocuments: number;
  indexedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
}
