import React, { useState, useEffect } from 'react';
import { machinesAPI, serviceRequestsAPI, skillsAPI } from '../services/api';
import { Machine, Skill, ServiceRequestTrackingResponse } from '../types';
import { InteractiveLiveMap } from '../components/InteractiveLiveMap';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export const CustomerServicePortalPage: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [title, setTitle] = useState<string>('Hydraulic Pressure Drop & Valve Leakage');
  const [description, setDescription] = useState<string>('Stamping press hydraulic system exhibits sudden pressure oscillation below operating threshold of 210 bar.');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trackingData, setTrackingData] = useState<ServiceRequestTrackingResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [machinesList, skillsList] = await Promise.all([
        machinesAPI.list(),
        skillsAPI.list(),
      ]);
      setMachines(machinesList);
      setSkills(skillsList);

      if (machinesList.length > 0) {
        setSelectedMachineId(machinesList[0].id);
      }
      if (skillsList.length > 0) {
        // Find hydraulic or first skill
        const defaultSkill = skillsList.find((s) => s.name.toLowerCase().includes('hydraulic')) || skillsList[0];
        setSelectedSkillId(defaultSkill.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load machine catalog or skills.');
    }
  };

  const handleQuickIssue = (presetTitle: string, presetDesc: string, skillKeyword: string, priorityVal: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    setTitle(presetTitle);
    setDescription(presetDesc);
    setPriority(priorityVal);
    const matched = skills.find((s) => s.name.toLowerCase().includes(skillKeyword.toLowerCase()));
    if (matched) setSelectedSkillId(matched.id);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineId) {
      alert('Please select an industrial machine');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await serviceRequestsAPI.createCustomerRequest({
        machine_id: selectedMachineId,
        title,
        description,
        priority,
        skill_id: selectedSkillId || undefined,
        minimum_proficiency: 3,
      });

      setTrackingData(response);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Error creating service request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshTracking = async () => {
    if (!trackingData?.service_request?.id) return;
    try {
      const updated = await serviceRequestsAPI.getTracking(trackingData.service_request.id);
      setTrackingData(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div
        className="card"
        style={{
          padding: '24px 32px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Customer Machine Service Portal
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#e0f2fe',
                color: '#0284c7',
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid #bae6fd',
              }}
            >
              AI Auto-Allocation
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', maxWidth: '750px' }}>
            Select your machine and describe the issue. Our AI matching model calculates skill mastery, technician GPS distance, availability, and workload to automatically dispatch the optimal specialist with zero conflict.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/technician-portal"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <span>👷‍♂️</span> Open Technician Portal (Review Dispatches)
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* Main Grid: Request Form (Left) & AI Allocation Tracking (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: trackingData ? '1fr 1.35fr' : '1fr', gap: '28px' }}>
        {/* Left Column: Simple User-Friendly Service Request Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Request Machine Maintenance
            </h2>
          </div>

          {/* Quick-Fill Presets */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              Quick-Fill Common Industrial Issues:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() =>
                  handleQuickIssue(
                    'Hydraulic Pressure Loss & Valve Leakage',
                    'Main cylinder pressure drop below 210 bar threshold. Suspected proportional valve seal rupture.',
                    'Hydraulic',
                    'CRITICAL'
                  )
                }
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0284c7',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🔧 Hydraulic Failure
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickIssue(
                    'PLC Comm Fault & Safety Interlock Failure',
                    'Safety bus communication interrupted on Siemens S7-1500 rack. E-stop circuit open.',
                    'PLC',
                    'HIGH'
                  )
                }
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#7c3aed',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                💻 PLC & Automation
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickIssue(
                    'Spindle Bearing Overheating & Vibration Spike',
                    'High-frequency harmonic vibrations on spindle bearings during high-speed roughing pass.',
                    'Vibration',
                    'HIGH'
                  )
                }
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#d97706',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                📊 Vibration & Bearings
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickIssue(
                    'Robotic Kinematic Servo Calibration Error',
                    '6-axis articulated robot joint 4 servo motor encoder feedback discrepancy exceeding 0.2mm.',
                    'Robotics',
                    'MEDIUM'
                  )
                }
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#059669',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                🤖 Robotics Servo Error
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmitRequest}>
            {/* Machine Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Select Industrial Machine:
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="form-select"
                required
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machine_code}) — {m.machine_type || 'Industrial Asset'}
                  </option>
                ))}
              </select>

              {selectedMachine && (
                <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Site Location: <b style={{ color: '#0f172a' }}>{selectedMachine.site_name || 'Manufacturing Complex'}</b></span>
                    <span>Status: <StatusBadge status={selectedMachine.status} /></span>
                  </div>
                  <div>Manufacturer: {selectedMachine.manufacturer || 'OEM Industrial'} • Model: {selectedMachine.model_number || 'Standard'}</div>
                </div>
              )}
            </div>

            {/* Problem Title */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Problem Summary:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Problem Description */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label">
                Diagnostic Description & Symptoms:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="form-textarea"
                required
              />
            </div>

            {/* Skill Requirement & Priority Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
              <div>
                <label className="form-label">
                  Target Expertise Skill:
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="form-select"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">
                  Service Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="form-select"
                  style={{
                    color: priority === 'CRITICAL' ? '#dc2626' : '#0f172a',
                    fontWeight: priority === 'CRITICAL' ? 700 : 500,
                  }}
                >
                  <option value="LOW">LOW — Standard Maintenance</option>
                  <option value="MEDIUM">MEDIUM — Normal Service</option>
                  <option value="HIGH">HIGH — Degraded Capacity</option>
                  <option value="CRITICAL">CRITICAL — Line Stoppage / Emergency</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {isSubmitting ? (
                <>Analyzing Expert Skills & Proximity...</>
              ) : (
                <>
                  <span>🚀</span> Request Service & Auto-Allocate Expert
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Model Allocation & Live Interactive Map Tracking */}
        {trackingData && (
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>🎯</span>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    AI Allocation Result & Live Radar
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Work Order: <b style={{ color: '#0284c7' }}>{trackingData.service_request.request_code}</b> • Machine: <b style={{ color: '#0f172a' }}>{trackingData.machine_name}</b>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <StatusBadge status={trackingData.assignment_status || 'ASSIGNED'} />
                <button
                  onClick={refreshTracking}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  🔄 Refresh Status
                </button>
              </div>
            </div>

            {/* Reallocation Banner if reallocated */}
            {trackingData.reallocated && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚡</span>
                <span>
                  <b>Autonomous Reallocation:</b> The previous technician was unavailable. The AI engine automatically reallocated this job to the next qualified available specialist!
                </span>
              </div>
            )}

            {/* Allocated Technician Details Card */}
            {trackingData.allocated_technician ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #93c5fd',
                  borderRadius: '12px',
                  padding: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        border: '2px solid #3b82f6',
                      }}
                    >
                      👷‍♂️
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {trackingData.allocated_technician.name} ({trackingData.allocated_technician.employee_code})
                      </div>
                      <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
                        {trackingData.allocated_technician.specialization}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: 'right',
                      background: '#ecfdf5',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                      AI Match Score
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>
                      {trackingData.allocated_technician.match_score.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Technician Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>EXPERIENCE</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {trackingData.allocated_technician.experience_years} Years
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>EST. DISTANCE</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                      {trackingData.allocated_technician.estimated_distance_km.toFixed(1)} km
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>AVAILABILITY</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                      {trackingData.allocated_technician.availability_status}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>DIRECT CONTACT</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {trackingData.allocated_technician.phone || '+1-555-0199'}
                    </div>
                  </div>
                </div>

                {/* Verified Skills Tags */}
                {trackingData.allocated_technician.skills && trackingData.allocated_technician.skills.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Skills:</span>
                    {trackingData.allocated_technician.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          color: '#334155',
                        }}
                      >
                        {sk.skill_name} ({sk.proficiency}/5 ★)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                All eligible technicians are currently engaged on active work orders. Service request is registered as OPEN.
              </div>
            )}

            {/* Interactive Live Map Component */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  🗺️ Interactive Live Location Map (Customer Site & Specialist)
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  OpenStreetMap Carto • Live GPS Tracking
                </span>
              </div>

              <InteractiveLiveMap
                siteLat={trackingData.site_latitude || 42.3314}
                siteLng={trackingData.site_longitude || -83.0458}
                siteName={trackingData.site_name || 'Customer Site'}
                siteAddress={trackingData.site_address}
                machineName={trackingData.machine_name || 'Machine'}
                machineCode={trackingData.machine_code}
                techLat={trackingData.allocated_technician?.current_latitude}
                techLng={trackingData.allocated_technician?.current_longitude}
                techName={trackingData.allocated_technician?.name}
                techCode={trackingData.allocated_technician?.employee_code}
                distanceKm={trackingData.distance_km || trackingData.allocated_technician?.estimated_distance_km}
                status={trackingData.assignment_status}
                height="380px"
              />
            </div>

            {/* Quick Switch to Technician Portal Link */}
            <div
              style={{
                marginTop: '10px',
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
              }}
            >
              <span style={{ color: '#64748b' }}>
                👉 Test the technician's response:
              </span>
              <Link
                to="/technician-portal"
                style={{
                  color: '#0284c7',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Go to Technician Portal to Accept or Reject this allocation ➔
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
