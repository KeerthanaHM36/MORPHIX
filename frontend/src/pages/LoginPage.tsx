import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@morphix.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'TECHNICIAN') {
        navigate('/technician-portal');
      } else if (user.role === 'VIEWER') {
        navigate('/customer-portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, #172554 0%, #0a0f1d 70%)',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 12px #10b981' }} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>MORPHIX</h1>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Industrial Resilience OS
          </p>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
            "See the disruption. Simulate the future. Orchestrate the recovery."
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Operator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secure Access Key (Password)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: 8 }}
          >
            {loading ? 'Authenticating...' : 'Enter Command Center'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
            Demo Operator Accounts (Password: Password123!)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleQuickRole('manager@morphix.io')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              👔 Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('dispatcher@morphix.io')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              📡 Dispatcher
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('t1@morphix.io')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              👷 Tech T1
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('admin@morphix.io')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              ⚡ Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
