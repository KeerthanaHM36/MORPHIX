import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentsAPI, tasksAPI, evidenceAPI, techniciansAPI } from '../services/api';
import { Assignment, ServiceTask, Technician } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { InteractiveLiveMap } from '../components/InteractiveLiveMap';
import { Link } from 'react-router-dom';

export const TechnicianPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Evidence upload
  const [evidenceType, setEvidenceType] = useState('PHOTO');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTechniciansRoster();
  }, []);

  useEffect(() => {
    if (selectedTechId) {
      loadTechnicianJobs(selectedTechId);
    }
  }, [selectedTechId]);

  const loadTechniciansRoster = async () => {
    try {
      const roster = await techniciansAPI.list();
      setAllTechnicians(roster);

      // Default to matching technician by email/user_id, or default to T1/T2
      const matched = roster.find((t) => t.user_id === user?.id) || roster.find((t) => t.employee_code === 'T1') || roster[0];
      if (matched) {
        setSelectedTechId(matched.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTechnicianJobs = async (techId: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const data = await techniciansAPI.getMyAssignments(techId);
      setAssignments(data);
      if (data.length > 0) {
        selectAssignment(data[0]);
      } else {
        setActiveAssignment(null);
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectAssignment = async (assgn: any) => {
    setActiveAssignment(assgn);
    try {
      const taskList = await tasksAPI.list({ assignment_id: assgn.id });
      setTasks(taskList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAllocation = async (assgnId: string) => {
    try {
      const res = await assignmentsAPI.accept(assgnId);
      setActionMessage(`✓ ${res.message}`);
      await loadTechnicianJobs(selectedTechId);
    } catch (err: any) {
      alert('Error accepting: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRejectAllocation = async (assgnId: string) => {
    const reason = prompt('Please enter reason for rejecting allocation (e.g. Vehicle breakdown, emergency, schedule conflict):', 'Transport delay / urgent equipment conflict');
    if (reason === null) return; // User canceled prompt

    try {
      const res = await assignmentsAPI.reject(assgnId, reason);
      setActionMessage(`⚡ ${res.message}`);
      await loadTechnicianJobs(selectedTechId);
    } catch (err: any) {
      alert('Error rejecting: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleStartService = async () => {
    if (!activeAssignment) return;
    try {
      await assignmentsAPI.update(activeAssignment.id, { assignment_status: 'IN_PROGRESS' });
      setActionMessage('Service started. Status updated to IN_PROGRESS.');
      loadTechnicianJobs(selectedTechId);
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCompleteService = async () => {
    if (!activeAssignment) return;
    try {
      await assignmentsAPI.update(activeAssignment.id, { assignment_status: 'COMPLETED' });
      setActionMessage('✓ Work Order Completed! Your status is restored to AVAILABLE for new assignments.');
      loadTechnicianJobs(selectedTechId);
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleTaskToggle = async (task: ServiceTask) => {
    const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
    try {
      await tasksAPI.update(task.id, { status: nextStatus });
      if (activeAssignment) selectAssignment(activeAssignment);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('service_request_id', activeAssignment.service_request_id);
      formData.append('assignment_id', activeAssignment.id);
      formData.append('evidence_type', evidenceType);
      if (evidenceDesc) formData.append('description', evidenceDesc);
      if (selectedFile) formData.append('file', selectedFile);

      await evidenceAPI.upload(formData);
      setActionMessage('Evidence photo/report uploaded successfully!');
      setEvidenceDesc('');
      setSelectedFile(null);
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const currentTech = allTechnicians.find((t) => t.id === selectedTechId);

  return (
    <div className="page-wrapper">
      {/* Top Banner & Quick Switcher */}
      <div
        className="card"
        style={{
          padding: '24px 32px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>👷‍♂️</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              Field Technician Command Portal
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: currentTech?.availability_status === 'AVAILABLE' ? '#ecfdf5' : '#fefce8',
                color: currentTech?.availability_status === 'AVAILABLE' ? '#059669' : '#d97706',
                padding: '4px 10px',
                borderRadius: '999px',
                border: currentTech?.availability_status === 'AVAILABLE' ? '1px solid #a7f3d0' : '1px solid #fde68a',
              }}
            >
              Status: {currentTech?.availability_status || 'AVAILABLE'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Review incoming AI service allocations. Accept to proceed with repairs or reject to automatically trigger AI reallocation to the next specialist.
          </p>
        </div>

        {/* Quick Technician Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Switch Technician Profile:
          </label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="form-select"
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {allTechnicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user_name || t.employee_code} ({t.employee_code}) — {t.specialization || 'Tech'} [{t.availability_status}]
              </option>
            ))}
          </select>

          <Link
            to="/customer-portal"
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '12px',
              textDecoration: 'none',
              padding: '6px 12px',
            }}
          >
            🛠️ Request Service
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '14px 18px',
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            borderRadius: '10px',
            color: '#1d4ed8',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Grid: Dispatches List (Left) & Active Job / Map (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Left Column: Assigned Jobs */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              My Dispatches ({assignments.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {currentTech?.employee_code}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', color: '#64748b', textAlign: 'center' }}>Loading allocated jobs...</div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>☕</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>No Active Dispatches</div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                You are currently free and available for new AI allocations.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assignments.map((a) => {
                const isSelected = activeAssignment?.id === a.id;
                const isPending = a.assignment_status === 'ASSIGNED';
                return (
                  <div
                    key={a.id}
                    onClick={() => selectAssignment(a)}
                    style={{
                      padding: '14px',
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      border: isPending
                        ? '1px solid #f59e0b'
                        : isSelected
                        ? '1px solid #2563eb'
                        : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#0284c7', fontSize: '13px' }}>
                        {a.request_code}
                      </span>
                      <StatusBadge status={a.assignment_status} />
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>
                      {a.request_title}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Machine: <b style={{ color: '#334155' }}>{a.machine_name}</b></span>
                      <span>{a.travel_distance_km ? `${a.travel_distance_km.toFixed(1)} km` : ''}</span>
                    </div>

                    {isPending && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#b45309',
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        ⚠️ Awaiting Your Confirmation
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Job Details, Decision Card & Live Map */}
        {activeAssignment ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* INCOMING AI ALLOCATION DECISION CARD (If status === 'ASSIGNED') */}
            {activeAssignment.assignment_status === 'ASSIGNED' && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '2px solid #f59e0b',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: '#f59e0b',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      Incoming AI Allocation
                    </span>
                    <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                      {activeAssignment.request_title}
                    </h2>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>AI Match Score</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>
                      {activeAssignment.assignment_score?.toFixed(1) || '92.0'}%
                    </div>
                  </div>
                </div>

                <p style={{ color: '#334155', fontSize: '14px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {activeAssignment.request_description || 'Customer requested emergency diagnostic and repair for industrial equipment.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>ASSET</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {activeAssignment.machine_name} ({activeAssignment.machine_code})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>PLANT LOCATION</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                      {activeAssignment.site_name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>PROXIMITY</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                      {activeAssignment.travel_distance_km ? `${activeAssignment.travel_distance_km.toFixed(1)} km away` : 'On-Site'}
                    </div>
                  </div>
                </div>

                {/* THE TWO CORE DECISION BUTTONS */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={() => handleAcceptAllocation(activeAssignment.id)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <span>✓</span> Accept Service Request
                  </button>

                  <button
                    onClick={() => handleRejectAllocation(activeAssignment.id)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <span>✕</span> Reject (Auto-Reallocate via AI)
                  </button>
                </div>
              </div>
            )}

            {/* LIVE LOCATION MAP */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  🗺️ Interactive Dispatch Map & Route
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {activeAssignment.site_name}
                </span>
              </div>

              <InteractiveLiveMap
                siteLat={activeAssignment.site_lat || 42.3314}
                siteLng={activeAssignment.site_lng || -83.0458}
                siteName={activeAssignment.site_name || 'Customer Site'}
                siteAddress={activeAssignment.site_address}
                machineName={activeAssignment.machine_name || 'Machine'}
                machineCode={activeAssignment.machine_code}
                techLat={activeAssignment.technician_lat}
                techLng={activeAssignment.technician_lng}
                techName={activeAssignment.technician_name}
                techCode={activeAssignment.technician_code}
                distanceKm={activeAssignment.travel_distance_km}
                status={activeAssignment.assignment_status}
                height="320px"
              />
            </div>

            {/* SERVICE EXECUTION PROTOCOL & CHECKLIST (If ACCEPTED, CONFIRMED, or IN_PROGRESS) */}
            {activeAssignment.assignment_status !== 'ASSIGNED' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                      Standard Execution Checklist
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Step-by-step verified industrial protocol
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {activeAssignment.assignment_status !== 'IN_PROGRESS' && activeAssignment.assignment_status !== 'COMPLETED' && (
                      <button
                        onClick={handleStartService}
                        className="btn btn-primary btn-sm"
                      >
                        Start Service
                      </button>
                    )}

                    {activeAssignment.assignment_status !== 'COMPLETED' && (
                      <button
                        onClick={handleCompleteService}
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                      >
                        ✓ Mark Completed
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {tasks.map((task, idx) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskToggle(task)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'COMPLETED'}
                        readOnly
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1, fontSize: '13px', color: task.status === 'COMPLETED' ? '#94a3b8' : '#0f172a', textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                        <b>Step {idx + 1}:</b> {task.task_name}
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>

                {/* Evidence Photo Upload */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#0f172a' }}>
                    Upload Completion Evidence (Photo / Diagnostic Telemetry)
                  </h4>
                  <form onSubmit={handleUploadEvidence} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                      className="form-select"
                      style={{ width: 'auto' }}
                    >
                      <option value="PHOTO">Photo Proof</option>
                      <option value="REPORT">Diagnostic Report</option>
                      <option value="DOCUMENT">Customer Signoff</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Evidence description..."
                      value={evidenceDesc}
                      onChange={(e) => setEvidenceDesc(e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />

                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      style={{ fontSize: '12px', color: '#64748b', padding: '6px 0' }}
                    />

                    <button
                      type="submit"
                      disabled={uploading}
                      className="btn btn-secondary btn-sm"
                    >
                      {uploading ? 'Uploading...' : 'Submit Evidence'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔧</div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>Select an Assignment to Inspect</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
              Choose a work order from the left list to review problem details, accept or reject the AI allocation, and track live location.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
