import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLLEGE_NAME, COLLEGE_SUB, LOGO_PATH } from '../config/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={LOGO_PATH} alt="Logo" style={{ height: 60, width: 60, borderRadius: '12px', objectFit: 'contain', marginBottom: 16 }} />
          <h1>{COLLEGE_NAME}</h1>
          <p>{COLLEGE_SUB}</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <div style={{ margin: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            fontSize: 15,
            background: 'var(--accent-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--accent-hover)',
            boxShadow: '0 4px 12px var(--accent-glow)',
            fontWeight: 700
          }}
        >
          ✨ Explore Guest Demo
        </button>

      </div>
    </div>
  );
}
