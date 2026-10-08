import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { machinesAPI } from '../services/api';
import { Machine } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const MachinesPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [critFilter, setCritFilter] = useState('');

  useEffect(() => {
    loadMachines();
  }, [statusFilter, critFilter]);

  const loadMachines = async () => {
    setLoading(true);
    try {
      const data = await machinesAPI.list({
        status: statusFilter || undefined,
        criticality: critFilter || undefined,
      });
      setMachines(data);
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
            Industrial Equipment & Assets
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Critical presses, CNC mills, robotic cells and compressors across industrial sites
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Equipment Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 180, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONAL">OPERATIONAL</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Criticality</label>
          <select
            value={critFilter}
            onChange={(e) => setCritFilter(e.target.value)}
            className="form-select"
            style={{ width: 180, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Criticalities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ padding: 40, color: '#64748b' }}>Loading equipment catalog...</div>
        ) : (
          machines.map((m) => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>
                    {m.machine_code}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <StatusBadge status={m.criticality} type="priority" />
                    <StatusBadge status={m.status} type="status" />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  {m.name}
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 8 }}>
                  Site: {m.site_name} • Type: {m.machine_type}
                </div>
                <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4, marginBottom: 12 }}>
                  {m.description}
                </p>

                <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: 12, marginBottom: 14 }}>
                  <span>Mfg: {m.manufacturer}</span>
                  <span>Model: {m.model_number}</span>
                </div>
              </div>

              <Link to="/service-requests" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                + Raise Service Ticket
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
