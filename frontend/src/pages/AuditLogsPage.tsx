import React, { useState, useEffect } from 'react';
import { auditLogsAPI } from '../services/api';
import { AuditLogItem } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogsAPI.list();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Operational Audit Traceability
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Immutable event journal tracking all work orders, dispatches, exceptions, and AI recovery decisions
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedLog ? '1.8fr 1.2fr' : '1fr', gap: 20 }}>
        {/* Logs Table */}
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Operator</th>
                  <th>Entity Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                      No audit log records recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer', backgroundColor: selectedLog?.id === log.id ? '#eff6ff' : undefined }}
                    >
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
                        {log.user_name || 'System'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#334155' }}>{log.entity_type}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Log Inspector Panel */}
        {selectedLog && (
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: '#0f172a' }}>Audit Record Inspector</span>
              <button onClick={() => setSelectedLog(null)} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Action Executed</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7' }}>{selectedLog.action}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem', marginBottom: 16 }}>
              <div>
                <span style={{ color: '#64748b' }}>Operator:</span> <b style={{ color: '#0f172a' }}>{selectedLog.user_name || 'System'}</b>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Entity:</span> <b style={{ color: '#0f172a' }}>{selectedLog.entity_type}</b>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                New State Delta (Values)
              </div>
              <pre
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  color: '#059669',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.new_values, null, 2) || 'None'}
              </pre>
            </div>

            {selectedLog.old_values && (
              <div>
                <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700, marginBottom: 4 }}>
                  Previous State (Values)
                </div>
                <pre
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    color: '#d97706',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
