import { useState, useEffect, useCallback } from 'react';
import { masterAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const TAB_CONFIG = {
  vendors: { label: 'Vendors & Shops', icon: '🏬', color: '#60a5fa', desc: 'Manage supplier and shop records used during item purchasing', singular: 'Vendor' },
  departments: { label: 'Departments', icon: '🏢', color: '#f97316', desc: 'Manage department records, assign budgets and track spending', singular: 'Department' },
  particulars: { label: 'Particulars / Purposes', icon: '🏷️', color: '#a78bfa', desc: 'Manage purpose tags and category labels for distribution records', singular: 'Particular' },
};

// ── Budget progress bar
function BudgetBar({ budget, spent = 0 }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const color = pct > 90 ? '#f04040' : pct > 70 ? '#fbbf24' : '#10d96e';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 10, color: '#4a5280' }}>Used {pct.toFixed(0)}%</span>
        <span style={{ fontSize: 10, color: '#4a5280' }}>Budget: ₹{budget?.toLocaleString('en-IN') || '—'}</span>
      </div>
    </div>
  );
}

// ── Stat pill
function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)', minWidth: 100, flex: 1,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color }}>{value}</span>
      <span style={{ fontSize: 11, color: '#4a5280', marginTop: 2, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export default function MasterDataPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState('vendors');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemBudget, setNewItemBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const [search, setSearch] = useState('');

  const cfg = TAB_CONFIG[activeTab];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await masterAPI.getAll(activeTab);
      setData(res.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); setSearch(''); setEditId(null); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setSaving(true); setError('');
    try {
      const payload = { name: newItemName };
      if (activeTab === 'departments' && newItemBudget) payload.budget = Number(newItemBudget);
      await masterAPI.create(activeTab, payload);
      setNewItemName(''); setNewItemBudget('');
      setSuccess(`${cfg.singular} added successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await masterAPI.delete(activeTab, id);
      setSuccess('Deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch { setError('Failed to delete'); }
  };

  const handleUpdateBudget = async (id, name) => {
    try {
      await masterAPI.update(activeTab, id, { name, budget: Number(editBudget) });
      setEditId(null); setEditBudget('');
      setSuccess('Budget updated!');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch { setError('Failed to update'); }
  };

  if (!can('admin')) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#7c85b0', fontFamily: "'Space Grotesk', sans-serif" }}>Access Restricted</h3>
          <p style={{ color: '#4a5280', marginTop: 8 }}>Only administrators can view this page.</p>
        </div>
      </div>
    );
  }

  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const totalBudget = activeTab === 'departments' ? data.reduce((s, d) => s + (d.budget || 0), 0) : 0;
  const setCount = activeTab === 'departments' ? data.filter(d => d.budget > 0).length : 0;

  return (
    <div className="page" style={{ maxWidth: '100%' }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Master Data</h1>
          <p className="page-subtitle">Configure autocomplete lists, departments, and budget allocations</p>
        </div>
        {/* Summary Pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatPill label="Total Records" value={data.length} color="#f97316" />
          {activeTab === 'departments' && (
            <>
              <StatPill label="Budgets Set" value={setCount} color="#10d96e" />
              <StatPill label="Total Budget" value={`₹${(totalBudget / 100000).toFixed(1)}L`} color="#60a5fa" />
            </>
          )}
        </div>
      </div>

      {/* ── Notifications ── */}
      {success && <div className="alert alert-success">✅ {success}</div>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.entries(TAB_CONFIG).map(([id, t]) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: activeTab === id
                ? `linear-gradient(135deg, ${t.color}20, ${t.color}08)`
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${activeTab === id ? t.color + '40' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 12,
              color: activeTab === id ? t.color : '#4a5280',
              fontWeight: activeTab === id ? 700 : 500,
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: activeTab === id ? `0 4px 20px ${t.color}15` : 'none',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Two Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Data List ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Card Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(0,0,0,0.15)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${cfg.color}15`,
              border: `1px solid ${cfg.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{cfg.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#eef2ff', fontFamily: "'Space Grotesk', sans-serif" }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 12, color: '#4a5280', marginTop: 2 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#4a5280' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                style={{
                  padding: '8px 14px 8px 34px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, color: '#eef2ff',
                  fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', width: 200, transition: 'all 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = cfg.color + '80'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          {/* List Body */}
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{cfg.icon}</div>
              <p style={{ color: '#4a5280', fontSize: 14 }}>
                {search ? `No results for "${search}"` : `No ${activeTab} added yet. Use the form →`}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((item, idx) => (
                <div
                  key={item._id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'background 0.15s',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Index Badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${cfg.color}12`,
                    border: `1px solid ${cfg.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: cfg.color,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{idx + 1}</div>

                  {/* Name + Budget Column */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#eef2ff', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {item.name}
                    </div>
                    {/* Budget bar for departments */}
                    {activeTab === 'departments' && (
                      editId === item._id ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                          <input
                            type="number" autoFocus
                            value={editBudget}
                            onChange={e => setEditBudget(e.target.value)}
                            placeholder="Enter budget..."
                            style={{
                              padding: '6px 10px', background: 'rgba(0,0,0,0.4)',
                              border: `1px solid ${cfg.color}60`, borderRadius: 6,
                              color: '#eef2ff', fontSize: 13, width: 160,
                              fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none',
                            }}
                          />
                          <button
                            onClick={() => handleUpdateBudget(item._id, item.name)}
                            style={{ padding: '6px 12px', background: cfg.color, border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >Save</button>
                          <button
                            onClick={() => setEditId(null)}
                            style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#7c85b0', fontSize: 12, cursor: 'pointer' }}
                          >✕</button>
                        </div>
                      ) : (
                        <BudgetBar budget={item.budget} />
                      )
                    )}
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {activeTab === 'departments' && editId !== item._id && (
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: item.budget ? cfg.color : '#4a5280' }}>
                          {item.budget ? `₹${item.budget.toLocaleString('en-IN')}` : 'No budget'}
                        </div>
                        <button
                          onClick={() => { setEditId(item._id); setEditBudget(item.budget || ''); }}
                          style={{ fontSize: 11, color: '#4a5280', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, padding: 0 }}
                        >✏️ Edit budget</button>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(240,64,64,0.08)',
                        border: '1px solid rgba(240,64,64,0.15)',
                        color: '#f04040', cursor: 'pointer', fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,64,64,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(240,64,64,0.08)'; }}
                      title="Delete"
                    >🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Add Form Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

          {/* Add Form Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#eef2ff', fontFamily: "'Space Grotesk', sans-serif" }}>
                ➕ Add New {cfg.singular}
              </div>
              <div style={{ fontSize: 11, color: '#4a5280', marginTop: 3 }}>{cfg.desc}</div>
            </div>
            <form onSubmit={handleAdd} style={{ padding: '20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {cfg.singular} Name *
                </label>
                <input
                  className="form-control"
                  placeholder={`e.g. ${activeTab === 'vendors' ? 'ABC Traders' : activeTab === 'departments' ? 'Computer Science' : 'Lab Equipment'}`}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  disabled={saving}
                />
              </div>

              {activeTab === 'departments' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, color: '#4a5280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 7, fontFamily: "'Space Grotesk', sans-serif" }}>
                    Annual Budget (₹) <span style={{ color: '#4a5280', fontWeight: 400, textTransform: 'none' }}>— optional</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 500000"
                    value={newItemBudget}
                    onChange={e => setNewItemBudget(e.target.value)}
                    disabled={saving}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !newItemName.trim()}
                style={{
                  width: '100%', padding: '12px',
                  background: newItemName.trim() && !saving
                    ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`
                    : 'rgba(255,255,255,0.05)',
                  border: 'none', borderRadius: 10,
                  color: newItemName.trim() && !saving ? 'white' : '#4a5280',
                  fontWeight: 700, fontSize: 14, cursor: saving || !newItemName.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'all 0.2s',
                  boxShadow: newItemName.trim() && !saving ? `0 4px 16px ${cfg.color}30` : 'none',
                }}
              >
                {saving ? '⏳ Saving...' : `+ Add ${cfg.singular}`}
              </button>
            </form>
          </div>

          {/* Info / Tips Card */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
              💡 Quick Tips
            </div>
            {[
              activeTab === 'vendors' && 'Vendor names appear as autocomplete suggestions when adding new inventory items.',
              activeTab === 'departments' && 'Set a budget per department to track spending on the Dashboard.',
              activeTab === 'departments' && 'Departments are referenced in distribution records to track who received items.',
              activeTab === 'particulars' && 'Purposes appear as autocomplete in the distribution\'s Particulars field.',
            ].filter(Boolean).map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ color: cfg.color, fontSize: 12, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 12, color: '#7c85b0', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* Stats Summary Card — departments only */}
          {activeTab === 'departments' && data.length > 0 && (
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4a5280', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14, fontFamily: "'Space Grotesk', sans-serif" }}>
                📊 Budget Summary
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Departments', value: data.length, color: '#f97316' },
                  { label: 'Budgets Configured', value: setCount, color: '#10d96e' },
                  { label: 'No Budget Set', value: data.length - setCount, color: '#f04040' },
                  { label: 'Total Budget Pool', value: `₹${totalBudget.toLocaleString('en-IN')}`, color: '#60a5fa' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#4a5280' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: "'Space Grotesk', sans-serif" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
