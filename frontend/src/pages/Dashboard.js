import { useState, useEffect, useMemo } from 'react';
import { dashboardAPI, itemsAPI, agentsAPI } from '../api';
import { CATEGORIES } from '../api/constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

// 1. IMPORT ADDED HERE
import SmartAlerts from '../components/SmartAlerts'; 
import AskNirvahana from '../components/AskJarvis';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PALETTE = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#f59e0b','#06b6d4','#84cc16','#ef4444','#10b981'];

const fmt = (n) => {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n/1e3).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

const fmtFull = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const QUICK_FILTERS = [
  { label: '🔴 Out of Stock', key: 'outofstock' },
  { label: '🟡 Low Stock',    key: 'lowstock'   },
  { label: '🟢 In Stock',     key: 'instock'    },
  { label: '💰 High Value',   key: 'highvalue'  },
];

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => {
        const isCurrency = p.name.toLowerCase().includes('amount') || p.name.toLowerCase().includes('cost') || p.name.toLowerCase().includes('value');
        return (
          <p key={i} style={{ color: p.fill || p.stroke || 'var(--accent)', marginBottom: 2 }}>
            {p.name}: <strong>{isCurrency ? fmtFull(p.value) : Number(p.value).toLocaleString('en-IN')}</strong>
          </p>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'var(--accent)', onClick, active }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? color : 'var(--border)',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, borderRadius: '8px 0 0 8px' }} />
      <div style={{ paddingLeft: 8 }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

function StockBar({ purchased, distributed, remaining }) {
  const pct = purchased > 0 ? Math.max(0, (remaining / purchased) * 100) : 0;
  const color = pct === 0 ? '#ef4444' : pct <= 20 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{remaining}/{purchased}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]       = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // inventory filter state
  const [search,           setSearch]           = useState('');
  const [catFilter,        setCatFilter]        = useState('');
  const [quickFilter,      setQuickFilter]      = useState('');
  const [sortBy,           setSortBy]           = useState('name');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(), 
      itemsAPI.getAll({ limit: 200 }), // fetch up to 200 items for dashboard table
      agentsAPI.getForecast().catch(() => ({ data: { forecast: "Forecast currently unavailable." } }))
    ])
      .then(([s, i, f]) => { 
        setStats(s.data); 
        // Handle both old (array) and new paginated response shape
        const itemData = i.data;
        setAllItems(Array.isArray(itemData) ? itemData : (itemData.items || [])); 
        setForecast(f?.data?.forecast); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    let list = [...allItems];
    if (search)     list = list.filter(i => [i.itemName, i.segment, i.company, i.shopName, i.particulars].some(f => f?.toLowerCase().includes(search.toLowerCase())));
    if (catFilter)  list = list.filter(i => i.segment === catFilter);
    if (quickFilter === 'outofstock') list = list.filter(i => (i.quantityRemaining ?? 0) <= 0);
    if (quickFilter === 'lowstock')   list = list.filter(i => (i.quantityRemaining ?? 0) > 0 && (i.quantityRemaining ?? 0) <= 5);
    if (quickFilter === 'instock')    list = list.filter(i => (i.quantityRemaining ?? 0) > 5);
    if (quickFilter === 'highvalue')  list = list.filter(i => (i.totalCost ?? 0) >= 10000);
    if (sortBy === 'remaining')  list.sort((a, b) => (a.quantityRemaining ?? 0) - (b.quantityRemaining ?? 0));
    else if (sortBy === 'purchased') list.sort((a, b) => (b.quantityPurchased ?? 0) - (a.quantityPurchased ?? 0));
    else if (sortBy === 'cost')  list.sort((a, b) => (b.totalCost ?? 0) - (a.totalCost ?? 0));
    else list.sort((a, b) => a.itemName.localeCompare(b.itemName));
    return list;
  }, [allItems, search, catFilter, quickFilter, sortBy]);

  const hasFilters = search || catFilter || quickFilter;
  const clearFilters = () => { setSearch(''); setCatFilter(''); setQuickFilter(''); setSortBy('name'); };

  const exportDepartmentReport = (deptData) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Department Audit Report: ${deptData.department}`, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    doc.text(`Total Units Consumed: ${deptData.quantityDistributed.toLocaleString()}`, 14, 38);
    if (deptData.budget > 0) {
      doc.text(`Consumed Value: ${fmtFull(deptData.estimatedValue)} out of ${fmtFull(deptData.budget)} budget`, 14, 46);
    } else {
      doc.text(`Estimated Consumed Value: ${fmtFull(deptData.estimatedValue)}`, 14, 46);
    }
    
    const tableData = (deptData.topItems || []).map((it, i) => [
      i + 1,
      it.name,
      it.qty.toLocaleString(),
      fmtFull(it.cost)
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['#', 'Item Name', 'Units Used', 'Est. Cost']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    });

    doc.save(`${deptData.department}_Audit_Report.pdf`);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text2)' }}>Loading dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!stats) return <div className="empty-state"><div>Failed to load dashboard</div></div>;

  // Chart data
  const segCostData = (stats.categoryBreakdown || [])
    .filter(c => c.totalCost > 0)
    .slice(0, 12)
    .map(c => ({ category: c.category.length > 14 ? c.category.slice(0, 13) + '…' : c.category, fullName: c.category, totalCost: c.totalCost, purchased: c.purchased, itemCount: c.itemCount }));

  const itemCostData = (stats.topItemsByCost || []).slice(0, 15).map(i => ({
    name: i.itemName.length > 20 ? i.itemName.slice(0, 19) + '…' : i.itemName,
    fullName: i.itemName, segment: i.segment, totalCost: i.totalCost, qty: i.qty
  }));

  const monthlyData = (stats.monthlyTrend || []).map(m => ({
    month: m.month.replace(/^(\d{4})-(\d{2})$/, (_, y, mo) => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
    }),
    totalCost: m.totalCost,
    count: m.count
  }));

  const pieData = segCostData.slice(0, 8).map((c, i) => ({ name: c.fullName, value: c.totalCost, fill: PALETTE[i % PALETTE.length] }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Inventory overview — {allItems.length} items tracked</p>
        </div>
      </div>

      {/* 2. Nirvahana AI AGENT ADDED HERE */}
      <SmartAlerts />
      <AskNirvahana />

      {/* ── STAT CARDS ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="📦" label="Total Items" value={stats.totalItems.toLocaleString()} color="#3b82f6" />
        <StatCard icon="💰" label="Total Purchase Value" value={fmt(stats.totalValue)} sub={fmtFull(stats.totalValue)} color="#f97316" />
        <StatCard icon="🚚" label="Total Distributed" value={stats.totalDistributed.toLocaleString()} color="#a855f7" />
        <StatCard icon="✅" label="In Stock (Remaining)" value={(stats.totalPurchased - stats.totalDistributed).toLocaleString()} color="#22c55e" />
      </div>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon="🔴" label="Out of Stock" value={stats.outOfStockItems} color="#ef4444" />
        <StatCard icon="🟡" label="Low Stock (≤5)" value={stats.lowStockItems} color="#f59e0b" />
        <StatCard icon="🗂️" label="Segments / Categories" value={(stats.categoryBreakdown || []).length} color="#06b6d4" />
        <StatCard icon="📋" label="Distributions Done" value={(stats.recentDistributions?.length ?? 0)} color="#84cc16" />
      </div>

      {/* ── NIRVAHANA FINANCIAL FORECASTER ── */}
      <div className="card" style={{ marginBottom: 24, background: 'var(--forecast-bg)', borderColor: 'var(--forecast-border)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 16px rgba(168,85,247,0.2)' }}>🔮</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, color: 'var(--forecast-text)', margin: 0, fontFamily: 'Syne, sans-serif' }}>Nirvahana 30-Day Budget Forecast</h3>
            <p style={{ fontSize: 13, color: 'var(--forecast-text2)', marginTop: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{forecast || "Calculating projections based on historical velocity..."}</p>
          </div>
        </div>
      </div>

      {/* ── PURCHASE AMOUNT SECTION ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="heading" style={{ fontSize: 16 }}>💰 Purchase Amount Analysis</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Total spend breakdown by category and individual items</p>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, gap: 3, overflowX: 'auto' }}>
            {[['overview','📊 By Category'],['items','📦 By Item'],['trend','📈 Monthly Trend'],['department','🏢 By Department']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setActiveTab(k)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: activeTab === k ? 'var(--accent)' : 'transparent',
                  color: activeTab === k ? 'white' : 'var(--text2)',
                  border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                  transition: 'all 0.15s'
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Tab: By Category */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
              {/* Bar chart */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Purchase amount (₹) per segment — click a bar to drill down</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={segCostData} margin={{ top: 4, right: 8, bottom: 60, left: 10 }}
                    onClick={e => e?.activeLabel && setSelectedCategory(prev => prev === e.activePayload?.[0]?.payload?.fullName ? null : e.activePayload?.[0]?.payload?.fullName)}>
                    <XAxis dataKey="category" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                    <YAxis tickFormatter={fmt} tick={{ fill: 'var(--text3)', fontSize: 10 }} width={52} />
                    <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
                    <Bar dataKey="totalCost" name="Purchase Amount" radius={[4,4,0,0]} maxBarSize={36}>
                      {segCostData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Pie chart */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Share of total spend</p>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false} fontSize={11}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Segment cards with amount */}
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>ALL SEGMENTS — PURCHASE AMOUNT SUMMARY</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {(stats.categoryBreakdown || []).filter(c => c.totalCost > 0).map((cat, i) => (
                  <div
                    key={cat.category}
                    onClick={() => setSelectedCategory(prev => prev === cat.category ? null : cat.category)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: selectedCategory === cat.category ? `${PALETTE[i % PALETTE.length]}18` : 'var(--surface2)',
                      border: `1px solid ${selectedCategory === cat.category ? PALETTE[i % PALETTE.length] : 'var(--border)'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: PALETTE[i % PALETTE.length], fontFamily: 'Syne,sans-serif' }}>{fmt(cat.totalCost)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{cat.itemCount} items · qty {cat.purchased.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: By Item */}
        {activeTab === 'items' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Top 25 items by purchase amount (₹)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Horizontal bar chart */}
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={itemCostData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 10 }}>
                  <XAxis type="number" tickFormatter={fmt} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} width={130} />
                  <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
                  <Bar dataKey="totalCost" name="Purchase Amount" radius={[0,4,4,0]} maxBarSize={20}>
                    {itemCostData.map((d, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Table */}
              <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Segment</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemCostData.map((item, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text2)', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 180 }}>
                          <span title={item.fullName}>{item.fullName.length > 22 ? item.fullName.slice(0, 20) + '…' : item.fullName}</span>
                        </td>
                        <td><span className="badge badge-default" style={{ fontSize: 10 }}>{item.segment}</span></td>
                        <td style={{ fontWeight: 700, color: PALETTE[i % PALETTE.length] }}>{fmtFull(item.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Monthly Trend */}
        {activeTab === 'trend' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Monthly purchase spend trend</p>
            {monthlyData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>No date data available yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 24, bottom: 4, left: 10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis tickFormatter={fmt} tick={{ fill: 'var(--text3)', fontSize: 11 }} width={52} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Line type="monotone" dataKey="totalCost" name="Purchase Amount" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Tab: By Department */}
        {activeTab === 'department' && (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Department distribution (quantity and estimated value)</p>
            {(!stats.departmentBreakdown || stats.departmentBreakdown.length === 0) ? (
              <div className="empty-state" style={{ padding: 40 }}>No distribution data available yet</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
                {/* Bar chart for department quantities */}
                <div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={stats.departmentBreakdown.slice(0, 15)} margin={{ top: 4, right: 8, bottom: 80, left: 10 }}
                      onClick={e => e?.activeLabel && setSelectedDepartment(prev => prev === e.activePayload?.[0]?.payload?.department ? null : e.activePayload?.[0]?.payload?.department)}>
                      <XAxis dataKey="department" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} width={42} />
                      <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
                      <Bar dataKey="quantityDistributed" name="Units Distributed" radius={[4,4,0,0]} maxBarSize={36}>
                          {stats.departmentBreakdown.slice(0, 15).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Pie chart for department estimated value */}
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, textAlign: 'center' }}>Estimated Value Share</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={stats.departmentBreakdown.filter(d => d.estimatedValue > 0).slice(0, 8).map((d, i) => ({ name: d.department, value: d.estimatedValue, fill: PALETTE[i % PALETTE.length] }))}
                        dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false} fontSize={11}
                      >
                        {stats.departmentBreakdown.filter(d => d.estimatedValue > 0).slice(0, 8).map((entry, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }} itemStyle={{ color: 'var(--text)' }} labelStyle={{ color: 'var(--text)' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Department cards with selection capability */}
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 14 }}>ALL DEPARTMENTS — click to see items used</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {(stats.departmentBreakdown || []).map((dept, i) => (
                  <div
                    key={dept.department}
                    onClick={() => setSelectedDepartment(prev => prev === dept.department ? null : dept.department)}
                    style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: selectedDepartment === dept.department ? `${PALETTE[i % PALETTE.length]}18` : 'var(--surface2)',
                      border: `1px solid ${selectedDepartment === dept.department ? PALETTE[i % PALETTE.length] : 'var(--border)'}`,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept.department}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: PALETTE[i % PALETTE.length], fontFamily: 'Syne,sans-serif' }}>{dept.quantityDistributed.toLocaleString()} units</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>{dept.itemsCount} orders · {fmtFull(dept.estimatedValue)}</div>
                    {dept.budget > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginBottom: 2 }}>
                          <span>Budget used:</span>
                          <span>{((dept.estimatedValue / dept.budget) * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (dept.estimatedValue / dept.budget) * 100)}%`, height: '100%', background: (dept.estimatedValue > dept.budget) ? '#ef4444' : PALETTE[i % PALETTE.length] }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── CATEGORY DRILLDOWN when clicked ── */}
      {selectedCategory && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 className="heading" style={{ fontSize: 15 }}>🔍 Drilldown — {selectedCategory}</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>All items in this segment with their purchase amounts</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCategory(null)}>✕ Close</button>
          </div>
          {(() => {
            const segItems = allItems.filter(i => i.segment === selectedCategory);
            const itemMap = {};
            segItems.forEach(it => {
              const k = it.itemName;
              if (!itemMap[k]) itemMap[k] = { itemName: k, totalCost: 0, qty: 0, distributed: 0 };
              itemMap[k].totalCost += it.totalCost || 0;
              itemMap[k].qty       += it.quantityPurchased || 0;
              itemMap[k].distributed += it.quantityDistributed || 0;
            });
            const drillData = Object.values(itemMap).sort((a, b) => b.totalCost - a.totalCost).slice(0, 20);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={drillData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 10 }}>
                    <XAxis type="number" tickFormatter={fmt} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="itemName"
                      tickFormatter={v => v.length > 18 ? v.slice(0, 17) + '…' : v}
                      tick={{ fill: 'var(--text3)', fontSize: 10 }} width={130} />
                    <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
                    <Bar dataKey="totalCost" name="Purchase Amount" fill="var(--accent)" radius={[0,4,4,0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                  <table>
                    <thead><tr><th>Item</th><th>Qty</th><th>Dist.</th><th>Amount</th></tr></thead>
                    <tbody>
                      {drillData.map((it, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 13 }} title={it.itemName}>{it.itemName.length > 20 ? it.itemName.slice(0, 18) + '…' : it.itemName}</td>
                          <td>{it.qty.toLocaleString()}</td>
                          <td style={{ color: '#a855f7' }}>{it.distributed.toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: '#f97316' }}>{fmtFull(it.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── DEPARTMENT DRILLDOWN when clicked ── */}
      {selectedDepartment && (
        <div className="card" style={{ marginBottom: 24, borderColor: '#f97316' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 className="heading" style={{ fontSize: 15 }}>🏢 Department Usage Drilldown — {selectedDepartment}</h3>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>List of items and quantities consumed</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {stats.departmentBreakdown?.find(d => d.department === selectedDepartment) && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => exportDepartmentReport(stats.departmentBreakdown.find(d => d.department === selectedDepartment))}
                >
                  📄 Download PDF
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDepartment(null)}>✕ Close</button>
            </div>
          </div>
          {(() => {
            const deptData = stats.departmentBreakdown?.find(d => d.department === selectedDepartment);
            if (!deptData || !deptData.topItems || deptData.topItems.length === 0) {
              return <div style={{ fontSize: 13, color: 'var(--text2)' }}>No items detail available.</div>;
            }
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={deptData.topItems.slice(0, 15)} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 10 }}>
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name"
                      tickFormatter={v => v.length > 15 ? v.slice(0, 14) + '…' : v}
                      tick={{ fill: 'var(--text3)', fontSize: 10 }} width={110} />
                    <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'var(--accent-glow)' }} />
                    <Bar dataKey="qty" name="Units Consumed" fill="var(--accent)" radius={[0,4,4,0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                  <table>
                    <thead><tr><th>Item Name</th><th>Units Used</th><th>Est. Cost</th></tr></thead>
                    <tbody>
                      {deptData.topItems.map((it, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 13 }} title={it.name}>{it.name.length > 25 ? it.name.slice(0, 23) + '…' : it.name}</td>
                          <td style={{ color: '#a855f7', fontWeight: 600 }}>{it.qty.toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: '#f97316' }}>{fmtFull(it.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── INVENTORY SEARCH & FILTER ── */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
          <input className="form-control" placeholder="🔍  Search item, segment, company…" style={{ flex: 1, minWidth: 220 }}
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 190 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">📂 All Segments</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width: 170 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name A–Z</option>
            <option value="remaining">Sort: Lowest Stock</option>
            <option value="purchased">Sort: Most Purchased</option>
            <option value="cost">Sort: Highest Cost</option>
          </select>
          {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>✕ Clear</button>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Quick:</span>
          {QUICK_FILTERS.map(f => (
            <button key={f.key} onClick={() => setQuickFilter(quickFilter === f.key ? '' : f.key)}
              style={{ padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: quickFilter === f.key ? 'var(--accent)' : 'var(--surface2)',
                borderColor: quickFilter === f.key ? 'var(--accent)' : 'var(--border)',
                color: quickFilter === f.key ? 'white' : 'var(--text2)', transition: 'all 0.15s', fontFamily: 'Syne, sans-serif'
              }}>{f.label}</button>
          ))}
          {hasFilters && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)' }}>Showing <strong style={{ color: 'var(--accent)' }}>{filteredItems.length}</strong> of {allItems.length}</span>}
        </div>
      </div>

      {/* ── INVENTORY TABLE — MATCHES EXCEL COLUMNS ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="heading" style={{ fontSize: 15 }}>📋 Inventory Register</h3>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{filteredItems.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {filteredItems.length === 0 ? (
            <div className="empty-state"><div className="icon">🔍</div><h3>No items match</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Item Name</th>
                  <th>Date of Purchase</th>
                  <th>Company</th>
                  <th>Bill / Invoice No</th>
                  <th>UOM</th>
                  <th>QTY</th>
                  <th>Unit Price</th>
                  <th>Cost of All Units</th>
                  <th>Shop Name</th>
                  <th>Particulars</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.slice(0, 60).map(item => (
                  <tr key={item._id}>
                    <td><span className="badge badge-default" style={{ fontSize: 10 }}>{item.segment || 'OTHER'}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{item.itemName}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {item.dateOfPurchase ? new Date(item.dateOfPurchase).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.company || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.billNo || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.uom || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantityPurchased?.toLocaleString() || 0}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {item.unitPrice ? `₹${item.unitPrice.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#f97316' }}>
                      {item.totalCost ? `₹${item.totalCost.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.shopName || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={item.particulars}>{item.particulars || '—'}</td>
                    <td style={{ minWidth: 130 }}>
                      <StockBar purchased={item.quantityPurchased || 0} distributed={item.quantityDistributed || 0} remaining={item.quantityRemaining ?? item.quantityPurchased ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredItems.length > 60 && (
            <div style={{ padding: '12px 20px', color: 'var(--text2)', fontSize: 13, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
              Showing first 60 of {filteredItems.length} items. Use filters to narrow down.
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT DISTRIBUTIONS ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="heading" style={{ fontSize: 15, marginBottom: 16 }}>🕐 Recent Distributions</h3>
        {!stats.recentDistributions?.length ? (
          <div className="empty-state" style={{ padding: 30 }}>No distributions yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.recentDistributions.map(d => (
              <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🚚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.item?.itemName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    <span className="badge badge-default" style={{ fontSize: 9, marginRight: 6 }}>{d.item?.segment}</span>
                    → {d.distributedToDepartment} · {d.quantityDistributed} units
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{new Date(d.dateOfDistribution).toLocaleDateString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.outOfStockItems > 0 && (
        <div className="alert alert-error">🚨 <strong>{stats.outOfStockItems} item(s) are out of stock.</strong> Please restock soon.</div>
      )}
    </div>
  );
}