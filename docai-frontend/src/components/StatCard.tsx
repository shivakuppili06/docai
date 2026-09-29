import React, { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

export default function StatCard({ label, value, icon, color = "var(--primary)" }: StatCardProps) {
  return (
    <div className="stat-card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{ color, padding: '8px', background: `${color}15`, borderRadius: '8px' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
