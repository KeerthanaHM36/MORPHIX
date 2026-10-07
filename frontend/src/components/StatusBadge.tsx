import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority' | 'severity' | 'sla';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const s = (status || '').toUpperCase();

  let badgeClass = 'badge-neutral';
  let dotColor = '#94a3b8';

  if (['CRITICAL', 'FAILED', 'DECOMMISSIONED', 'BREACHED'].includes(s)) {
    badgeClass = 'badge-critical';
    dotColor = '#ef4444';
  } else if (['HIGH', 'AT_RISK', 'DEGRADED', 'ON_HOLD', 'UNAVAILABLE'].includes(s)) {
    badgeClass = 'badge-warning';
    dotColor = '#f59e0b';
  } else if (['COMPLETED', 'OPERATIONAL', 'SAFE', 'RESOLVED', 'APPLIED', 'AVAILABLE'].includes(s)) {
    badgeClass = 'badge-success';
    dotColor = '#10b981';
  } else if (['ASSIGNED', 'IN_PROGRESS', 'RUNNING', 'CONFIRMED', 'OPEN', 'APPROVED'].includes(s)) {
    badgeClass = 'badge-info';
    dotColor = '#06b6d4';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block' }} />
      {s.replace(/_/g, ' ')}
    </span>
  );
};
