import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { serviceRequestsAPI, assignmentsAPI, tasksAPI, evidenceAPI } from '../services/api';
import { ServiceRequest, Assignment, ServiceTask, ServiceEvidence } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export const ServiceRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [evidenceList, setEvidenceList] = useState<ServiceEvidence[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [approving, setApproving] = useState(false);

  // Evidence upload form state
  const [evidenceType, setEvidenceType] = useState('PHOTO');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequestData();
    }
  }, [id]);

  const loadRequestData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [reqData, assgnData, tasksData, evidData] = await Promise.all([
        serviceRequestsAPI.get(id),
        assignmentsAPI.list({ service_request_id: id }),
        tasksAPI.list({ service_request_id: id }),
        evidenceAPI.list({ service_request_id: id }),
      ]);
      setRequest(reqData);
      setAssignment(assgnData.length > 0 ? assgnData[0] : null);
      setTasks(tasksData);
      setEvidenceList(evidData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    try {
      await serviceRequestsAPI.approve(id);
      alert('Service Request Approved! Ready for technician matching & dispatch.');
      loadRequestData();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setApproving(false);
    }
  };

  const handleFindTechnicians = async () => {
    if (!id) return;
    setMatching(true);
    try {
      const results = await assignmentsAPI.match(id);
      setCandidates(results);
    } catch (err: any) {
      alert('Error finding technicians: ' + (err.response?.data?.detail || err.message));
    } finally {
      setMatching(false);
    }
  };

  const handleDispatch = async (techId: string, score: number, dist: number) => {
    if (!id) return;
    setDispatching(true);
    try {
      await assignmentsAPI.create({
        service_request_id: id,
        technician_id: techId,
        assignment_score: score,
        travel_distance_km: dist,
        travel_duration_minutes: Math.round(dist * 1.5) || 15,
      });
      alert('Technician Dispatched! Notification sent and service tasks initialized.');
      setCandidates([]);
      loadRequestData();
    } catch (err: any) {
      alert('Dispatch failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDispatching(false);
    }
  };

  const handleTaskStatusToggle = async (task: ServiceTask) => {
    const nextStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
    try {
      await tasksAPI.update(task.id, { status: nextStatus });
      loadRequestData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('service_request_id', id);
      formData.append('evidence_type', evidenceType);
      if (evidenceDesc) formData.append('description', evidenceDesc);
      if (assignment) formData.append('assignment_id', assignment.id);
      if (selectedFile) formData.append('file', selectedFile);

      await evidenceAPI.upload(formData);
      alert('Completion Evidence uploaded successfully!');
      setEvidenceDesc('');
      setSelectedFile(null);
      loadRequestData();
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyEvidence = async (evidenceId: string, approve: boolean) => {
    try {
      await evidenceAPI.verify(evidenceId, approve, approve ? 'Approved by Manager' : 'Rejected - insufficient proof');
      alert(`Evidence ${approve ? 'Approved! Work order marked COMPLETED' : 'Rejected'}.`);
      loadRequestData();
    } catch (err: any) {
      alert('Error verifying evidence: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading || !request) {
    return <div style={{ padding: 40, color: '#94a3b8' }}>Loading Service Request Data...</div>;
  }

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
              {request.request_code}
            </span>
            <StatusBadge status={request.priority} type="priority" />
            <StatusBadge status={request.status} type="status" />
            <StatusBadge status={request.sla_status || 'SAFE'} type="sla" />
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a' }}>{request.title}</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 4 }}>
            Located at {request.site_name} • Machine: {request.machine_name} ({request.machine_code})
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {request.status === 'OPEN' && (
            <button onClick={handleApprove} disabled={approving} className="btn btn-primary">
              {approving ? 'Approving...' : '✓ Approve Request'}
            </button>
          )}
          <Link to="/service-requests" className="btn btn-secondary">
            ← Back to List
          </Link>
        </div>
      </div>

      {/* Grid: Request Overview & Dispatcher Intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24, marginBottom: 24 }}>
        {/* Left Column: Diagnostics & Requirements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title" style={{ color: '#0f172a' }}>Telemetry & Problem Analysis</h3>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, marginTop: 8 }}>
              {request.description || 'No diagnostic telemetry description recorded.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Request Type</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginTop: 2 }}>{request.request_type}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Est. Duration</span>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', marginTop: 2 }}>{request.estimated_duration_minutes || 120} minutes</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>SLA Deadline</span>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#d97706', marginTop: 2 }}>
                  {request.sla_deadline ? new Date(request.sla_deadline).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Required Skills & Parts */}
          <div className="card">
            <h3 className="card-title" style={{ color: '#0f172a' }}>Technical Competency & Part Demands</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <h4 style={{ fontSize: '0.82rem', color: '#0284c7', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
                  Required Skills
                </h4>
                {request.required_skills && request.required_skills.length > 0 ? (
                  request.required_skills.map((sk) => (
                    <div
                      key={sk.skill_id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#0f172a',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{sk.skill_name}</span>
                      <span className="font-mono" style={{ color: '#0284c7' }}>Min Level: {sk.minimum_proficiency}/5</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Standard electro-mechanical skills</div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.82rem', color: '#0284c7', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
                  Specified Spare Parts
                </h4>
                {request.required_parts && request.required_parts.length > 0 ? (
                  request.required_parts.map((p) => (
                    <div
                      key={p.spare_part_id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#0f172a',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.part_name}</div>
                        <span className="font-mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.part_code}</span>
                      </div>
                      <span className="font-mono" style={{ color: '#059669', fontWeight: 600 }}>Qty: {p.required_quantity}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No spare parts specified</div>
                )}
              </div>
            </div>
          </div>

          {/* Service Tasks */}
          <div className="card">
            <h3 className="card-title" style={{ color: '#0f172a' }}>Execution Tasks Protocol</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 12 }}>
              Click any step to advance execution lifecycle (Pending → In Progress → Completed)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskStatusToggle(task)}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                        Step {task.sequence_number}: {task.task_name}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{task.description}</div>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#64748b', padding: 12 }}>
                  Tasks initialize automatically upon technician dispatch.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch & AI Matching / Active Assignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Assignment Card if assigned */}
          {assignment ? (
            <div
              className="card"
              style={{
                backgroundColor: '#f0fdf4',
                borderColor: '#86efac',
              }}
            >
              <div className="card-header">
                <span className="card-title" style={{ color: '#059669' }}>
                  👷 Active Dispatch Assignment
                </span>
                <StatusBadge status={assignment.assignment_status} />
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {assignment.technician_name} ({assignment.technician_code})
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 14 }}>
                Assigned at {new Date(assignment.assigned_at).toLocaleString()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                <div>⏱ Scheduled: {assignment.scheduled_start ? new Date(assignment.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate'}</div>
                <div>🚗 Distance: {assignment.travel_distance_km || 0} km</div>
                <div>🎯 Match Score: {assignment.assignment_score || 95}%</div>
              </div>
            </div>
          ) : (
            /* Dispatch Matcher Box */
            <div className="card">
              <div className="card-header">
                <div>
                  <span className="card-title" style={{ color: '#0f172a' }}>🎯 AI Technician Matching Engine</span>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Multi-objective constraint ranking: Skill (30%), Exp (20%), GPS (20%), Availability (15%), Workload (15%)
                  </p>
                </div>
              </div>

              <button
                onClick={handleFindTechnicians}
                disabled={matching}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: 16 }}
              >
                {matching ? 'Calculating Skill & GPS Matrix...' : '🔍 Find Qualified Technicians'}
              </button>

              {candidates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {candidates.slice(0, 4).map((c) => (
                    <div
                      key={c.technician_id}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: 8,
                        border: c.is_eligible ? '1px solid #86efac' : '1px solid #fca5a5',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {c.name} ({c.employee_code})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.specialization}</div>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: c.is_eligible ? '#059669' : '#dc2626',
                          }}
                        >
                          {c.match_score}%
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '6px 0' }}>
                        Distance: {c.estimated_distance_km}km • Workload: {c.current_workload}/{c.max_daily_jobs}
                      </div>

                      {c.is_eligible ? (
                        <button
                          onClick={() => handleDispatch(c.technician_id, c.match_score, c.estimated_distance_km)}
                          disabled={dispatching}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', marginTop: 6 }}
                        >
                          {dispatching ? 'Dispatching...' : 'Dispatch Technician'}
                        </button>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>
                          Ineligible: {c.ineligibility_reasons.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completion Proof & Evidence */}
          <div className="card">
            <h3 className="card-title" style={{ color: '#0f172a' }}>Completion Verification & Proof</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14 }}>
              Uploaded telemetry, photos, and inspection signoffs
            </p>

            {/* List Evidence */}
            {evidenceList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {evidenceList.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      padding: 12,
                      backgroundColor: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#0284c7' }}>{e.evidence_type}</span>
                      <StatusBadge status={e.is_verified ? 'COMPLETED' : 'PENDING'} />
                    </div>
                    {e.description && <div style={{ fontSize: '0.82rem', color: '#0f172a', marginBottom: 4 }}>{e.description}</div>}
                    {e.file_url && (
                      <div style={{ fontSize: '0.75rem', color: '#0284c7', marginBottom: 6 }}>
                        <a href={e.file_url} target="_blank" rel="noreferrer">
                          📄 View Attached File Document
                        </a>
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Uploaded by {e.uploader_name} on {new Date(e.uploaded_at).toLocaleString()}
                    </div>

                    {!e.is_verified && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button onClick={() => handleVerifyEvidence(e.id, true)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                          ✓ Approve Proof
                        </button>
                        <button onClick={() => handleVerifyEvidence(e.id, false)} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 14 }}>
                No verification evidence uploaded yet.
              </div>
            )}

            {/* Evidence Uploader Form */}
            <form onSubmit={handleUploadEvidence} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                Upload Service Evidence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
                <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="form-select">
                  <option value="PHOTO">PHOTO</option>
                  <option value="REPORT">REPORT</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                  <option value="NOTE">NOTE</option>
                </select>
                <input
                  type="text"
                  placeholder="Evidence notes/description"
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="form-input"
                />
              </div>
              <div style={{ marginBottom: 10 }}>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  style={{ fontSize: '0.8rem', color: '#64748b' }}
                />
              </div>
              <button type="submit" disabled={uploading} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                {uploading ? 'Uploading...' : 'Upload Evidence'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
