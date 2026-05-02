import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const STATUS_BADGE = { available: 'badge-green', allocated: 'badge-blue', sold: 'badge-blue', reserved: 'badge-yellow' };
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function openInMaps(lat, lng) {
  const url = GOOGLE_MAPS_KEY
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, '_blank');
}

function StandModal({ stand, onClose, onSaved }) {
  const isEdit = !!stand?._id;
  const [form, setForm] = useState(stand || {
    standNumber: '', section: '', size: '', status: 'available', notes: '',
    owner: { name: '', idNumber: '', phone: '', email: '' },
    location: { lat: '', lng: '', address: '' },
    financials: { purchasePrice: '', monthlyLevy: '', levyDueDay: 30 },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (path, val) => setForm(f => {
    const parts = path.split('.');
    if (parts.length === 1) return { ...f, [path]: val };
    return { ...f, [parts[0]]: { ...f[parts[0]], [parts[1]]: val } };
  });

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (isEdit) await api.patch(`/stands/${stand._id}`, form);
      else await api.post('/stands', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? `Edit Stand #${stand.standNumber}` : 'Register New Stand'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Stand Number *</label>
                <input className="form-input" value={form.standNumber} onChange={e => set('standNumber', e.target.value)} required placeholder="e.g. 047" />
              </div>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <input className="form-input" value={form.section} onChange={e => set('section', e.target.value)} required placeholder="e.g. Section B" />
              </div>
              <div className="form-group">
                <label className="form-label">Size (m²)</label>
                <input className="form-input" type="number" value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. 300" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="allocated">Allocated</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div className="divider" />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Owner Information</p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-input" value={form.owner?.name || ''} onChange={e => set('owner.name', e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input className="form-input" value={form.owner?.idNumber || ''} onChange={e => set('owner.idNumber', e.target.value)} placeholder="SA ID number" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.owner?.phone || ''} onChange={e => set('owner.phone', e.target.value)} placeholder="e.g. 0712345678" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.owner?.email || ''} onChange={e => set('owner.email', e.target.value)} placeholder="owner@email.com" />
              </div>
            </div>

            <div className="divider" />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>GPS Location</p>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" value={form.location?.lat || ''} onChange={e => set('location.lat', e.target.value)} placeholder="-23.8844" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" value={form.location?.lng || ''} onChange={e => set('location.lng', e.target.value)} placeholder="29.4681" />
              </div>
              <div className="form-group">
                <label className="form-label">Address / Description</label>
                <input className="form-input" value={form.location?.address || ''} onChange={e => set('location.address', e.target.value)} placeholder="Street or area" />
              </div>
            </div>

            <div className="divider" />
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Financials</p>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Purchase Price (R)</label>
                <input className="form-input" type="number" value={form.financials?.purchasePrice || ''} onChange={e => set('financials.purchasePrice', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Levy (R)</label>
                <input className="form-input" type="number" value={form.financials?.monthlyLevy || ''} onChange={e => set('financials.monthlyLevy', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Levy Due Day</label>
                <input className="form-input" type="number" min="1" max="31" value={form.financials?.levyDueDay || 30} onChange={e => set('financials.levyDueDay', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows="2" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Register Stand')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StandsPage() {
  const [stands, setStands] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | stand object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/stands?${params}`);
      setStands(data.stands); setTotal(data.total);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const deleteStand = async (id, num) => {
    if (!confirm(`Delete Stand #${num}? This cannot be undone.`)) return;
    await api.delete(`/stands/${id}`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗺 Stands & GIS</h1>
          <p className="page-sub">{total} stands registered · click 📍 to open in Google Maps</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Register Stand</button>
      </div>

      {!GOOGLE_MAPS_KEY && (
        <div className="alert alert-warn">
          ⚠️ Google Maps API key not configured. Map links will use basic coordinates. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> to enable full navigation.
        </div>
      )}

      <div className="search-bar">
        <input className="search-input" placeholder="Search by stand number, owner name, or section…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : stands.length === 0 ? (
          <div className="empty-state">
            <p>No stands found. Register your first stand to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stand #</th><th>Section</th><th>Owner</th><th>Size</th>
                  <th>Status</th><th>Balance</th><th>GPS</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stands.map(s => {
                  const balance = (s.financials?.purchasePrice || 0) - (s.financials?.totalPaid || 0);
                  const hasGPS = s.location?.lat && s.location?.lng;
                  return (
                    <tr key={s._id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{s.standNumber}</td>
                      <td>{s.section}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.owner?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                        {s.owner?.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.owner.phone}</div>}
                      </td>
                      <td>{s.size ? `${s.size} m²` : '—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                      <td>
                        {s.financials?.purchasePrice > 0 ? (
                          <span style={{ color: balance > 0 ? 'var(--danger)' : 'var(--accent-dk)', fontWeight: 700 }}>
                            {balance > 0 ? `R ${balance.toLocaleString('en-ZA')} owed` : '✅ Paid'}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        {hasGPS ? (
                          <button className="btn btn-ghost btn-sm" onClick={() => openInMaps(s.location.lat, s.location.lng)} title="Open in Google Maps">
                            📍 Maps
                          </button>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No GPS</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => setModal(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteStand(s._id, s.standNumber)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <StandModal
          stand={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
