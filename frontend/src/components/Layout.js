import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LOGO_PATH, COLLEGE_NAME, COLLEGE_SUB } from '../config/logo';
import { useState } from 'react';

function LogoImage() {
  const [err, setErr] = useState(false);
  if (err) return (
    <div style={{
      width: 48, height: 48, borderRadius: 12, marginBottom: 14,
      background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))',
      border: '1px solid rgba(249,115,22,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 24, boxShadow: '0 4px 16px rgba(249,115,22,0.15)'
    }}>🏛️</div>
  );
  return (
    <img
      src={LOGO_PATH}
      alt="College Logo"
      onError={() => setErr(true)}
      style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 14, borderRadius: 10 }}
    />
  );
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈', emoji: '📊', exact: true, desc: 'Analytics & Overview' },
  { to: '/inventory', label: 'Inventory', icon: '▣', emoji: '📦', desc: 'Items & Stock' },
  { to: '/distributions', label: 'Distributions', icon: '⊞', emoji: '🚚', desc: 'Issue & Return' },
];

const adminItems = [
  { to: '/users', label: 'User Management', emoji: '👥', desc: 'Access Control' },
  { to: '/master', label: 'Master Data', emoji: '⚙️', desc: 'Vendors, Departments' },
  { to: '/audit-logs', label: 'Audit Logs', emoji: '🛡️', desc: 'System Activity' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isDemoActive = localStorage.getItem('isDemo') === 'true';

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo data in localStorage back to default values?')) {
      localStorage.removeItem('demo_items');
      localStorage.removeItem('demo_distributions');
      localStorage.removeItem('demo_alerts');
      localStorage.removeItem('demo_audit');
      localStorage.removeItem('demo_vendors');
      localStorage.removeItem('demo_departments');
      localStorage.removeItem('demo_particulars');
      window.location.reload();
    }
  };
  const filteredAdminItems = isDemoActive
    ? adminItems.filter(item => item.to !== '/audit-logs')
    : adminItems;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const roleColors = { admin: '#f97316', staff: '#60a5fa', viewer: '#a78bfa' };
  const roleColor = roleColors[user?.role] || '#94a3b8';

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>

        {/* Logo Block */}
        <div className="sidebar-logo">
          <LogoImage />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#eef2ff', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
            {COLLEGE_NAME}
          </h2>
          <p style={{ fontSize: 10, color: '#4a5280', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
            {COLLEGE_SUB}
          </p>
          {/* Status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10d96e', boxShadow: '0 0 6px #10d96e', animation: 'spin 2s linear infinite', animationName: 'none', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#4a5280', letterSpacing: '0.5px' }}>System Online</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-section">
          <div className="nav-label">Main Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1, fontWeight: 400 }}>{item.desc}</div>
              </div>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className="nav-label" style={{ marginTop: 20 }}>Administration</div>
              {filteredAdminItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span style={{ fontSize: 18 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1, fontWeight: 400 }}>{item.desc}</div>
                  </div>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Footer — User Card */}
        <div className="sidebar-footer">
          {/* Version Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
            <span style={{ fontSize: 10, color: '#4a5280', letterSpacing: '0.5px' }}>ESTATE MANAGER</span>
            <span style={{ fontSize: 10, background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(249,115,22,0.2)', fontWeight: 600 }}>v2.0</span>
          </div>

          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: roleColor, boxShadow: `0 0 4px ${roleColor}` }} />
                <span style={{ fontSize: 11, color: '#7c85b0', textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile Topbar */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
          <div style={{ fontSize: 13, color: '#7c85b0', fontWeight: 500 }}>
            College Inventory
          </div>
        </div>

        {isDemoActive && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(249,115,22,0.12), rgba(168,85,247,0.08))',
            borderBottom: '1px solid rgba(249,115,22,0.2)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                background: 'rgba(249,115,22,0.2)',
                border: '1px solid rgba(249,115,22,0.4)',
                color: '#fb923c',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 20,
                letterSpacing: '0.5px'
              }}>🧪 DEMO MODE</span>
              <span style={{ fontSize: 12.5, color: '#cbd5e1', fontWeight: 500 }}>
                You are exploring as a guest. All operations are running client-side with <strong>localStorage</strong> database simulation.
              </span>
            </div>
            <button
              onClick={handleResetDemo}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#eef2ff',
                fontSize: 11,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Space Grotesk, sans-serif'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(240,64,64,0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              🔄 Reset Demo Data
            </button>
          </div>
        )}

        <Outlet />
      </main>

      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}
