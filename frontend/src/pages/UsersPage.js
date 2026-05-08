import { useState, useEffect } from 'react';
import { usersAPI } from '../api';
import { ROLE_COLORS, ROLE_LABELS } from '../api/constants';

const emptyForm = { name: '', email: '', password: '', role: 'viewer' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await usersAPI.getAll(); setUsers(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditUser(null); setError(''); setShowModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editUser) await usersAPI.update(editUser._id, form);
      else await usersAPI.create(form);
      setShowModal(false);
      setSuccess(editUser ? 'User updated!' : 'User created!');
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    try {
      await usersAPI.update(u._id, { isActive: !u.isActive });
      fetchUsers();
    } catch (err) { alert('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await usersAPI.delete(id); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 User Management</h1>
          <p className="page-subtitle">Control who can access the inventory system</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: ROLE_COLORS[role], display: 'inline-block' }} />
            <span style={{ fontSize: 13 }}><strong>{label}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {role === 'admin' ? '— Full access' : role === 'staff' ? '— Add & distribute' : '— Read only'}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: ROLE_COLORS[u.role] + '22',
                          border: `2px solid ${ROLE_COLORS[u.role]}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: ROLE_COLORS[u.role],
                          fontFamily: 'Syne, sans-serif'
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{ background: ROLE_COLORS[u.role] + '22', color: ROLE_COLORS[u.role] }}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u)} style={{ color: u.isActive ? 'var(--warning)' : 'var(--success)' }}>
                          {u.isActive ? '🚫 Disable' : '✅ Enable'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editUser ? '✏️ Edit User' : '👤 Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" placeholder="e.g. Sathish Kumar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-control" placeholder="e.g. sathish@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required disabled={!!editUser} />
              </div>
              <div className="form-group">
                <label className="form-label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} minLength={editUser ? 0 : 6} />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">👑 Admin — Full access</option>
                  <option value="staff">📦 Staff / Estate Manager — Add & distribute</option>
                  <option value="viewer">👁️ Viewer — Read only</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
