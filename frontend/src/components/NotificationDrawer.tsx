import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { NotificationItem } from '../types';
import { StatusBadge } from './StatusBadge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshCount: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onRefreshCount }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsAPI.list();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      loadNotifications();
      onRefreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      loadNotifications();
      onRefreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.12)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>System Notifications</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Live operational alerts & dispatches</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm" title="Mark all read">
            Clear All
          </button>
          <button onClick={onClose} style={{ color: '#64748b', fontSize: '1.2rem', padding: '0 6px', background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No active notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
              style={{
                padding: '14px',
                marginBottom: '10px',
                backgroundColor: n.is_read ? '#f8fafc' : '#eff6ff',
                border: n.is_read ? '1px solid #e2e8f0' : '1px solid #93c5fd',
                borderRadius: '8px',
                cursor: n.is_read ? 'default' : 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <StatusBadge status={n.notification_type} />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a', marginBottom: 4 }}>
                {n.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                {n.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
