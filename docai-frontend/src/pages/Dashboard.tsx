import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useDocuments } from '../hooks/useDocuments';
import StatCard from '../components/StatCard';
import { DocumentRow } from '../components/DocumentRow';
import { UploadModal } from '../components/UploadModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { UploadCloud, FileText, ArrowRight, Loader2, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { documents, loading, uploadDocument } = useDocuments(3000); // Polling every 3s
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const totalCount = documents.length;
  const indexedCount = documents.filter(d => d.status === 'INDEXED').length;
  const processingCount = documents.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING').length;
  const recentDocs = documents.slice(0, 5);

  return (
    <div className="fade-in">
      <div className="dashboard-toolbar">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here's an overview of your documents.</p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <UploadCloud size={18} style={{ marginRight: '8px' }} /> Upload Document
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard 
          label="Total Documents" 
          value={loading ? '-' : totalCount} 
          icon={<FileText size={24} />} 
        />
        <StatCard 
          label="Indexed Ready" 
          value={loading ? '-' : indexedCount} 
          icon={<CheckCircle size={24} />} 
          color="#10b981" 
        />
        <StatCard 
          label="Processing" 
          value={loading ? '-' : processingCount} 
          icon={<Clock size={24} />} 
          color="#f59e0b" 
        />
      </div>

      <div className="table-container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="section-title" style={{marginBottom: 0}}>Recent Documents</h2>
          <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
            <Skeleton height="70px" />
            <Skeleton height="70px" />
            <Skeleton height="70px" />
          </div>
        ) : recentDocs.length === 0 ? (
          <EmptyState 
            title="No documents yet" 
            description="Upload your first document to start asking questions."
            actionLabel="Upload Document"
            onAction={() => setUploadModalOpen(true)}
            icon={<FileText size={48} />}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentDocs.map(doc => (
              <DocumentRow key={doc.id} doc={doc} isCompact={true} />
            ))}
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onUpload={uploadDocument} 
      />
    </div>
  );
};

export default React.memo(Dashboard);
