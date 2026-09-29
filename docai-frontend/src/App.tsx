import React, { Suspense, lazy, useEffect } from "react";
import { 
  createRouter, 
  createRoute, 
  createRootRoute, 
  RouterProvider,
  Outlet,
  useNavigate,
  createHashHistory
} from "@tanstack/react-router";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    );
  }
  
  return children;
}

const SuspenseFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
  </div>
);

// TanStack Router Setup
const rootRoute = createRootRoute({
  component: AppLayout
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><Dashboard /></Suspense>
    </ProtectedRoute>
  )
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><Documents /></Suspense>
    </ProtectedRoute>
  )
});

const documentViewerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documents/$documentId",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><DocumentViewer /></Suspense>
    </ProtectedRoute>
  )
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$documentId",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><Chat /></Suspense>
    </ProtectedRoute>
  )
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><Analytics /></Suspense>
    </ProtectedRoute>
  )
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <ProtectedRoute>
      <Suspense fallback={<SuspenseFallback />}><Settings /></Suspense>
    </ProtectedRoute>
  )
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  documentsRoute,
  documentViewerRoute,
  chatRoute,
  analyticsRoute,
  settingsRoute,
]);

const hashHistory = createHashHistory();
const router = createRouter({ routeTree, history: hashHistory });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
