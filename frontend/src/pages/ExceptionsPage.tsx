import React, { useState, useEffect } from 'react';
import { exceptionsAPI, recoveryAPI, techniciansAPI } from '../services/api';
import { ExceptionRecord, RecoveryPlan, Technician } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [plans, setPlans] = useState<RecoveryPlan[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null);

  // Disruption simulation form
  const [disruptTechId, setDisruptTechId] = useState('');
  const [disruptReason, setDisruptReason] = useState('Critical breakdown en route to industrial site');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadExceptions();
    loadTechs();
  }, []);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await exceptionsAPI.list();
      setExceptions(data);
      if (data.length > 0 && !selectedException) {
        selectException(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTechs = async () => {
    try {
      const t = await techniciansAPI.list();
      setTechnicians(t);
      if (t.length > 0) setDisruptTechId(t[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const selectException = async (exc: ExceptionRecord) => {
    setSelectedException(exc);
    setLoadingPlans(true);
    try {
      const p = await exceptionsAPI.getPlans(exc.id);
      setPlans(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleApplyPlan = async (planId: string) => {
    setApplyingPlanId(planId);
    try {
      await recoveryAPI.apply(planId, 'Orchestration applied by Dispatcher/Manager');
      alert('Recovery Plan applied successfully! Live assignment updated and exception resolved.');
      loadExceptions();
      if (selectedException) {
        selectException(selectedException);
      }
    } catch (err: any) {
      alert('Failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setApplyingPlanId(null);
    }
  };

  const handleSimulateDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disruptTechId) return;
    setTriggering(true);
    try {
      await techniciansAPI.triggerUnavailable(disruptTechId, disruptReason);
      alert('Disruption triggered! Exception created and AI recovery plans generated.');
      loadExceptions();
    } catch (err: any) {
      alert('Error triggering disruption: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Operational Resilience & Exception Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            "See the disruption. Simulate the future. Orchestrate the recovery."
          </p>
        </div>
      </div>

      {/* Disruption Simulator Tool */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
        }}
      >
        <div className="card-header">
          <span className="card-title" style={{ color: '#dc2626' }}>
            ⚡ Live Disruption Injection & Resilience Testing
          </span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Simulate realistic field shocks to evaluate autonomous recovery
          </span>
        </div>

        <form onSubmit={handleSimulateDisruption} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2.5fr 1fr', gap: 12 }}>
          <select
            value={disruptTechId}
            onChange={(e) => setDisruptTechId(e.target.value)}
            className="form-select"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.employee_code} — {t.user_name || 'Tech'} ({t.specialization})
              </option>
            ))}
          </select>

          <input
            type="text"
            value={disruptReason}
            onChange={(e) => setDisruptReason(e.target.value)}
            className="form-input"
            placeholder="Disruption scenario description"
            required
          />

          <button type="submit" disabled={triggering} className="btn btn-danger">
            {triggering ? 'Injecting...' : '⚡ Trigger Disruption'}
          </button>
        </form>
      </div>

      {/* Main Grid: Exceptions List & Plan Resolution Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
        {/* Left Column: Exceptions Roster */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: '#0f172a' }}>🚨 Active Disruptions ({exceptions.length})</span>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: '#64748b' }}>Loading disruptions...</div>
          ) : exceptions.length === 0 ? (
            <div style={{ padding: 30, color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
              ✓ No disruptions recorded. System resilient.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exceptions.map((exc) => {
                const isSelected = selectedException?.id === exc.id;
                return (
                  <div
                    key={exc.id}
                    onClick={() => selectException(exc)}
                    style={{
                      padding: 14,
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <StatusBadge status={exc.severity} type="severity" />
                      <StatusBadge status={exc.status} type="status" />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4 }}>
                      {exc.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.3 }}>
                      {exc.description}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8 }}>
                      Detected: {new Date(exc.detected_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Recovery Recommendations for Selected Exception */}
        <div className="card">
          <div className="card-header">
            <div>
              <span className="card-title" style={{ color: '#0284c7' }}>
                🧠 AI Recovery Engine — Evaluated Alternatives
              </span>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {selectedException ? selectedException.title : 'Select a disruption to view candidate recovery options'}
              </p>
            </div>
          </div>

          {loadingPlans ? (
            <div style={{ padding: 30, color: '#64748b' }}>Synthesizing recovery solutions...</div>
          ) : plans.length === 0 ? (
            <div style={{ padding: 30, color: '#64748b', textAlign: 'center' }}>
              No recovery plans generated for this record.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {plans.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: p.status === 'APPLIED' ? '1px solid #10b981' : idx === 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                        {p.strategy_type.replace(/_/g, ' ')}
                      </span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                        {p.plan_name}
                      </h4>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '3px 8px',
                          borderRadius: 4,
                        }}
                      >
                        Score: {p.score}%
                      </span>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4, margin: '8px 0 12px' }}>
                    {p.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: '0.8rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: 6, marginBottom: 14 }}>
                    <div>⏱ Delay: +{p.estimated_delay_minutes || 0}m</div>
                    <div>🚗 Travel: {p.estimated_travel_distance_km || 0} km</div>
                    <div>👷 Tech: {p.proposed_technician_name || 'Standard backup'}</div>
                  </div>

                  {p.status === 'PROPOSED' && (
                    <button
                      onClick={() => handleApplyPlan(p.id)}
                      disabled={applyingPlanId === p.id}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      {applyingPlanId === p.id ? 'Orchestrating...' : '✓ Execute & Apply Recovery Plan'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
