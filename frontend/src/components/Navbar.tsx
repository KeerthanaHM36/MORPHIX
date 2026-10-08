import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <>
      <header
        style={{
          height: 64,
          backgroundColor: '#f0f4f9',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '420px' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '14px',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search service requests, machines, technicians, parts..."
            style={{
              width: '100%',
              padding: '9px 16px 9px 38px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#0f172a',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          />
        </div>

        {/* Right Section: Notifications, Theme Icon, User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Notification Bell */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
            title="Notifications"
          >
            <span style={{ fontSize: '15px' }}>🔔</span>
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ffffff',
              }}
            >
              3
            </span>
          </button>

          {/* Sun / Theme Mode Toggle */}
          <button
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#64748b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
            title="Toggle theme"
          >
            ☀️
          </button>

          {/* User Profile Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 6 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                border: '2px solid #ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'OP'}
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {user?.name || 'Operations Lead'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                {user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()}` : 'Operations Manager'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefreshCount={() => {}}
      />
    </>
  );
};
