import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentsAPI, tasksAPI, evidenceAPI, serviceRequestsAPI } from '../services/api';
import { Assignment, ServiceTask, ServiceEvidence } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const TechnicianPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Evidence upload
  const [evidenceType, setEvidenceType] = useState('PHOTO');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTechnicianJobs();
  }, []);

  const loadTechnicianJobs = async () => {
    setLoading(true);
    try {
      const data = await assignmentsAPI.list();
      setAssignments(data);
      if (data.length > 0) {
        selectAssignment(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectAssignment = async (assgn: Assignment) => {
    setActiveAssignment(assgn);
    try {
      const taskList = await tasksAPI.list({ assignment_id: assgn.id });
      setTasks(taskList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartService = async () => {
    if (!activeAssignment) return;
    try {
      await assignmentsAPI.update(activeAssignment.id, { assignment_status: 'IN_PROGRESS' });
      alert('Service Started! Status updated to IN_PROGRESS.');
      loadTechnicianJobs();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCompleteService = async () => {
    if (!activeAssignment) return;
    try {
      await assignmentsAPI.update(activeAssignment.id, { assignment_status: 'COMPLETED' });
      alert('Service Completed! Work order ready for manager verification.');
      loadTechnicianJobs();
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
      alert('Evidence uploaded successfully!');
      setEvidenceDesc('');
      setSelectedFile(null);
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
            Field Technician Workspace
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Operator: {user?.name} ({user?.email}) • Active Industrial Dispatches
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column: Assigned Work Orders */}
        <div className="card">
          <h3 className="card-title">Assigned Field Jobs ({assignments.length})</h3>
          {loading ? (
            <div style={{ padding: 20, color: '#94a3b8' }}>Loading dispatches...</div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: 30, color: '#64748b', textAlign: 'center' }}>
              No active job assignments for your profile.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {assignments.map((a) => {
                const isSelected = activeAssignment?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => selectAssignment(a)}
                    style={{
                      padding: 14,
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-surface-elevated)',
                      border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {a.request_code}
                      </span>
                      <StatusBadge status={a.assignment_status} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc', marginBottom: 4 }}>
                      {a.request_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Scheduled: {a.scheduled_start ? new Date(a.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Execution Workspace */}
        {activeAssignment ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Action Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <span className="font-mono" style={{ fontSize: '0.85rem', color: '#06b6d4' }}>
                    {activeAssignment.request_code}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                    {activeAssignment.request_title}
                  </h2>
                </div>
                <StatusBadge status={activeAssignment.assignment_status} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {activeAssignment.assignment_status === 'ASSIGNED' && (
                  <button onClick={handleStartService} className="btn btn-primary" style={{ flex: 1 }}>
                    ▶ Start Service Execution
                  </button>
                )}
                {activeAssignment.assignment_status === 'IN_PROGRESS' && (
                  <button onClick={handleCompleteService} className="btn btn-primary" style={{ flex: 1 }}>
                    ✓ Mark Service Completed
                  </button>
                )}
              </div>
            </div>

            {/* Checklist Tasks */}
            <div className="card">
              <h3 className="card-title">Step-by-Step Execution Protocol</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>
                Click steps as you complete lockout/tagout, component swap, and validation
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskToggle(task)}
                    style={{
                      padding: 12,
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        Step {task.sequence_number}: {task.task_name}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Proof */}
            <div className="card">
              <h3 className="card-title">Upload Proof of Completion Evidence</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 14 }}>
                Attach diagnostic photos, pressure gauge readings, or vibration reports
              </p>
              <form onSubmit={handleUploadEvidence}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 12 }}>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    className="form-select"
                  >
                    <option value="PHOTO">PHOTO</option>
                    <option value="REPORT">REPORT</option>
                    <option value="DOCUMENT">DOCUMENT</option>
                    <option value="NOTE">NOTE</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Describe evidence (e.g. 320 bar holding test photo)"
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: '0.85rem', color: '#94a3b8' }}
                  />
                </div>
                <button type="submit" disabled={uploading} className="btn btn-secondary">
                  {uploading ? 'Uploading Evidence...' : 'Submit Verification Evidence'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 50, color: '#64748b' }}>
            Select an assignment on the left to start execution protocol.
          </div>
        )}
      </div>
    </div>
  );
};
