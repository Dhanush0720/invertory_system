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
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
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
              {adminItems.map(item => (
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
        <Outlet />
      </main>

      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}
