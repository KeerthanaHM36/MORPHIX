import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceRequestsAPI, machinesAPI, sitesAPI, skillsAPI, sparePartsAPI } from '../services/api';
import { ServiceRequest, Machine, Site, Skill, SparePart } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);

  // Form State
  const [requestCode, setRequestCode] = useState(`SR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [machineId, setMachineId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestType, setRequestType] = useState('CORRECTIVE');
  const [priority, setPriority] = useState('HIGH');
  const [duration, setDuration] = useState('120');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillProficiency, setSkillProficiency] = useState(3);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, priorityFilter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await serviceRequestsAPI.list({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    setShowModal(true);
    try {
      const [m, s, sk, p] = await Promise.all([
        machinesAPI.list(),
        sitesAPI.list(),
        skillsAPI.list(),
        sparePartsAPI.list(),
      ]);
      setMachines(m);
      setSites(s);
      setAvailableSkills(sk);
      setAvailableParts(p);
      if (m.length > 0) setMachineId(m[0].id);
      if (s.length > 0) setSiteId(s[0].id);
      if (sk.length > 0) setSelectedSkillId(sk[0].id);
      if (p.length > 0) setSelectedPartId(p[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await serviceRequestsAPI.create({
        request_code: requestCode,
        machine_id: machineId,
        site_id: siteId,
        title,
        description,
        request_type: requestType,
        priority,
        estimated_duration_minutes: parseInt(duration),
        required_skills: selectedSkillId
          ? [{ skill_id: selectedSkillId, minimum_proficiency: skillProficiency, is_required: true }]
          : [],
        required_parts: selectedPartId
          ? [{ spare_part_id: selectedPartId, required_quantity: partQty, is_required: true }]
          : [],
      });
      alert('Service Request registered successfully! Telemetry validated.');
      setShowModal(false);
      loadRequests();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>Service Requests Lifecycle</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Multi-stage work order tracking, skill certification matching & SLA monitoring
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          + New Service Request
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: 180, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: 4 }}>Priority Filter</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: 180, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Request Title & Issue</th>
                <th>Equipment</th>
                <th>Site Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA Timeframe</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                    Loading service records...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                    No matching service requests found
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {r.request_code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{r.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{r.machine_name}</td>
                    <td style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{r.site_name}</td>
                    <td>
                      <StatusBadge status={r.priority} type="priority" />
                    </td>
                    <td>
                      <StatusBadge status={r.status} type="status" />
                    </td>
                    <td>
                      <StatusBadge status={r.sla_status || 'SAFE'} type="sla" />
                      {r.sla_remaining_minutes !== undefined && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                          {r.sla_remaining_minutes > 0 ? `${r.sla_remaining_minutes} min remaining` : 'Breached'}
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/service-requests/${r.id}`} className="btn btn-secondary btn-sm">
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
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
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-medium)',
            }}
          >
            <div className="card-header">
              <span className="card-title">Create Industrial Service Work Order</span>
              <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Request Identifier Code</label>
                  <input
                    type="text"
                    value={requestCode}
                    onChange={(e) => setRequestCode(e.target.value)}
                    className="form-input font-mono"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-select"
                  >
                    <option value="CRITICAL">CRITICAL (4 hr SLA)</option>
                    <option value="HIGH">HIGH (12 hr SLA)</option>
                    <option value="MEDIUM">MEDIUM (24 hr SLA)</option>
                    <option value="LOW">LOW (48 hr SLA)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Target Equipment (Machine)</label>
                  <select
                    value={machineId}
                    onChange={(e) => {
                      setMachineId(e.target.value);
                      const m = machines.find((mac) => mac.id === e.target.value);
                      if (m) setSiteId(m.site_id);
                    }}
                    className="form-select"
                    required
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.machine_code} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Site Complex</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="form-select"
                    required
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Work Order Title</label>
                <input
                  type="text"
                  placeholder="e.g. M-104 Hydraulic Pressure Failure"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Problem Description & Symptoms</label>
                <textarea
                  rows={3}
                  placeholder="Detailed telemetry anomalies, cavitation noise, pressure loss..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="form-select"
                  >
                    <option value="CORRECTIVE">CORRECTIVE</option>
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="form-input"
                    min={15}
                  />
                </div>
              </div>

              {/* Required Skills & Parts Sub-Selectors */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: 8 }}>
                  Required Skill Competency & Spare Parts Specification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">(Optional Skill Requirement)</option>
                    {availableSkills.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={skillProficiency}
                    onChange={(e) => setSkillProficiency(parseInt(e.target.value))}
                    className="form-select"
                  >
                    <option value={1}>Proficiency 1/5</option>
                    <option value={2}>Proficiency 2/5</option>
                    <option value={3}>Proficiency 3/5</option>
                    <option value={4}>Proficiency 4/5</option>
                    <option value={5}>Master (5/5)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">(Optional Spare Part Requirement)</option>
                    {availableParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.part_code} — {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={partQty}
                    onChange={(e) => setPartQty(parseInt(e.target.value))}
                    className="form-input"
                    placeholder="Qty"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Registering...' : 'Submit Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
