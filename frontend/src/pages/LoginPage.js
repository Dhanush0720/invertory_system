import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { COLLEGE_NAME, COLLEGE_SUB, LOGO_PATH } from '../config/logo';

export default function LoginPage() {
  const { token } = useParams();
  const [mode, setMode] = useState(token ? 'reset' : 'login');

  // Sign-in states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Password reset states
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');

  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  // If token changes (e.g. user opens reset link), shift modes
  useEffect(() => {
    if (token) {
      setMode('reset');
      setError('');
      setRegSuccess('');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({ name: regName, email: regEmail, password: regPassword });
      setRegSuccess(res.data.message || 'Registration successful! Pending admin approval.');
      setMode('login');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      setRegSuccess(res.data.message || 'Recovery link sent! Please check console/WhatsApp.');
      setForgotEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery link.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, newPassword);
      setRegSuccess(res.data.message || 'Password reset successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setMode('login');
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}
        {regSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {regSuccess}</div>}

        {mode === 'login' && (
          <>
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
          </>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Create strong password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm password"
                value={regConfirmPassword}
                onChange={e => setRegConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Submitting request...' : '📝 Register Account'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter your registered email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Sending link...' : '🔑 Send Recovery Link'}
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? 'Resetting password...' : '🔄 Reset Password'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'login' && (
            <>
              <button
                onClick={() => { setMode('register'); setError(''); setRegSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Need an account? Request Access
              </button>
              <button
                onClick={() => { setMode('forgot'); setError(''); setRegSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}
              >
                Forgot Password?
              </button>
            </>
          )}
          {mode === 'register' && (
            <button
              onClick={() => { setMode('login'); setError(''); setRegSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Already have an account? Sign In
            </button>
          )}
          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); setError(''); setRegSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => { setMode('login'); setError(''); setRegSuccess(''); navigate('/login'); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
