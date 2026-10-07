import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, recoveryAPI, assignmentsAPI } from '../services/api';
import { DashboardData } from '../types';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardAPI.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPlan = async (planId: string) => {
    setApplyingPlanId(planId);
    try {
      await recoveryAPI.apply(planId, 'Operator approved from Command Dashboard');
      alert('Recovery Plan executed successfully! Assignment updated and exception resolved.');
      fetchDashboard();
    } catch (err: any) {
      alert('Failed to apply recovery plan: ' + (err.response?.data?.detail || err.message));
    } finally {
      setApplyingPlanId(null);
    }
  };

  const handleBatchOptimize = async () => {
    setOptimizing(true);
    try {
      const plan = await assignmentsAPI.optimize();
      alert(`Optimization complete! Calculated optimal schedules for ${plan.length} pending service jobs.`);
      fetchDashboard();
    } catch (err: any) {
      alert('Optimization error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setOptimizing(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: 40, color: '#94a3b8' }}>Connecting to MORPHIX Industrial Telemetry...</div>;
  }

  const kpis = data?.kpis;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            Live Operations Command Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time multi-site equipment telemetry, active dispatches & resilience orchestration
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleBatchOptimize}
            disabled={optimizing}
            className="btn btn-primary"
            title="Run multi-objective optimization engine across pending jobs"
          >
            ⚙️ {optimizing ? 'Optimizing...' : 'Run Scheduling Optimizer'}
          </button>
          <Link to="/service-requests" className="btn btn-secondary">
            + New Request
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KPICard
          title="Open Requests"
          value={kpis?.open_service_requests || 0}
          subtitle="Active equipment tickets"
          accentColor="#06b6d4"
        />
        <KPICard
          title="Critical Priority"
          value={kpis?.critical_requests || 0}
          subtitle="Immediate line stoppage risk"
          accentColor="#ef4444"
          isAlert={(kpis?.critical_requests || 0) > 0}
        />
        <KPICard
          title="Field Techs Available"
          value={kpis?.technicians_available || 0}
          subtitle="Qualified roster ready for dispatch"
          accentColor="#10b981"
        />
        <KPICard
          title="Active Assignments"
          value={kpis?.active_assignments || 0}
          subtitle="Field jobs currently in progress"
          accentColor="#38bdf8"
        />
        <KPICard
          title="SLA At Risk"
          value={kpis?.sla_at_risk || 0}
          subtitle="Approaching contractual breach"
          accentColor="#f59e0b"
          isAlert={(kpis?.sla_at_risk || 0) > 0}
        />
        <KPICard
          title="Active Disruptions"
          value={kpis?.open_exceptions || 0}
          subtitle="Unresolved operational exceptions"
          accentColor="#ef4444"
          isAlert={(kpis?.open_exceptions || 0) > 0}
        />
      </div>

      {/* Resilience & Recovery Highlight Banner */}
      {data?.active_recovery_plans && data.active_recovery_plans.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 28,
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.15)',
          }}
        >
          <div className="card-header">
            <div>
              <span className="card-title" style={{ color: '#38bdf8' }}>
                🧠 AI Recovery Recommendations — Autonomous Orchestration
              </span>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                Candidate resilience actions synthesized from real-time skill matching, travel distance & SLA buffer
              </p>
            </div>
            <Link to="/exceptions" className="btn btn-secondary btn-sm">
              View All Disruptions →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {data.active_recovery_plans.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {plan.strategy_type.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}
                    >
                      Score: {plan.score}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
                    {plan.plan_name}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: 12 }}>
                    {plan.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', gap: 16, marginBottom: 16 }}>
                    <span>⏱ Delay: +{plan.estimated_delay_minutes || 0}m</span>
                    <span>🚗 Travel: {plan.estimated_travel_distance_km || 0}km</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApplyPlan(plan.id)}
                    disabled={applyingPlanId === plan.id}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    {applyingPlanId === plan.id ? 'Orchestrating...' : '✓ Apply Plan Now'}
                  </button>
                  <Link to="/simulation" className="btn btn-secondary btn-sm">
                    Simulate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Live Requests & Exceptions Center */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Live Requests Feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📡 Active Service Requests Feed</span>
            <Link to="/service-requests" style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
              View All ({kpis?.open_service_requests}) →
            </Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Code</th>
                  <th>Equipment & Title</th>
                  <th>Site</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.live_requests && data.live_requests.length > 0 ? (
                  data.live_requests.map((req) => (
                    <tr key={req.id}>
                      <td className="font-mono" style={{ fontWeight: 600, color: '#38bdf8' }}>
                        {req.request_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{req.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{req.machine_name}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{req.site_name}</td>
                      <td>
                        <StatusBadge status={req.priority} type="priority" />
                      </td>
                      <td>
                        <StatusBadge status={req.status} type="status" />
                      </td>
                      <td>
                        <StatusBadge status={req.sla_status} type="sla" />
                        {req.remaining_minutes !== undefined && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                            {req.remaining_minutes > 0 ? `${req.remaining_minutes}m remain` : 'Breached'}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link to={`/service-requests/${req.id}`} className="btn btn-secondary btn-sm">
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No active service requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Exception Center */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: '#f87171' }}>
              🚨 Disruption Triage Center
            </span>
            <Link to="/exceptions" style={{ fontSize: '0.82rem', color: '#f87171' }}>
              Details →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.critical_exceptions && data.critical_exceptions.length > 0 ? (
              data.critical_exceptions.map((exc) => (
                <div
                  key={exc.id}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <StatusBadge status={exc.severity} type="severity" />
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {exc.detected_at ? new Date(exc.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc', margin: '4px 0' }}>
                    {exc.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    {exc.description}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#10b981', fontSize: '0.9rem' }}>
                ✓ No active operational disruptions. All sectors nominal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technician Field Roster */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">👷 Field Technician Readiness & Availability</span>
          <Link to="/technicians" style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
            Full Roster ({data?.technician_roster.length || 0}) →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {data?.technician_roster.slice(0, 8).map((tech) => (
            <div
              key={tech.id}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
                    {tech.employee_code}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tech.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  {tech.specialization}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  Workload: {tech.current_workload} / {tech.max_daily_jobs} jobs
                </div>
              </div>
              <StatusBadge status={tech.availability_status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
