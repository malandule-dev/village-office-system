import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';

const MONTHS = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!data) return <div className="alert alert-error">Failed to load dashboard.</div>;

  const { stats, recentPayments, paymentTrend } = data;
  const chartData = paymentTrend.map(p => ({
    name: `${MONTHS[p._id.month]} ${p._id.year}`,
    amount: p.total, transactions: p.count,
  }));

  const pieData = [
    { name: 'Available',  value: stats.stands.available,  color: '#2ECC71' },
    { name: 'Allocated',  value: stats.stands.allocated,  color: '#2980B9' },
    { name: 'Sold',       value: stats.stands.sold,       color: '#1A5276' },
    { name: 'In Arrears', value: stats.stands.inArrears,  color: '#E74C3C' },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Village Office — Overview & Analytics</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}</div>
      </div>

      {/* Stat tiles */}
      <div className="stat-grid">
        <div className="stat-tile">
          <span className="label">Total Stands</span>
          <span className="value">{stats.stands.total}</span>
          <span className="sub">{stats.stands.available} available</span>
        </div>
        <div className="stat-tile success">
          <span className="label">Available Stands</span>
          <span className="value">{stats.stands.available}</span>
          <span className="sub">Ready for allocation</span>
        </div>
        <div className="stat-tile warn">
          <span className="label">Pending Bookings</span>
          <span className="value">{stats.bookings.pending}</span>
          <span className="sub">Need review</span>
        </div>
        <div className="stat-tile danger">
          <span className="label">In Arrears</span>
          <span className="value">{stats.stands.inArrears}</span>
          <span className="sub">Missed payments</span>
        </div>
        <div className="stat-tile">
          <span className="label">Total Collected</span>
          <span className="value" style={{ fontSize: 22 }}>R {(stats.finances.totalCollected || 0).toLocaleString('en-ZA')}</span>
          <span className="sub">All time</span>
        </div>
        <div className="stat-tile">
          <span className="label">Announcements</span>
          <span className="value">{stats.announcements.published}</span>
          <span className="sub">Published</span>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Revenue trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">💳 Payment Collections (Last 6 Months)</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2980B9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2980B9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`R ${v.toLocaleString('en-ZA')}`, 'Amount']} />
                <Area type="monotone" dataKey="amount" stroke="#2980B9" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No payment data yet</p></div>
          )}
        </div>

        {/* Stand status pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏘 Stand Status</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No stands registered yet</p></div>
          )}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🕐 Recent Payments</span>
          <a href="/finance" className="btn btn-ghost btn-sm">View All</a>
        </div>
        {recentPayments.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stand</th><th>Section</th><th>Type</th><th>Amount</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(p => (
                  <tr key={p._id}>
                    <td className="mono">{p.stand?.standNumber || '—'}</td>
                    <td>{p.stand?.section || '—'}</td>
                    <td><span className="badge badge-blue">{p.type?.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-dk)' }}>R {p.amount?.toLocaleString('en-ZA')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString('en-ZA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No payments recorded yet</p></div>
        )}
      </div>
    </div>
  );
}
