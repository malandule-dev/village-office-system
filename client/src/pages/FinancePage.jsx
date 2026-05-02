import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

function PaymentModal({ onClose, onSaved }) {
  const [stands, setStands] = useState([]);
  const [form, setForm] = useState({ stand: '', amount: '', type: 'levy', method: 'eft', referenceNumber: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stands?limit=200').then(r => setStands(r.data.stands));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/payments', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save payment'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Record Payment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Stand *</label>
              <select className="form-select" value={form.stand} onChange={e => setForm(f => ({ ...f, stand: e.target.value }))} required>
                <option value="">— Select Stand —</option>
                {stands.map(s => (
                  <option key={s._id} value={s._id}>#{s.standNumber} — {s.section} {s.owner?.name ? `(${s.owner.name})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Amount (R) *</label>
                <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="title_deed">Title Deed</option>
                  <option value="levy">Monthly Levy</option>
                  <option value="deposit">Deposit</option>
                  <option value="arrears">Arrears Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Method</label>
                <select className="form-select" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="eft">EFT</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reference #</label>
                <input className="form-input" value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="Bank ref or receipt no." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows="2" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [tab, setTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get('/payments?limit=50'),
        api.get('/reports/arrears'),
      ]);
      setPayments(pRes.data.payments);
      setArrears(aRes.data.arrears);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadPdf = async (url, filename) => {
    setPdfLoading(filename);
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not generate PDF. Check balance.');
    } finally { setPdfLoading(null); }
  };

  const TYPE_BADGE = { title_deed:'badge-purple', levy:'badge-blue', deposit:'badge-green', arrears:'badge-red', other:'badge-gray' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Finance & Title Deeds</h1>
          <p className="page-sub">Payments, arrears tracking, and PDF document generation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Payment</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--card)', borderRadius: 9, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[['payments', '💳 Payments'], ['arrears', `⚠️ Arrears (${arrears.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === key ? 'var(--primary)' : 'transparent',
            color: tab === key ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--font)',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : tab === 'payments' ? (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Payment History</span>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state"><p>No payments recorded yet. Record the first payment above.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Stand</th><th>Owner</th><th>Type</th><th>Method</th><th>Amount</th><th>Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{p.stand?.standNumber || '—'}</td>
                      <td>{p.stand?.owner?.name || '—'}</td>
                      <td><span className={`badge ${TYPE_BADGE[p.type] || 'badge-gray'}`}>{p.type?.replace('_', ' ')}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-dk)' }}>R {p.amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString('en-ZA')}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={pdfLoading === `receipt-${p._id}.pdf`}
                          onClick={() => downloadPdf(`/payments/${p._id}/receipt`, `receipt-${p._id}.pdf`)}
                        >
                          📄 Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Arrears tab */
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Missed Payments — Arrears Report</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Generated {new Date().toLocaleDateString('en-ZA')}</span>
          </div>
          <div className="alert alert-warn" style={{ marginBottom: 16 }}>
            <strong>ISTQB BVA Note:</strong> Arrears flag triggers the day <strong>after</strong> the levy due date (tested on day 29, 30, and 1st of next month).
          </div>
          {arrears.length === 0 ? (
            <div className="empty-state"><p>✅ No stands in arrears.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Stand</th><th>Section</th><th>Owner</th><th>Phone</th><th>Purchase Price</th><th>Paid</th><th>Outstanding</th><th>Overdue</th><th>Title Deed</th></tr>
                </thead>
                <tbody>
                  {arrears.map(s => (
                    <tr key={s._id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{s.standNumber}</td>
                      <td>{s.section}</td>
                      <td>{s.owner?.name || '—'}</td>
                      <td>{s.owner?.phone || '—'}</td>
                      <td>R {s.financials?.purchasePrice?.toLocaleString('en-ZA')}</td>
                      <td style={{ color: 'var(--accent-dk)' }}>R {s.financials?.totalPaid?.toLocaleString('en-ZA')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>R {((s.financials?.purchasePrice || 0) - (s.financials?.totalPaid || 0)).toLocaleString('en-ZA')}</td>
                      <td>
                        {s.isOverdue
                          ? <span className="badge badge-red">Overdue</span>
                          : <span className="badge badge-yellow">Upcoming</span>}
                      </td>
                      <td>
                        {s.financials?.titleDeedIssued ? (
                          <button
                            className="btn btn-outline btn-sm"
                            disabled={pdfLoading === `title-deed-${s.standNumber}.pdf`}
                            onClick={() => downloadPdf(`/payments/title-deed/${s._id}`, `title-deed-${s.standNumber}.pdf`)}
                          >
                            📜 Download
                          </button>
                        ) : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not issued</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
