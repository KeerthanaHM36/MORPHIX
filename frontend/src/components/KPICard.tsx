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
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(17,24,39,0.95) 100%)',
      }}
    >
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0 4px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
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
