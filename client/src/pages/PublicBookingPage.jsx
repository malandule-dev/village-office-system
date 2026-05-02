import React, { useState } from 'react';
import api from '../utils/api';

export default function PublicBookingPage() {
  const [form, setForm] = useState({
    applicant: { name: '', idNumber: '', phone: '', email: '', address: '' },
    preferredSection: '', preferredStand: '', needStatement: '',
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (path, val) => setForm(f => {
    const parts = path.split('.');
    if (parts.length === 1) return { ...f, [path]: val };
    return { ...f, [parts[0]]: { ...f[parts[0]], [parts[1]]: val } };
  });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { data } = await api.post('/bookings', form);
      setSubmitted(data.booking);
    } catch (err) { setError(err.response?.data?.message || 'Submission failed. Please try again.'); }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #0D3349 0%, #1A5276 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, maxWidth: 500, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E8449', marginBottom: 8 }}>Application Submitted!</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>Your stand application has been received by the village office. You will be contacted when your application is reviewed.</p>
          <div style={{ background: '#EAFAF1', borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Your Reference Number</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1A5276', fontFamily: 'var(--mono)' }}>{submitted.referenceNumber}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Save this number. An SMS confirmation will be sent to your phone.</p>
          </div>
          <button onClick={() => { setSubmitted(null); setForm({ applicant: { name:'',idNumber:'',phone:'',email:'',address:'' }, preferredSection:'',preferredStand:'',needStatement:'' }); }}
            style={{ padding: '12px 28px', background: '#1A5276', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font)' }}>
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0D3349 0%, #1A5276 100%)', padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏘</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Stand Application Portal</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Register your interest in a residential stand at the village office</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A5276', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #D6EAF8' }}>
                👤 Personal Details
              </h3>
              <div className="form-grid" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.applicant.name} onChange={e => set('applicant.name', e.target.value)} required placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">SA ID Number *</label>
                  <input className="form-input" value={form.applicant.idNumber} onChange={e => set('applicant.idNumber', e.target.value)} required placeholder="13-digit ID number" maxLength={13} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input className="form-input" type="tel" value={form.applicant.phone} onChange={e => set('applicant.phone', e.target.value)} required placeholder="e.g. 0712345678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={form.applicant.email} onChange={e => set('applicant.email', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Current Address</label>
                <input className="form-input" value={form.applicant.address} onChange={e => set('applicant.address', e.target.value)} placeholder="Where do you currently live?" />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A5276', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #D6EAF8' }}>
                🏘 Stand Preference
              </h3>
              <div className="form-grid" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Preferred Section / Area</label>
                  <input className="form-input" value={form.preferredSection} onChange={e => setForm(f => ({ ...f, preferredSection: e.target.value }))} placeholder="e.g. Section B, North Side" />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Stand Number</label>
                  <input className="form-input" value={form.preferredStand} onChange={e => setForm(f => ({ ...f, preferredStand: e.target.value }))} placeholder="If known (e.g. 047)" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Why do you need a stand? *</label>
              <textarea className="form-textarea" rows="4" value={form.needStatement} onChange={e => setForm(f => ({ ...f, needStatement: e.target.value }))} required
                placeholder="Please explain your housing need and current living situation…" />
            </div>

            <div style={{ background: '#F4F6F8', borderRadius: 8, padding: 14, fontSize: 12, color: '#666' }}>
              By submitting this form, you declare that all information provided is true and accurate. False information may result in your application being disqualified.
            </div>

            <button type="submit" disabled={loading} style={{
              padding: '14px', background: loading ? '#ccc' : '#1A5276', color: '#fff', border: 'none', borderRadius: 9,
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting…</> : '📤 Submit Application'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,.5)' }}>← Village Office Staff Login</a>
        </p>
      </div>
    </div>
  );
}
