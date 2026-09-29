const fs = require('fs');


// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace('const InitialLoader = ({ children }) => {', 'const InitialLoader = ({ children }: any) => {');
app = app.replace('const { loading } = useAuth();', 'const { user, session } = useAuth();\n  const loading = false;');
fs.writeFileSync('src/App.tsx', app);

// DashboardLayout.tsx
let dash = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');
dash = dash.replace('const DashboardLayout = ({ children }) => {', 'const DashboardLayout = ({ children }: any) => {');
fs.writeFileSync('src/components/DashboardLayout.tsx', dash);

// ProtectedRoute.tsx
let prot = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf8');
prot = prot.replace('const ProtectedRoute = ({ children }) => {', 'const ProtectedRoute = ({ children }: any) => {');
fs.writeFileSync('src/components/ProtectedRoute.tsx', prot);

// Sidebar.tsx
let side = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
side = side.replace('const Sidebar = ({ isOpen, onClose }) => {', 'const Sidebar = ({ isOpen, onClose }: any) => {');
side = side.replace('const getInitials = (name) => {', 'const getInitials = (name: any) => {');
side = side.replace('return name.split(\' \').map(n =>', 'return name.split(\' \').map((n: any) =>');
fs.writeFileSync('src/components/Sidebar.tsx', side);

// TopNav.tsx
let top = fs.readFileSync('src/components/TopNav.tsx', 'utf8');
top = top.replace('const TopNav = ({ onMenuClick }) => {', 'const TopNav = ({ onMenuClick }: any) => {');
fs.writeFileSync('src/components/TopNav.tsx', top);

// UploadModal.tsx
let up = fs.readFileSync('src/components/UploadModal.tsx', 'utf8');
up = up.replace('export const UploadModal = ({ isOpen, onClose, onUpload }) => {', 'export const UploadModal = ({ isOpen, onClose, onUpload }: any) => {');
up = up.replace('const handleDrag = (e) => {', 'const handleDrag = (e: any) => {');
up = up.replace('onUploadProgress: (progressEvent) => {', 'onUploadProgress: (progressEvent: any) => {');
up = up.replace('setFile(e.target.files[0]);', 'setFile(e.target.files?.[0]);');
fs.writeFileSync('src/components/UploadModal.tsx', up);

// AppLayout.tsx
let appLayout = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf8');
appLayout = appLayout.replace('const { user, loading, logout } = useAuth();', 'const { user, logout } = useAuth();\n  const loading = false;');
appLayout = appLayout.replace(/position:\s*'fixed'/g, 'position: "fixed" as const');
fs.writeFileSync('src/components/layout/AppLayout.tsx', appLayout);

// main.tsx
let main = fs.readFileSync('src/main.tsx', 'utf8');
main = main.replace('document.getElementById(\'root\')', 'document.getElementById(\'root\')!');
fs.writeFileSync('src/main.tsx', main);
