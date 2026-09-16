import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout-container fade-in">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-content">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
