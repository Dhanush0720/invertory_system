import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLLEGE_NAME, COLLEGE_SUB, LOGO_PATH } from '../config/logo';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈', emoji: '📊', exact: true, desc: 'Analytics & Overview' },
  { to: '/inventory', label: 'Inventory', icon: '▣', emoji: '📦', desc: 'Items & Stock' },
  { to: '/distributions', label: 'Distributions', icon: '⊞', emoji: '🚚', desc: 'Issue & Return' },
  { to: '/mess', label: 'Mess Management', icon: '⊠', emoji: '🍽️', desc: 'Kitchen & Grocery' },
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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const isMobile = window.innerWidth <= 768;
  const effectiveCollapsed = sidebarCollapsed && !isMobile;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if ((user?.role === 'mess' || user?.role === 'mess_staff') && location.pathname !== '/mess') {
      navigate('/mess', { replace: true });
    }
  }, [user, location.pathname, navigate]);

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
      localStorage.removeItem('demo_mess_items');
      localStorage.removeItem('demo_mess_logs');
      localStorage.removeItem('demo_mess_menu');
      window.location.reload();
    }
  };
  const filteredAdminItems = isDemoActive
    ? adminItems.filter(item => item.to !== '/audit-logs')
    : adminItems;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const roleColors = { admin: 'var(--accent)', staff: 'var(--info)', viewer: 'var(--purple)', mess: 'var(--accent)', mess_staff: '#ec4899' };
  const roleColor = roleColors[user?.role] || 'var(--text3)';

  return (
    <div className={`app-layout ${effectiveCollapsed ? 'collapsed' : ''}`}>
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>

        {/* Logo Block */}
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: effectiveCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
            <img src={LOGO_PATH} alt="Logo" style={{ height: 36, width: 36, borderRadius: '8px', objectFit: 'contain' }} />
            {!effectiveCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  fontSize: 15,
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition)'
                }}
                className="collapse-toggle-btn"
                title="Collapse Sidebar"
              >
                ⇠
              </button>
            )}
          </div>
          {effectiveCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text3)',
                cursor: 'pointer',
                fontSize: 15,
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition)',
                marginTop: 8
              }}
              className="collapse-toggle-btn"
              title="Expand Sidebar"
            >
              ➔
            </button>
          ) : (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
                {COLLEGE_NAME}
              </h2>
              <p className="sidebar-subtitle" style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                {COLLEGE_SUB}
              </p>
            </>
          )}
          {/* Status dot */}
          <div className="system-status" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.5px' }}>System Online</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-section">
          <div className="nav-label">Main Navigation</div>
          {navItems.filter(item => {
            if (user?.role === 'mess' || user?.role === 'mess_staff') {
              return item.to === '/mess';
            }
            return true;
          }).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              title={effectiveCollapsed ? item.label : ""}
            >
              <span style={{ fontSize: 18 }} className="icon">{item.emoji}</span>
              <div style={{ flex: 1 }} className="nav-text">
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
                  title={effectiveCollapsed ? item.label : ""}
                >
                  <span style={{ fontSize: 18 }} className="icon">{item.emoji}</span>
                  <div style={{ flex: 1 }} className="nav-text">
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
          <div className="version-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px', width: '100%' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.5px' }}>ESTATE MANAGER</span>
            <span style={{ fontSize: 10, background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 7px', borderRadius: 20, border: '1px solid var(--border)', fontWeight: 600 }}>v3.0</span>
          </div>

          {/* PWA Install Button */}
          {deferredPrompt && !effectiveCollapsed && (
            <button
              onClick={handleInstallClick}
              style={{
                width: '100%',
                marginBottom: 12,
                background: 'linear-gradient(135deg, var(--accent), #ea580c)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(94, 106, 210, 0.25)',
                fontFamily: 'var(--font-heading)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              📱 Install Application
            </button>
          )}

          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: roleColor, boxShadow: `0 0 4px ${roleColor}` }} />
                <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="footer-actions">
              <button
                type="button"
                className="theme-toggle-btn"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text3)', cursor: 'pointer',
                  fontSize: 14, padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--transition)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button className="logout-btn" onClick={handleLogout} title="Logout" style={{ padding: '6px' }}>
                🚪
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile Topbar */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>
            College Inventory
          </div>
        </div>

        {isDemoActive && (
          <div style={{
            background: 'linear-gradient(90deg, var(--accent-subtle), transparent)',
            borderBottom: '1px solid var(--border)',
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
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                color: 'var(--accent-hover)',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 20,
                letterSpacing: '0.5px'
              }}>🧪 DEMO MODE</span>
              <span style={{ fontSize: 12.5, color: 'var(--text2)', fontWeight: 500 }}>
                You are exploring as a guest. All operations are running client-side with <strong>localStorage</strong> database simulation.
              </span>
            </div>
            <button
              onClick={handleResetDemo}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 11,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-heading)'
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
