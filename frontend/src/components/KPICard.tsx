import React from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  accentColor?: string;
  isAlert?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  accentColor = '#06b6d4',
  isAlert = false,
}) => {
  return (
    <div
      className={`card ${isAlert ? 'pulse-critical' : ''}`}
      style={{
        borderLeft: `4px solid ${accentColor}`,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderLeftWidth: '4px',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0 4px', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
