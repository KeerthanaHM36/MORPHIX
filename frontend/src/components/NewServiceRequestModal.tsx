import React, { useState, useEffect } from 'react';
import { machinesAPI, skillsAPI, serviceRequestsAPI } from '../services/api';
import { Machine, Skill, ServiceRequestTrackingResponse } from '../types';
import { InteractiveLiveMap } from './InteractiveLiveMap';

interface NewServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const NewServiceRequestModal: React.FC<NewServiceRequestModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [title, setTitle] = useState('High Vibration on Main Spindle & Thermal Rise');
  const [description, setDescription] = useState('CNC milling center spindle bearing vibration amplitude exceeded 4.5 mm/s threshold.');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocatedResult, setAllocatedResult] = useState<ServiceRequestTrackingResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [mList, sList] = await Promise.all([machinesAPI.list(), skillsAPI.list()]);
      setMachines(mList);
      setSkills(sList);
      if (mList.length > 0) setSelectedMachineId(mList[0].id);
      if (sList.length > 0) setSelectedSkillId(sList[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await serviceRequestsAPI.createCustomerRequest({
        machine_id: selectedMachineId,
        title,
        description,
        priority,
        skill_id: selectedSkillId || undefined,
        minimum_proficiency: 3,
      });
      setAllocatedResult(res);
      if (onCreated) onCreated();
    } catch (err: any) {
      alert('Error creating request: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: allocatedResult ? '960px' : '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {allocatedResult ? '🎯 AI Specialist Dispatched Successfully' : '⚡ New Industrial Service Request'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              {allocatedResult
                ? 'The AI engine has evaluated technical skills and live GPS proximity to allocate the best available expert.'
                : 'Select machine and issue symptoms to trigger autonomous AI expert technician allocation.'}
            </p>
          </div>

          <button
            onClick={() => {
              setAllocatedResult(null);
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontSize: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {allocatedResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Technician Profile Card */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #bfdbfe',
                  }}
                >
                  👷‍♂️
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {allocatedResult.allocated_technician?.name} ({allocatedResult.allocated_technician?.employee_code})
                  </div>
                  <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                    {allocatedResult.allocated_technician?.specialization}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {allocatedResult.allocated_technician?.experience_years} Years Experience • Phone: {allocatedResult.allocated_technician?.phone}
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  backgroundColor: '#ecfdf5',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #a7f3d0',
                }}
              >
                <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                  AI Match Score
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#059669' }}>
                  {allocatedResult.allocated_technician?.match_score.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Live Map */}
            <InteractiveLiveMap
              siteLat={allocatedResult.site_latitude || 42.3314}
              siteLng={allocatedResult.site_longitude || -83.0458}
              siteName={allocatedResult.site_name || 'Plant'}
              machineName={allocatedResult.machine_name || 'Machine'}
              techLat={allocatedResult.allocated_technician?.current_latitude}
              techLng={allocatedResult.allocated_technician?.current_longitude}
              techName={allocatedResult.allocated_technician?.name}
              techCode={allocatedResult.allocated_technician?.employee_code}
              distanceKm={allocatedResult.distance_km}
              status={allocatedResult.assignment_status}
              height="300px"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setAllocatedResult(null);
                  onClose();
                }}
                className="btn btn-secondary"
              >
                Close
              </button>
              <a href="/technician-portal" className="btn btn-primary">
                Open Technician Review Portal ➔
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Select Industrial Machine:
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                }}
                required
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machine_code}) — {m.machine_type || 'Industrial Asset'}
                  </option>
                ))}
              </select>
              {selectedMachine && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Location: <b>{selectedMachine.site_name || 'Main Facility'}</b> • Status: <b style={{ color: '#0284c7' }}>{selectedMachine.status}</b>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Problem Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Description & Telemetry Details:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Required Skill Domain:
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                  }}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Urgency / Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: priority === 'CRITICAL' ? '#dc2626' : '#0f172a',
                    fontWeight: priority === 'CRITICAL' ? 700 : 500,
                  }}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL (Emergency)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {isSubmitting ? 'AI Allocating...' : '🚀 Submit & Allocate Technician'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
