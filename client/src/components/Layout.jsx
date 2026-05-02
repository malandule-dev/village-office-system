import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard',      icon: '◈', label: 'Dashboard' },
  { to: '/stands',         icon: '🗺', label: 'Stands & GIS' },
  { to: '/bookings',       icon: '📋', label: 'Land Acquisition' },
  { to: '/finance',        icon: '💰', label: 'Finance & Deeds' },
  { to: '/announcements',  icon: '📢', label: "Chief's Portal" },
];

const ROLE_COLORS = { admin:'#E74C3C', chief:'#D4AC0D', trustee:'#8E44AD', staff:'#2980B9', resident:'#27AE60' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? 64 : 260,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0D3349 0%, #1A5276 60%, #1a6a9a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50, transition: 'width .22s ease', overflow: 'hidden',
        boxShadow: '4px 0 20px rgba(0,0,0,.18)',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 10px', borderBottom: '1px solid rgba(255,255,255,.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: '#2ECC71',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0
            }}>🏘</div>
            {!collapsed && (
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>Village Office</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>Management System</div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
              background: isActive ? 'rgba(255,255,255,.15)' : 'transparent',
              fontWeight: isActive ? 700 : 400, fontSize: 13,
              textDecoration: 'none', transition: 'all .15s ease',
              borderLeft: isActive ? '3px solid #2ECC71' : '3px solid transparent',
            })}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Public booking link */}
        {!collapsed && (
          <div style={{ padding: '0 10px 10px' }}>
            <a href="/apply" target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 8,
              background: 'rgba(46,204,113,.15)', color: '#2ECC71',
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
              border: '1px solid rgba(46,204,113,.3)',
            }}>
              <span>🔗</span> Public Booking Portal
            </a>
          </div>
        )}

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: ROLE_COLORS[user?.role] || '#2980B9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13,
          }}>{user?.name?.[0]?.toUpperCase()}</div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 10, textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} title="Logout" style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,.4)',
              cursor: 'pointer', fontSize: 16, padding: 4,
            }}>⏏</button>
          )}
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)} style={{
          position: 'absolute', top: 24, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: '#2ECC71', border: 'none', color: '#fff',
          fontSize: 11, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        }}>{collapsed ? '›' : '‹'}</button>
      </aside>

      {/* ── Main ── */}
      <div className="main-content" style={{ marginLeft: collapsed ? 64 : 260, transition: 'margin-left .22s ease' }}>
        <header className="topbar">
          <span className="topbar-title" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: ROLE_COLORS[user?.role] || '#2980B9',
              color: '#fff', padding: '3px 10px', borderRadius: 99,
              fontSize: 11, fontWeight: 700, textTransform: 'capitalize'
            }}>{user?.role}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.name}</span>
          </div>
        </header>
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
