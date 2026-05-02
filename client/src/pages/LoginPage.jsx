import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0D3349 0%, #1A5276 50%, #1a6a9a 100%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo card */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: '#2ECC71',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, marginBottom: 14, boxShadow: '0 8px 24px rgba(46,204,113,.4)',
          }}>🏘</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Village Office</h1>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>Management System</p>
        </div>

        <div className="card" style={{ borderRadius: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Enter your credentials to access the system</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="admin@villageoffice.gov.za"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}
              style={{ justifyContent: 'center', padding: '12px', marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width:16,height:16,borderWidth:2 }} /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '14px', background: 'var(--surface)', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>FIRST TIME SETUP:</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Run <code style={{ fontFamily: 'var(--mono)', background: '#e8ecef', padding: '1px 5px', borderRadius: 4 }}>POST /api/auth/register</code> to create your first admin account.
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
          <a href="/apply" style={{ color: 'rgba(255,255,255,.55)' }}>🔗 Public Stand Application Portal</a>
        </p>
      </div>
    </div>
  );
}
