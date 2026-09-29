import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { AppLayout } from "./components/layout/AppLayout";
import { Loader2 } from "lucide-react";

import { Landing } from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const DocumentViewer = lazy(() => import("./pages/DocumentViewer"));
const Chat = lazy(() => import("./pages/Chat"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const SuspenseFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Authenticated Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Documents />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/documents/:documentId" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <DocumentViewer />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/chat/:documentId" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Chat />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Analytics />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
