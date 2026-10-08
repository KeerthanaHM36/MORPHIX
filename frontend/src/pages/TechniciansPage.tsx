import React, { useState, useEffect } from 'react';
import { techniciansAPI } from '../services/api';
import { Technician } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const TechniciansPage: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadTechnicians();
  }, [statusFilter]);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const data = await techniciansAPI.list({
        availability_status: statusFilter || undefined,
      });
      setTechnicians(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (tech: Technician) => {
    const nextStatus = tech.availability_status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      if (nextStatus === 'UNAVAILABLE') {
        await techniciansAPI.triggerUnavailable(tech.id, 'Operator toggled availability status to UNAVAILABLE');
        alert(`Disruption registered! ${tech.employee_code} marked UNAVAILABLE. Exceptions & AI recovery plans synthesized.`);
      } else {
        await techniciansAPI.update(tech.id, { availability_status: 'AVAILABLE' });
        alert(`Status updated to AVAILABLE.`);
      }
      loadTechnicians();
    } catch (err: any) {
      alert('Error updating status: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Field Technicians & Skills Matrix
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Qualified industrial specialists, real-time workload ratios & technical competency
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 200, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Availability</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="BUSY">BUSY</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
          </select>
        </div>
      </div>

      {/* Technicians Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ padding: 40, color: '#64748b' }}>Loading field technicians...</div>
        ) : (
          technicians.map((t) => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7' }}>
                    {t.employee_code}
                  </span>
                  <StatusBadge status={t.availability_status} />
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                  {t.user_name || 'Technician'}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, marginBottom: 8 }}>
                  {t.specialization}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                  Experience: {t.experience_years} years • Workload: {t.current_workload} / {t.max_daily_jobs} active jobs
                </div>

                {/* Skills tags */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
                    Certified Competencies
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.skills && t.skills.length > 0 ? (
                      t.skills.map((s) => (
                        <span
                          key={s.skill_id}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            color: '#334155',
                            fontWeight: 500,
                          }}
                        >
                          {s.skill_name} ({s.proficiency_level}/5) {s.certified && '★'}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard electro-mechanical</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <button
                  onClick={() => handleToggleAvailability(t)}
                  className={`btn ${t.availability_status === 'AVAILABLE' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                  style={{ width: '100%' }}
                >
                  {t.availability_status === 'AVAILABLE' ? '⚡ Simulate Tech Unavailable' : 'Reset to Available'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
