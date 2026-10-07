import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Command Dashboard', path: '/', icon: '📡', badge: 'Live' },
    { label: 'Service Requests', path: '/service-requests', icon: '📋' },
    { label: 'Exceptions & Recovery', path: '/exceptions', icon: '🚨' },
    { label: 'Simulation Lab', path: '/simulation', icon: '🧪' },
    { label: 'Technician Portal', path: '/technician-portal', icon: '👷' },
    { label: 'Industrial Equipment', path: '/machines', icon: '⚙️' },
    { label: 'Spare Parts & Inventory', path: '/inventory', icon: '📦' },
    { label: 'Field Technicians', path: '/technicians', icon: '👥' },
    { label: 'Audit Traceability', path: '/audit-logs', icon: '📜' },
  ];

  return (
    <aside
      style={{
        width: 260,
        backgroundColor: '#0c111d',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 14px',
      }}
    >
      <div style={{ marginBottom: 24, padding: '0 8px' }}>
        <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          Navigation Center
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#f8fafc' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                }}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer system status */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>PostgreSQL MORPHIX</span>
        </div>
        <div>22 Tables Verified Online</div>
      </div>
    </aside>
  );
};
