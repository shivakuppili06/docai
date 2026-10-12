import React, { useEffect, useState } from 'react';
import { documentApi } from '../api/client';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { PieChart as PieChartIcon, BarChart2, TrendingUp, AlertCircle, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AnalyticsStats {
  total: number;
  indexed: number;
  failed: number;
  processing: number;
  trendData: Array<{ date: string; count: number }>;
}

const Analytics = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();

  const pieData = React.useMemo(() => [
    { name: 'Indexed', value: stats?.indexed || 0, color: '#10b981' },
    { name: 'Processing', value: stats?.processing || 0, color: '#f59e0b' },
    { name: 'Failed', value: stats?.failed || 0, color: '#ef4444' }
  ], [stats?.indexed, stats?.processing, stats?.failed]);

  useEffect(() => {
    let isCancelled = false;
    const fetchStats = async () => {
      try {
        const res = await documentApi.list(0, 100);
        const docs = Array.isArray(res.data?.content) 
          ? res.data.content 
          : (Array.isArray(res.data) ? res.data : []);
        
        if (isCancelled) return;

        // Process data for charts
        const dateMap: Record<string, number> = {};
        docs.forEach(d => {
          const dateStr = new Date(d.uploadedAt).toLocaleDateString();
          dateMap[dateStr] = (dateMap[dateStr] || 0) + 1;
        });
        
        const trendData = Object.keys(dateMap).map(k => ({ date: k, count: dateMap[k] }));

        setStats({
          total: docs.length,
          indexed: docs.filter(d => d.status === 'INDEXED').length,
          failed: docs.filter(d => d.status === 'FAILED').length,
          processing: docs.filter(d => d.status === 'PROCESSING' || d.status === 'PENDING').length,
          trendData,
        });
      } catch (err) {
        if (!isCancelled) toast('Failed to load analytics', 'error');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      isCancelled = true;
    };
  }, [toast]);

  return (
    <div className="fade-in">
      <div className="dashboard-toolbar">
        <div>
          <h1 className="page-title">Workspace Overview</h1>
          <p className="page-subtitle">Real-time status of your document processing pipeline.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Documents</span>
            <span className="stat-value">{loading ? '-' : stats?.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Indexed Successfully</span>
            <span className="stat-value" style={{ color: '#15803d' }}>
              {loading ? '-' : stats?.indexed}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Failed Indexing</span>
            <span className="stat-value" style={{ color: '#b91c1c' }}>
              {loading ? '-' : stats?.failed}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '16px' }}>
        
        <div className="table-container" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="section-title" style={{ marginBottom: 0 }}>Document Status Breakdown</h3>
          </div>
          {loading ? (
             <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'center' }}>
               <Skeleton width="100%" height="160px" />
             </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={18} style={{ color: '#10b981' }} />
                  <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Indexed & Ready</span>
                </div>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#15803d' }}>{stats?.indexed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={18} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Currently Processing</span>
                </div>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#b45309' }}>{stats?.processing}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <XCircle size={18} style={{ color: '#ef4444' }} />
                  <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Failed or Error</span>
                </div>
                <span style={{ fontWeight: '700', fontSize: '18px', color: '#b91c1c' }}>{stats?.failed}</span>
              </div>
            </div>
          )}
        </div>

        <div className="table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="section-title" style={{ marginBottom: 0 }}>System Usage</h3>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', minHeight: '200px' }}>
            {stats && stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.trendData}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                <AlertCircle size={32} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                <p style={{ fontWeight: '500', color: 'var(--text-main)' }}>No trending data available</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', maxWidth: '80%' }}>
                  Upload some documents to see upload trends over time.
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="table-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
            <h3 className="section-title" style={{ marginBottom: 0 }}>Distribution</h3>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', minHeight: '200px' }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
