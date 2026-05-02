import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';

const STATUS_BADGE = {
  pending: 'badge-yellow', under_review: 'badge-blue',
  approved: 'badge-green', allocated: 'badge-green',
  rejected: 'badge-red',
};
const STATUS_LABEL = {
  pending: 'Pending', under_review: 'Under Review',
  approved: 'Approved', allocated: 'Allocated', rejected: 'Rejected',
};
const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function BookingDetailModal({ booking, onClose, onUpdated }) {
  const [status, setStatus] = useState(booking.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const updateStatus = async () => {
    setSaving(true);
    try {
      await api.patch(`/bookings/${booking._id}/status`, { status, note });
      onUpdated();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Application — {booking.referenceNumber}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Applicant */}
          <div style={{ background: 'var(--surface)', borderRadius: 9, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Applicant Details</p>
            <div className="form-grid">
              {[
                ['Name', booking.applicant?.name],
                ['ID Number', booking.applicant?.idNumber],
                ['Phone', booking.applicant?.phone],
                ['Email', booking.applicant?.email || '—'],
                ['Preferred Section', booking.preferredSection || '—'],
                ['Preferred Stand', booking.preferredStand || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            {booking.needStatement && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>NEED STATEMENT</div>
                <p style={{ fontSize: 13, fontStyle: 'italic' }}>{booking.needStatement}</p>
              </div>
            )}
          </div>

          {/* Admin notes */}
          {booking.adminNotes?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Admin Notes</p>
              {booking.adminNotes.map((n, i) => (
                <div key={i} style={{ background: 'var(--surface)', borderRadius: 7, padding: '10px 14px', marginBottom: 6, borderLeft: '3px solid var(--primary-lt)' }}>
                  <p style={{ fontSize: 13 }}>{n.note}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.addedBy} · {new Date(n.addedAt).toLocaleDateString('en-ZA')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Status update */}
          <div className="divider" />
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, textTransform: 'uppercase' }}>Update Status</p>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="allocated">Allocated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={updateStatus} disabled={saving}>
              {saving ? 'Saving…' : 'Update Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const [bRes, sRes] = await Promise.all([
        api.get(`/bookings?${params}`),
        api.get('/bookings/stats'),
      ]);
      setBookings(bRes.data.bookings);
      setStats(sRes.data);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const monthlyData = stats?.monthly?.map(m => ({
    name: `${MONTHS[m._id.month]} ${m._id.year}`, applications: m.count,
  })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Land Acquisition</h1>
          <p className="page-sub">Booking applications and housing demand tracking</p>
        </div>
        <a href="/apply" target="_blank" rel="noreferrer" className="btn btn-accent">🔗 Public Portal</a>
      </div>

      {/* Demand stats */}
      {stats && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-tile warn">
            <span className="label">In-Need (Active)</span>
            <span className="value">{stats.inNeed}</span>
            <span className="sub">Pending or under review</span>
          </div>
          <div className="stat-tile success">
            <span className="label">Available Stands</span>
            <span className="value">{stats.totalAvailableStands}</span>
            <span className="sub">Ready to allocate</span>
          </div>
          {stats.statusCounts?.map(sc => (
            <div className="stat-tile" key={sc._id}>
              <span className="label">{STATUS_LABEL[sc._id] || sc._id}</span>
              <span className="value">{sc.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trend chart */}
      {monthlyData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">📈 Monthly Applications Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="applications" radius={[4, 4, 0, 0]}>
                {monthlyData.map((_, i) => <Cell key={i} fill={i === monthlyData.length - 1 ? '#2ECC71' : '#2980B9'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Applications</span>
        </div>
        <div className="search-bar">
          <input className="search-input" placeholder="Search by name, ID, or reference…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="allocated">Allocated</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div className="empty-state"><p>No applications found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Reference</th><th>Applicant</th><th>Phone</th><th>Preferred Area</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td className="mono" style={{ fontWeight: 700 }}>{b.referenceNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.applicant?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {b.applicant?.idNumber}</div>
                    </td>
                    <td>{b.applicant?.phone}</td>
                    <td>{b.preferredSection || b.preferredStand || '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[b.status] || 'badge-gray'}`}>{STATUS_LABEL[b.status]}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString('en-ZA')}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(b)}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <BookingDetailModal booking={selected} onClose={() => setSelected(null)} onUpdated={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}
