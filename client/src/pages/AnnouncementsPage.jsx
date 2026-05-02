import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_BADGE = {
  meeting: 'badge-blue', bylaw: 'badge-purple', event: 'badge-green',
  financial: 'badge-yellow', development: 'badge-blue', emergency: 'badge-red', general: 'badge-gray',
};
const CATEGORY_ICON = {
  meeting: '📅', bylaw: '📜', event: '🎉', financial: '💰',
  development: '🏗', emergency: '🚨', general: '📢',
};

function AnnouncementModal({ announcement, onClose, onSaved }) {
  const isEdit = !!announcement?._id;
  const [form, setForm] = useState(announcement || { title: '', body: '', category: 'general', pinned: false, smsBlast: { enabled: false }, whatsappBlast: { enabled: false } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (isEdit) await api.patch(`/announcements/${announcement._id}`, form);
      else await api.post('/announcements', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Announcement' : 'New Announcement'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Community Meeting — 30 November" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="bylaw">Bylaw / Resolution</option>
                  <option value="event">Event</option>
                  <option value="financial">Financial</option>
                  <option value="development">Development</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group" style={{ justifyContent: 'center' }}>
                <label className="form-label">Options</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                  <span style={{ fontSize: 13 }}>📌 Pin to top of notice board</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Message Body *</label>
              <textarea className="form-textarea" rows="5" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required
                placeholder="Write the full announcement here. This will be sent via SMS/WhatsApp if blasting is enabled…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Announcement')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BlastModal({ announcement, onClose }) {
  const [channel, setChannel] = useState('sms');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const TWILIO_CONFIGURED = true; // server will report if not configured

  const sendBlast = async () => {
    setSending(true); setError(''); setResult(null);
    try {
      const { data } = await api.post(`/announcements/${announcement._id}/blast`, { channel });
      setResult(data);
    } catch (err) { setError(err.response?.data?.message || 'Blast failed'); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <span className="modal-title">📱 Send Blast — {announcement.title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {result ? (
            <div className="alert alert-success">
              ✅ Blast sent!<br />
              SMS: {result.smsSent} recipients · WhatsApp: {result.whatsappSent} recipients
              <br /><small>Total registered phones: {result.totalPhones}</small>
            </div>
          ) : (
            <>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                This will send the announcement to all registered stand owners who have a phone number on file.
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Channel</label>
                <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
                  <option value="sms">SMS only</option>
                  <option value="whatsapp">WhatsApp only</option>
                  <option value="both">Both SMS & WhatsApp</option>
                </select>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13 }}>
                <strong>Preview:</strong><br />
                <em>{announcement.title}<br /><br />{announcement.body?.substring(0, 120)}{announcement.body?.length > 120 ? '…' : ''}</em>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            {!result && (
              <button className="btn btn-primary" onClick={sendBlast} disabled={sending}>
                {sending ? 'Sending…' : `📤 Send ${channel === 'both' ? 'SMS & WhatsApp' : channel.toUpperCase()}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [blastTarget, setBlastTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/announcements/admin?limit=50');
      setAnnouncements(data.announcements);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async (id) => {
    await api.post(`/announcements/${id}/publish`);
    load();
  };
  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    load();
  };

  const STATUS_BADGE = { draft: 'badge-gray', pending_approval: 'badge-yellow', published: 'badge-green', archived: 'badge-gray' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📢 Chief's Portal</h1>
          <p className="page-sub">Digital notice board, trustee updates, and community communications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Announcement</button>
      </div>

      {/* Info banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '📋', title: 'Notice Board', desc: 'Publish official community announcements and resolutions', color: '#1A5276' },
          { icon: '🤝', title: 'Trustee Updates', desc: 'Financial dividends and development project updates', color: '#7D3C98' },
          { icon: '📱', title: 'SMS & WhatsApp', desc: 'Blast messages to all registered stand holders', color: '#1E8449' },
        ].map(card => (
          <div key={card.title} className="card" style={{ borderTop: `4px solid ${card.color}`, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontWeight: 700, color: card.color, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Announcements list */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Announcements</span>
        </div>
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : announcements.length === 0 ? (
          <div className="empty-state"><p>No announcements yet. Create the first one above.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(a => (
              <div key={a._id} style={{
                background: 'var(--surface)', borderRadius: 9, padding: '16px 18px',
                border: '1px solid var(--border)',
                borderLeft: a.pinned ? '4px solid var(--gold)' : '4px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{CATEGORY_ICON[a.category] || '📢'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      {a.pinned && <span className="badge badge-yellow">📌 Pinned</span>}
                      <span className={`badge ${CATEGORY_BADGE[a.category] || 'badge-gray'}`}>{a.category}</span>
                      <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{a.status?.replace('_', ' ')}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {a.postedBy?.name} · {new Date(a.createdAt).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {a.body?.substring(0, 200)}{a.body?.length > 200 ? '…' : ''}
                    </p>

                    {/* Blast status */}
                    {(a.smsBlast?.sent || a.whatsappBlast?.sent) && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        {a.smsBlast?.sent && <span className="badge badge-green">📱 SMS sent to {a.smsBlast.recipients}</span>}
                        {a.whatsappBlast?.sent && <span className="badge badge-green">💬 WhatsApp sent to {a.whatsappBlast.recipients}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {a.status !== 'published' && ['admin','chief'].includes(user?.role) && (
                      <button className="btn btn-accent btn-sm" onClick={() => publish(a._id)}>Publish</button>
                    )}
                    {a.status === 'published' && (
                      <button className="btn btn-outline btn-sm" onClick={() => setBlastTarget(a)}>📤 Blast</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(a)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(a._id)}>Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <AnnouncementModal
          announcement={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {blastTarget && (
        <BlastModal announcement={blastTarget} onClose={() => { setBlastTarget(null); load(); }} />
      )}
    </div>
  );
}
