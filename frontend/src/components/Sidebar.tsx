import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  
  const allMainNavItems = [
    { label: 'Dashboard', path: '/', icon: '🏠', roles: ['ADMIN', 'MANAGER', 'DISPATCHER', 'VIEWER'] },
    { label: 'Service Requests', path: '/service-requests', icon: '📋', roles: ['ADMIN', 'MANAGER', 'DISPATCHER'] },
    { label: 'Technicians', path: '/technicians', icon: '👥', roles: ['ADMIN', 'MANAGER', 'DISPATCHER'] },
    { label: 'Assets & Machines', path: '/machines', icon: '📦', roles: ['ADMIN', 'MANAGER', 'DISPATCHER', 'VIEWER'] },
    { label: 'Spare Parts', path: '/inventory', icon: '🗄️', roles: ['ADMIN', 'MANAGER', 'DISPATCHER'] },
    { label: 'Scheduling', path: '/technician-portal', icon: '📅', roles: ['ADMIN', 'MANAGER', 'DISPATCHER', 'TECHNICIAN'] },
    { label: 'Optimization', path: '/simulation', icon: '🔀', roles: ['ADMIN', 'MANAGER'] },
    { label: 'Risk & Predictions', path: '/exceptions', icon: '📊', roles: ['ADMIN', 'MANAGER', 'DISPATCHER'] },
    { label: 'Digital Twin', path: '/customer-portal', icon: '🗃️', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
    { label: 'Reports', path: '/audit-logs', icon: '📄', roles: ['ADMIN'] },
  ];

  const mainNavItems = allMainNavItems.filter(item => item.roles.includes(user?.role || ''));

  const bottomNavItems = [
    { label: 'Settings', path: '/settings', icon: '⚙️' },
    { label: 'Help & Support', path: '/help', icon: '❓' },
  ];

  return (
    <aside
      style={{
        width: 240,
        backgroundColor: '#0e1726',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px 16px',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '0 8px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '18px',
            boxShadow: '0 0 14px rgba(79, 70, 229, 0.4)',
          }}
        >
          M
        </div>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            MORPHIX
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
            Industrial Service Operations
          </div>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : '#94a3b8',
              backgroundColor: isActive ? '#2563eb' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '1rem', opacity: 0.9 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Nav Links */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 500,
              color: isActive ? '#ffffff' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};
