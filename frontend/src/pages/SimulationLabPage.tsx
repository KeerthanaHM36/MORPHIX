import React, { useState, useEffect } from 'react';
import { simulationAPI, serviceRequestsAPI, techniciansAPI, sparePartsAPI } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const SimulationLabPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // New Scenario Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioType, setScenarioType] = useState('TECHNICIAN_DROPOUT');
  const [creating, setCreating] = useState(false);

  // Lists for event builders
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechId, setSelectedTechId] = useState('');

  useEffect(() => {
    loadScenarios();
    loadTechs();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await simulationAPI.list();
      setScenarios(data);
      if (data.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(data[0].id);
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
      if (t.length > 0) setSelectedTechId(t[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSimulation = async (scenarioId: string) => {
    setRunning(true);
    try {
      const result = await simulationAPI.run(scenarioId);
      setSimulationResult(result);
    } catch (err: any) {
      alert('Simulation error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setRunning(false);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const events: any[] = [];
      if (scenarioType === 'TECHNICIAN_DROPOUT' && selectedTechId) {
        events.push({
          event_type: 'TECHNICIAN_UNAVAILABLE',
          target_entity_type: 'TECHNICIAN',
          target_entity_id: selectedTechId,
          description: 'Simulated sudden field dropout of key technician',
        });
      } else if (scenarioType === 'TRAVEL_DELAY') {
        events.push({
          event_type: 'TRAVEL_DELAY',
          target_entity_type: 'OTHER',
          event_data: { delay_minutes: 60 },
          description: 'Simulated 60-minute regional highway gridlock',
        });
      }

      await simulationAPI.create({
        name,
        description,
        scenario_type: scenarioType,
        events,
      });

      alert('Simulation scenario created!');
      setShowCreateModal(false);
      setName('');
      setDescription('');
      loadScenarios();
    } catch (err: any) {
      alert('Error creating scenario: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCreating(false);
    }
  };

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
            Simulation Lab — Counterfactual "What-If" Analysis
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Simulate operational disruptions without altering live production state
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          + Create Simulation Scenario
        </button>
      </div>

      {/* Scenarios Carousel / Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {scenarios.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <div
              key={scen.id}
              onClick={() => {
                setSelectedScenarioId(scen.id);
                setSimulationResult(null);
              }}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? '#06b6d4' : 'var(--border-subtle)',
                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>
                  {scen.scenario_type.replace(/_/g, ' ')}
                </span>
                <StatusBadge status={scen.status} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                {scen.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {scen.description}
              </p>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 10 }}>
                Events: {scen.events?.length || 0} configured
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Banner */}
      {activeScenario && (
        <div
          className="card"
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Active Scenario: {activeScenario.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Type: {activeScenario.scenario_type} • Status: {activeScenario.status}
            </p>
          </div>
          <button
            onClick={() => handleRunSimulation(activeScenario.id)}
            disabled={running}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            {running ? 'Running Monte Carlo Matrix...' : '▶ Execute Isolated Simulation'}
          </button>
        </div>
      )}

      {/* Simulation Results: CURRENT STATE vs SIMULATED STATE */}
      {simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* CURRENT STATE */}
            <div
              className="card"
              style={{
                borderLeft: '4px solid #10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.03)',
              }}
            >
              <div className="card-header">
                <span className="card-title" style={{ color: '#10b981' }}>
                  🟢 Current Production State
                </span>
                <span className="badge badge-success">Live Baseline</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Active Work Orders</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                    {simulationResult.current_state?.total_active_jobs}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Available Technicians</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                    {simulationResult.current_state?.available_technicians}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active Dispatches</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                    {simulationResult.current_state?.total_assigned_jobs}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Average Team Workload</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                    {simulationResult.current_state?.average_workload} jobs
                  </div>
                </div>
              </div>
            </div>

            {/* SIMULATED STATE */}
            <div
              className="card"
              style={{
                borderLeft: '4px solid #f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.03)',
              }}
            >
              <div className="card-header">
                <span className="card-title" style={{ color: '#fbbf24' }}>
                  🟡 Counterfactual Simulated State
                </span>
                <span className="badge badge-warning">Simulated Outcome</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Disrupted Assignments</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
                    {simulationResult.simulated_state?.disrupted_assignments}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Simulated Available Techs</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                    {simulationResult.simulated_state?.simulated_available_technicians}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contractual SLA Impact</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
                    {simulationResult.simulated_state?.simulated_sla_risk_increase}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Impacted Job Orders</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                    {simulationResult.impact_analysis?.impacted_jobs_count}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Analysis & Conflicts */}
          <div className="card">
            <h3 className="card-title">Disruption Analysis & Resource Conflicts</h3>
            <div style={{ marginTop: 12 }}>
              {simulationResult.impact_analysis?.conflicts?.map((conf: string, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 6,
                    color: '#f87171',
                    fontSize: '0.88rem',
                    marginBottom: 8,
                  }}
                >
                  ⚠️ {conf}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Counterfactual Recovery Plans */}
          <div className="card">
            <h3 className="card-title" style={{ color: '#38bdf8' }}>
              🧠 Pre-Simulated Autonomous Recovery Recommendations
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
              Action plan ready for dispatcher execution if this counterfactual event materializes
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {simulationResult.recommended_recovery_plans?.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700 }}>
                      {rec.strategy}
                    </span>
                    <span className="badge badge-success">Match: {rec.simulated_score}%</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
                    {rec.job_code} ➔ {rec.proposed_technician}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', gap: 14 }}>
                    <span>⏱ Est. Delay: +{rec.simulated_delay_minutes}m</span>
                    <span>🛡 SLA Outlook: {rec.sla_outlook}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-header">
              <span className="card-title">New Counterfactual Scenario</span>
              <button onClick={() => setShowCreateModal(false)} style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateScenario}>
              <div className="form-group">
                <label className="form-label">Scenario Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blizzard Transit Failure"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Disruption Type</label>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  className="form-select"
                >
                  <option value="TECHNICIAN_DROPOUT">TECHNICIAN DROPOUT</option>
                  <option value="PART_SHORTAGE">PART SHORTAGE</option>
                  <option value="TRAVEL_DELAY">TRAVEL DELAY</option>
                  <option value="SLA_DELAY">SLA DELAY</option>
                  <option value="MULTIPLE_FAILURES">MULTIPLE FAILURES</option>
                </select>
              </div>

              {scenarioType === 'TECHNICIAN_DROPOUT' && (
                <div className="form-group">
                  <label className="form-label">Target Technician to Drop Out</label>
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="form-select"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.employee_code} — {t.user_name} ({t.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Operational Hypothesis</label>
                <textarea
                  rows={3}
                  placeholder="Hypothesis on cascading impacts on customer SLA..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Saving...' : 'Create Scenario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
