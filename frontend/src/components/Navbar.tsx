import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { techniciansAPI, notificationsAPI } from '../services/api';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [triggering, setTriggering] = useState<boolean>(false);

  const fetchNotificationCount = async () => {
    try {
      const list = await notificationsAPI.list();
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerDemoDisruption = async () => {
    setTriggering(true);
    try {
      // Find T1
      const techs = await techniciansAPI.list();
      const t1 = techs.find((t) => t.employee_code === 'T1') || techs[0];
      if (t1) {
        await techniciansAPI.triggerUnavailable(
          t1.id,
          'Sudden transit breakdown on Highway I-75 while dispatched to M-104 Hydraulic Press'
        );
        fetchNotificationCount();
        alert('ALERT: Disruption Triggered! Technician T1 marked unavailable. MORPHIX resilience engine has detected the disruption, created an Exception, and calculated recovery options. Refreshing dashboard.');
        window.location.reload();
      }
    } catch (err: any) {
      alert('Error triggering disruption: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <>
      <header
        style={{
          height: 64,
          backgroundColor: '#0d1322',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px #10b981',
              }}
            />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              MORPHIX
            </span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: 4,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Industrial Resilience OS
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', display: 'none' }}>
            "See the disruption. Simulate the future. Orchestrate the recovery."
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Quick Disruption Trigger Demo Button */}
          <button
            onClick={handleTriggerDemoDisruption}
            disabled={triggering}
            className="btn btn-danger btn-sm"
            style={{ fontSize: '0.78rem', letterSpacing: '0.02em' }}
            title="Simulate sudden T1 unavailable disruption on live SR-1001"
          >
            ⚡ {triggering ? 'Simulating...' : 'Simulate T1 Disruption'}
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              position: 'relative',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 6,
              color: '#f8fafc',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '4px 12px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 600 }}>{user?.role}</div>
            </div>
          </div>

          {/* Logout */}
          <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out of session">
            Logout
          </button>
        </div>
      </header>

      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefreshCount={fetchNotificationCount}
      />
    </>
  );
};
