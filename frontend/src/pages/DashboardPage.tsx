import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LiveOperationsMap } from '../components/LiveOperationsMap';
import { NewServiceRequestModal } from '../components/NewServiceRequestModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const [modalOpen, setModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleReassignAction = () => {
    showToast('⚡ AI Autonomous Reallocation: Reassigned T-27 (Skill Match 98%) to M-104. Projected SLA breach prevented!');
  };

  const handleAlternatePartAction = () => {
    showToast('📦 Alternate Part Transfer Initiated: Hydraulic Valve Assembly dispatched from Bangalore Depot. ETA: 1.5 hrs.');
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Alert Banner if triggered */}
      {toastMessage && (
        <div
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#38bdf8',
            border: '1px solid #38bdf8',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ color: 'var(--text-muted)', fontSize: '16px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* 1. Greeting & Date Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'conic-gradient(#4f46e5 0% 50%, #38bdf8 50% 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
            }}
          />

          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {greeting}, {user?.name || 'Operator'}!
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Here's what's happening with your service operations today.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {displayDate}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 800 }}>
              06:24 PM
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px' }}>+</span> New Service Request
          </button>
        </div>
      </div>

      {/* 2. Top Row: 5 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {/* Card 1: Total Service Requests */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              📄
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Service Requests
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>48</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>↑ 12% vs last week</span>
          </div>
        </div>

        {/* Card 2: Active Jobs */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              ⚙️
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active Jobs
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>32</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              18 On-site | <b style={{ color: '#0284c7' }}>14 In Transit</b>
            </span>
          </div>
        </div>

        {/* Card 3: SLA On-Time */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              ⏱️
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              SLA On-Time
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>92%</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>↑ 6% vs last week</span>
          </div>
        </div>

        {/* Card 4: At Risk */}
        <div style={{ backgroundColor: 'rgba(254, 226, 226, 0.45)', borderRadius: '12px', padding: '18px 20px', border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              ⚠️
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#b91c1c' }}>
              At Risk
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#991b1b' }}>5</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>↓ 40% vs last week</span>
          </div>
        </div>

        {/* Card 5: Avg. Recovery Time */}
        <div style={{ backgroundColor: 'rgba(254, 243, 199, 0.45)', borderRadius: '12px', padding: '18px 20px', border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              ⚡
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
              Avg. Recovery Time
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#78350f' }}>2.8 hrs</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>↓ 32% vs last week</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Live Field Operations (50%), Active Technicians (25%), AI Insights (25%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '18px' }}>
        {/* Left: Live Field Operations Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Live Field Operations</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Real-time technician locations and active service jobs</span>
              </div>
            </div>

            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              style={{
                padding: '4px 10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Technicians</option>
              <option value="ON_SITE">On-site</option>
              <option value="EN_ROUTE">En route</option>
              <option value="DELAYED">Delayed</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_BREAK">On break</option>
            </select>
          </div>

          <LiveOperationsMap height="360px" filter={technicianFilter} />
        </div>

        {/* Center: Active Technicians Roster */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Active Technicians</span>
            <Link to="/technicians" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {/* Tech 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  PS
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-08 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Priya S.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>En route to M-104</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>⏱️ 24 min</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>

            {/* Tech 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  RK
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-12 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Rahul K.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>Delayed (Traffic)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>⚠️ 45 min</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>

            {/* Tech 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  AM
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-21 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Arjun M.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-site (M-087)</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>🟢 On-site</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>

            {/* Tech 4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  SP
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-04 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Sneha P.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>En route to M-203</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>⏱️ 18 min</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>

            {/* Tech 5 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  KR
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-16 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Karthik R.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Available</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⚪ Base</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>

            {/* Tech 6 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                  NV
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    T-31 <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Neha V.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On break</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⚪ Base</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>⋮</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Insights (Dark Glassmorphism Card) */}
        {/* Right: AI Insights (Dark Industrial Card) */}
        <div
          style={{
            backgroundColor: '#14172a',
            borderRadius: '14px',
            padding: '20px',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', color: '#a78bfa' }}>✨</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>AI Insights</span>
              </div>
              <Link to="/exceptions" style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>
                View All
              </Link>
            </div>

            {/* Alert Box */}
            <div
              style={{
                backgroundColor: '#2b1624',
                border: '1px solid #4a1f34',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', color: '#ef4444' }}>⚠️</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#f87171' }}>
                  High SLA Risk Predicted
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                M-104 service may be delayed by 3.5 hours due to traffic and part unavailability.
              </p>
            </div>

            {/* Suggested Actions */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Suggested Actions
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleReassignAction}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.24)',
                    borderRadius: '8px',
                    color: '#34d399',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span>
                    <span>Reassign T-27 <span style={{ fontWeight: 700 }}>(Skill Match 98%)</span></span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>›</span>
                </button>

                <button
                  onClick={handleAlternatePartAction}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.24)',
                    borderRadius: '8px',
                    color: '#22d3ee',
                    fontSize: '11.5px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📦</span>
                    <span>Use alternate part from Bangalore Depot <span style={{ fontWeight: 700 }}>(ETA 1.5 hrs)</span></span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>›</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Analytics Row: SLA Performance (33%), Service Request Trend (33%), Part Inventory Status (33%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {/* SLA Performance Donut Chart */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-medium)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📊</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>SLA Performance</span>
            </div>
            <select style={{ padding: '3px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <option>This Month</option>
              <option>This Quarter</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
            {/* Circular Gauge */}
            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="20"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>92%</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>On-Time</div>
              </div>
            </div>

            {/* Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '120px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Total Jobs</span>
                </span>
                <b style={{ color: 'var(--text-primary)' }}>120</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '120px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>On-Time</span>
                </span>
                <b style={{ color: 'var(--text-primary)' }}>110</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '120px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Delayed</span>
                </span>
                <b style={{ color: 'var(--text-primary)' }}>8</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '120px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>At Risk</span>
                </span>
                <b style={{ color: '#ef4444' }}>2</b>
              </div>
            </div>
          </div>
        </div>

        {/* Service Request Trend Chart */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-medium)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📈</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Service Request Trend</span>
            </div>
            <select style={{ padding: '3px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* SVG Multi-Line Trend Chart */}
          <div style={{ width: '100%', height: '130px' }}>
            <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="trendGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="320" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="320" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Area 1 */}
              <path
                d="M 10 90 Q 60 70 110 50 T 210 65 T 310 30 L 310 110 L 10 110 Z"
                fill="url(#trendGrad)"
              />
              <path
                d="M 10 90 Q 60 70 110 50 T 210 65 T 310 30"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
              />

              {/* Area 2 */}
              <path
                d="M 10 100 Q 70 95 120 75 T 220 50 T 310 40 L 310 110 L 10 110 Z"
                fill="url(#trendGrad2)"
              />
              <path
                d="M 10 100 Q 70 95 120 75 T 220 50 T 310 40"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Points */}
              <circle cx="110" cy="50" r="3.5" fill="#0284c7" />
              <circle cx="210" cy="65" r="3.5" fill="#0284c7" />
              <circle cx="310" cy="30" r="3.5" fill="#0284c7" />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', paddingTop: '4px' }}>
            <span>Oct 1</span>
            <span>Oct 2</span>
            <span>Oct 3</span>
            <span>Oct 4</span>
            <span>Oct 5</span>
            <span>Oct 6</span>
            <span>Oct 7</span>
          </div>
        </div>

        {/* Part Inventory Status */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-medium)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>⚙️</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Part Inventory Status</span>
            </div>
            <Link to="/inventory" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
            {/* Semi Donut Progress */}
            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>76%</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>In Stock</div>
              </div>
            </div>

            {/* Stock Counts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '130px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>In Stock</span>
                </span>
                <b style={{ color: 'var(--text-primary)' }}>1,240</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '130px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Low Stock</span>
                </span>
                <b style={{ color: '#d97706' }}>210</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '130px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Out of Stock</span>
                </span>
                <b style={{ color: '#ef4444' }}>45</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Upcoming & Critical Actions (65%), Digital Twin View (35%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '18px' }}>
        {/* Left: Upcoming & Critical Actions Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>🚨</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>Upcoming & Critical Actions</span>
            </div>
            <Link to="/service-requests" style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
              View All ➔
            </Link>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>PRIORITY</th>
                <th>SERVICE ID</th>
                <th>MACHINE</th>
                <th>ISSUE</th>
                <th>SLA DEADLINE</th>
                <th>STATUS</th>
                <th>ACTION</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 */}
              <tr>
                <td>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🔴</span> High
                  </span>
                </td>
                <td>
                  <b style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>SR-1042</b>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>M-104 (CNC)</td>
                <td style={{ color: 'var(--text-muted)' }}>Spindle motor failure</td>
                <td style={{ color: '#dc2626', fontWeight: 600 }}>Today, 8:00 PM</td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                    At Risk
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => {
                      showToast('⚡ Autonomous AI Dispatch: Dispatched High-Priority Specialist to SR-1042 (M-104 CNC).');
                    }}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Take Action
                  </button>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>⋮</td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td>
                  <span style={{ color: '#d97706', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🟠</span> Medium
                  </span>
                </td>
                <td>
                  <b style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>SR-1047</b>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>M-203 (Press)</td>
                <td style={{ color: 'var(--text-muted)' }}>Hydraulic leak</td>
                <td style={{ color: 'var(--text-secondary)' }}>Tomorrow, 10:00 AM</td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    In Progress
                  </span>
                </td>
                <td>
                  <Link
                    to="/technician-portal"
                    style={{
                      padding: '5px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    View Details
                  </Link>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>⋮</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: Digital Twin View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🗃️</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>Digital Twin View</span>
            </div>
            <Link
              to="/customer-portal"
              style={{
                padding: '4px 10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View
            </Link>
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              flex: 1,
              minHeight: '160px',
              background: '#0a0f1d',
              border: '1px solid #1e293b',
            }}
          >
            <img
              src="/digital_twin_plant.jpg"
              alt="Digital Twin 3D View"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            {/* Interactive Overlay Telemetry Pins matching the 3D factory */}
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '25%',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#fff',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px #10b981',
                cursor: 'pointer',
              }}
              title="M-087 CNC Mill - Operational (100% capacity)"
            >
              ✓
            </div>

            <div
              style={{
                position: 'absolute',
                top: '52%',
                left: '60%',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px #ef4444',
                animation: 'pulseGlow 1.5s infinite',
                cursor: 'pointer',
              }}
              title="M-104 Press - High Vibration Risk"
            >
              ⚠️
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '18%',
                right: '15%',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#fff',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px #10b981',
                cursor: 'pointer',
              }}
              title="Robotic Cell - Operational"
            >
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* New Service Request Modal */}
      <NewServiceRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => showToast('🚀 Service Request submitted! The AI matching engine has allocated the highest-ranked technician.')}
      />
    </div>
  );
};
