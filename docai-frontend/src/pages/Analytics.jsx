import React, { useEffect, useState } from 'react';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { PieChart, BarChart2, TrendingUp, AlertCircle } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await documentApi.list();
        const docs = res.data;
        setStats({
          total: docs.length,
          indexed: docs.filter(d => d.status === 'INDEXED').length,
          failed: docs.filter(d => d.status === 'FAILED').length,
          processing: docs.filter(d => d.status === 'PROCESSING' || d.status === 'PENDING').length
        });
      } catch (err) {
        toast('Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Analytics</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Insights and performance metrics for your workspace.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Docs</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
            {loading ? <Skeleton width="60px" /> : stats?.total}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Indexed Success Rate</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--color-success)' }}>
            {loading ? <Skeleton width="60px" /> : stats?.total === 0 ? '0%' : `${Math.round((stats?.indexed / stats?.total) * 100)}%`}
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Failed Indexing</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem', color: 'var(--color-danger)' }}>
            {loading ? <Skeleton width="60px" /> : stats?.failed}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Placeholder for Usage Chart */}
        <div className="card" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontWeight: '600' }}>Query Volume</h3>
          </div>
          <div style={{ flex: 1, backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--color-border)' }}>
            <AlertCircle size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: '500', color: 'var(--color-text-secondary)' }}>Advanced metrics coming soon</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Requires backend analytics API</p>
          </div>
        </div>

        {/* Placeholder for Document Types Chart */}
        <div className="card" style={{ padding: '1.5rem', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontWeight: '600' }}>Document Status Breakdown</h3>
          </div>
          {loading ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Skeleton width="200px" height="200px" borderRadius="50%" /></div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: '500', color: 'var(--color-success-text)' }}>Indexed</span>
                <span style={{ fontWeight: '700', color: 'var(--color-success-text)' }}>{stats?.indexed}</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: 'var(--color-warning-bg)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: '500', color: 'var(--color-warning-text)' }}>Processing</span>
                <span style={{ fontWeight: '700', color: 'var(--color-warning-text)' }}>{stats?.processing}</span>
              </div>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: '500', color: 'var(--color-danger-text)' }}>Failed</span>
                <span style={{ fontWeight: '700', color: 'var(--color-danger-text)' }}>{stats?.failed}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
