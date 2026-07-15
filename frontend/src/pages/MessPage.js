import React, { useState, useEffect, useCallback } from 'react';
import { messAPI } from '../api';
import MessExcelImportModal from '../components/MessExcelImportModal';
import { useAuth } from '../context/AuthContext';

// ─── Shared style helpers ─────────────────────────────────────────────────────
const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
  position: 'relative',
  overflow: 'hidden',
};

const btnPrimary = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 20px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
  transition: 'all var(--transition)',
  letterSpacing: '0.3px',
};

const btnSecondary = {
  background: 'var(--accent-subtle)',
  color: 'var(--accent)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
  transition: 'all var(--transition)',
};

const btnDanger = {
  background: 'rgba(240,64,64,0.1)',
  color: '#f04040',
  border: '1px solid rgba(240,64,64,0.25)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontWeight: 600,
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
};

const inputStyle = {
  background: 'var(--input-bg, var(--bg))',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition)',
  outline: 'none',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text2)',
  marginBottom: 5,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const CATEGORIES = ['GROCERY', 'VEGETABLE', 'DAIRY', 'SPICE', 'FRUIT', 'MEAT', 'OTHER'];
const UOM_OPTIONS = ['Kg', 'Litre', 'Nos', 'Packet', 'Dozen'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Tab Button Component ─────────────────────────────────────────────────────
function TabButton({ active, label, emoji, onClick }) {
  return (
    <button
      onClick={onClick}
      className="tab-button"
      style={{
        background: active ? 'var(--accent)' : 'var(--accent-subtle)',
        color: active ? '#fff' : 'var(--text2)',
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 20px',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        fontFamily: 'var(--font-heading)',
        transition: 'all var(--transition)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      {label}
    </button>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StockBadge({ quantity, threshold }) {
  const isExpiring = false; // placeholder
  let color = 'var(--success)';
  let label = 'In Stock';
  if (quantity <= 0) { color = '#f04040'; label = 'Out of Stock'; }
  else if (quantity <= threshold) { color = 'var(--warning, #f5a623)'; label = 'Low Stock'; }

  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}40`,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. STOCK CATALOG TAB
// ═════════════════════════════════════════════════════════════════════════════
function StockCatalogTab() {
  const { can, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    nameTelugu: '',
    category: 'GROCERY',
    quantity: '',
    uom: 'Kg',
    threshold: '10',
    costPerUnit: '',
    varianceReason: ''
  });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messAPI.getItems();
      setItems(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        threshold: Number(form.threshold),
        costPerUnit: Number(form.costPerUnit || 0)
      };

      if (editingItem) {
        await messAPI.updateItem(editingItem._id, payload);
      } else {
        await messAPI.createItem(payload);
      }
      setShowForm(false);
      setEditingItem(null);
      setForm({ name: '', nameTelugu: '', category: 'GROCERY', quantity: '', uom: 'Kg', threshold: '10', costPerUnit: '', varianceReason: '' });
      loadItems();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      nameTelugu: item.nameTelugu || '',
      category: item.category,
      quantity: item.quantity,
      uom: item.uom,
      threshold: item.threshold,
      costPerUnit: item.costPerUnit || '',
      varianceReason: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const reason = window.prompt('To delete this mess item, please enter the reason for deletion (Mandatory):');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Item deletion cancelled. A valid reason is mandatory.');
      return;
    }
    try {
      await messAPI.deleteItem(id, reason.trim());
      loadItems();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = items.filter(i => {
    if (filter !== 'ALL' && i.category !== filter) return false;
    if (search && !(
      i.name.toLowerCase().includes(search.toLowerCase()) || 
      (i.nameTelugu && i.nameTelugu.toLowerCase().includes(search.toLowerCase()))
    )) return false;
    return true;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.threshold && i.quantity > 0).length;
  const outOfStockCount = items.filter(i => i.quantity <= 0).length;
  const totalValue = items.reduce((acc, i) => acc + (i.quantity * i.costPerUnit), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Items', value: items.length, emoji: '📦', color: 'var(--accent)' },
          { label: 'Low Stock', value: lowStockCount, emoji: '⚠️', color: 'var(--warning, #f5a623)' },
          { label: 'Out of Stock', value: outOfStockCount, emoji: '🔴', color: '#f04040' },
          { label: 'Stock Value', value: `₹${totalValue.toLocaleString('en-IN')}`, emoji: '💰', color: 'var(--success)' },
        ].map((kpi, idx) => (
          <div key={idx} style={{
            ...cardStyle, padding: 18,
            background: `linear-gradient(135deg, ${kpi.color}08, ${kpi.color}04)`,
            borderColor: `${kpi.color}30`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{kpi.emoji}</span>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{kpi.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 2 }}>{kpi.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {can('add') && (
          <button style={btnPrimary} onClick={() => {
            setShowForm(!showForm);
            setEditingItem(null);
            setForm({ name: '', nameTelugu: '', category: 'GROCERY', quantity: '', uom: 'Kg', threshold: '10', costPerUnit: '' });
          }}>
            {showForm ? '✕ Cancel' : '＋ Add Item'}
          </button>
        )}
        <input
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 240 }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...selectStyle, maxWidth: 160 }}>
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={async () => {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();
            doc.setFontSize(18); doc.setFont('helvetica', 'bold');
            doc.text('Mess Stock Report', 14, 20);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Items: ${filtered.length} | Value: ₹${totalValue.toLocaleString('en-IN')}`, 14, 28);
            autoTable(doc, {
              startY: 35,
              head: [['Item', 'Telugu Name', 'Category', 'Qty', 'UOM', 'Cost/Unit', 'Total Value', 'Status']],
              body: filtered.map(i => [
                i.name,
                i.nameTelugu || '—',
                i.category,
                i.quantity,
                i.uom,
                `₹${i.costPerUnit}`,
                `₹${(i.quantity * i.costPerUnit).toLocaleString('en-IN')}`,
                i.quantity <= 0 ? 'OUT' : i.quantity <= i.threshold ? 'LOW' : 'OK'
              ]),
              theme: 'grid', headStyles: { fillColor: [94, 106, 210] },
              styles: { fontSize: 8 }
            });
            doc.save('Mess_Stock_Report.pdf');
          }}>📄 PDF</button>
          <button style={btnSecondary} onClick={async () => {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(filtered.map(i => ({
              'Item Name': i.name,
              'Telugu Name': i.nameTelugu || '',
              Category: i.category,
              Quantity: i.quantity,
              UOM: i.uom,
              'Cost/Unit': i.costPerUnit,
              'Total Value': i.quantity * i.costPerUnit,
              Status: i.quantity <= 0 ? 'Out of Stock' : i.quantity <= i.threshold ? 'Low Stock' : 'In Stock'
            })));
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Mess Stock');
            XLSX.writeFile(wb, 'Mess_Stock_Report.xlsx');
          }}>📗 Excel</button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, fontFamily: 'var(--font-heading)' }}>
            {editingItem ? '✏️ Edit Item' : '📝 Add New Mess Item'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div><label style={labelStyle}>Item Name</label><input style={inputStyle} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basmati Rice" /></div>
            <div><label style={labelStyle}>Telugu Name</label><input style={inputStyle} value={form.nameTelugu} onChange={e => setForm({ ...form, nameTelugu: e.target.value })} placeholder="e.g. ఉల్లిపాయ" /></div>
            <div><label style={labelStyle}>Category</label><select style={selectStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>Quantity</label><input style={inputStyle} required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><label style={labelStyle}>Unit</label><select style={selectStyle} value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })}>{UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            {user?.role === 'admin' && (
              <div><label style={labelStyle}>Low Stock Threshold</label><input style={inputStyle} type="number" min="0" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} /></div>
            )}
            <div><label style={labelStyle}>Cost/Unit (₹)</label><input style={inputStyle} type="number" min="0" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} /></div>
            {editingItem && Number(form.quantity) !== Number(editingItem.quantity) && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ ...labelStyle, color: 'var(--warning, #f5a623)', fontWeight: 'bold' }}>⚠️ Stock Adjustment Reason *</label>
                <select style={{ ...selectStyle, borderColor: 'var(--warning, #f5a623)' }} value={form.varianceReason || ''} onChange={e => setForm({ ...form, varianceReason: e.target.value })} required>
                  <option value="">-- Select reason for quantity change --</option>
                  <option value="Cycle Count Correction">Cycle Count Correction</option>
                  <option value="Damaged / Broken">Damaged / Broken</option>
                  <option value="Data Entry Correction">Data Entry Correction</option>
                  <option value="Theft / Lost">Theft / Lost</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" style={btnPrimary}>{editingItem ? 'Update Item' : 'Add Item'}</button>
            <button type="button" style={btnSecondary} onClick={() => { setShowForm(false); setEditingItem(null); }}>Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading stock data...</div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Item Name', 'Category', 'Qty', 'UOM', 'Cost/Unit', 'Total Value', 'Status', (can('edit') || can('delete')) ? 'Actions' : ''].filter(Boolean).map((h, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>
                    <div>{item.name}</div>
                    {item.nameTelugu && <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginTop: 2 }}>{item.nameTelugu}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, border: '1px solid var(--border)' }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text3)' }}>{item.uom}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>₹{item.costPerUnit}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>₹{(item.quantity * item.costPerUnit).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}><StockBadge quantity={item.quantity} threshold={item.threshold} /></td>
                  {(can('edit') || can('delete')) && (
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {can('edit') && <button style={btnSecondary} onClick={() => handleEdit(item)}>✏️</button>}
                        {can('delete') && <button style={btnDanger} onClick={() => handleDelete(item._id)}>🗑️</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. CONSUMPTION LOGGER TAB
// ═════════════════════════════════════════════════════════════════════════════
function ConsumptionLoggerTab() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState('LUNCH');
  const UOM_OPTIONS = ['Kg', 'Grams', 'Packets', 'Liters', 'Nos', 'Boxes', 'Bags', 'Bundles', 'Pieces'];
  const [usedEntries, setUsedEntries] = useState([{ item: '', qtyUsed: '', uom: '' }]);
  const [spoilEntries, setSpoilEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // New fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [issuedBy, setIssuedBy] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [purposeOfUsed, setPurposeOfUsed] = useState('');
  const [particulars, setParticulars] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, logsRes] = await Promise.all([messAPI.getItems(), messAPI.getConsumptionLogs()]);
      setItems(itemsRes.data);
      setLogs(logsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const itemsUsed = usedEntries.filter(u => u.item && u.qtyUsed > 0).map(u => ({ item: u.item, qtyUsed: Number(u.qtyUsed), uom: u.uom || 'Kg' }));
      const spoilage = spoilEntries.filter(s => s.item && s.qtySpoiled > 0).map(s => ({ item: s.item, qtySpoiled: Number(s.qtySpoiled), reason: s.reason || '', uom: s.uom || 'Kg' }));
      if (itemsUsed.length === 0 && spoilage.length === 0) { alert('Add at least one item consumed or spoiled'); setSubmitting(false); return; }
      
      await messAPI.logConsumption({
        mealType,
        itemsUsed,
        spoilage,
        date,
        issuedBy,
        issuedTo,
        purposeOfUsed,
        particulars
      });

      setUsedEntries([{ item: '', qtyUsed: '', uom: '' }]);
      setSpoilEntries([]);
      setIssuedBy('');
      setIssuedTo('');
      setPurposeOfUsed('');
      setParticulars('');
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Error logging consumption');
    }
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Log Form */}
      {can('add') && (
        <form onSubmit={handleLog} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📋</span> Log Daily Consumption
        </div>

        {/* Issued Context Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Date of Issued</label>
            <input style={inputStyle} type="date" required value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Issued By</label>
            <input style={inputStyle} placeholder="e.g. Murali krishna" value={issuedBy} onChange={e => setIssuedBy(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Issued To</label>
            <input style={inputStyle} placeholder="e.g. MAREYAMMA-MASTER" value={issuedTo} onChange={e => setIssuedTo(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Purpose of Cooking</label>
            <input style={inputStyle} placeholder="e.g. SAMBAR, TIFFIN, VEG CURRY" value={purposeOfUsed} onChange={e => setPurposeOfUsed(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Particulars (For Extra Cooking)</label>
            <input style={inputStyle} placeholder="e.g. FOR FFC PURPOSE 50 MEMBERS EXTRA TIFFIN,LUNCH" value={particulars} onChange={e => setParticulars(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Meal Type</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {MEAL_TYPES.map(m => (
              <button key={m} type="button"
                onClick={() => setMealType(m)}
                style={{
                  ...btnSecondary,
                  background: mealType === m ? 'var(--accent)' : 'var(--accent-subtle)',
                  color: mealType === m ? '#fff' : 'var(--text2)',
                  border: mealType === m ? '1px solid var(--accent)' : '1px solid var(--border)',
                  fontWeight: mealType === m ? 700 : 500,
                }}
              >
                {m === 'BREAKFAST' ? '🌅' : m === 'LUNCH' ? '☀️' : m === 'SNACKS' ? '🍪' : '🌙'} {m}
              </button>
            ))}
          </div>
        </div>

        {/* Items Used */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Items Consumed</label>
            <button type="button" style={{ ...btnSecondary, padding: '4px 12px', fontSize: 11 }} onClick={() => setUsedEntries([...usedEntries, { item: '', qtyUsed: '', uom: '' }])}>+ Add Row</button>
          </div>
          {usedEntries.map((entry, idx) => {
            const selectedItem = items.find(i => i._id === entry.item);
            return (
            <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
              <select style={{ ...selectStyle, flex: 2 }} value={entry.item} onChange={e => { const copy = [...usedEntries]; copy[idx].item = e.target.value; const selItem = items.find(i => i._id === e.target.value); if (selItem) copy[idx].uom = selItem.uom || 'Kg'; else copy[idx].uom = ''; setUsedEntries(copy); }}>
                <option value="">Select item...</option>
                {items.map(i => <option key={i._id} value={i._id}>{i.name} {i.nameTelugu ? `(${i.nameTelugu})` : ''} ({i.quantity} {i.uom} avail)</option>)}
              </select>
              <div style={{ flex: 1 }}>
                <input style={inputStyle} type="number" min="0" step="0.1" placeholder="Qty used" value={entry.qtyUsed}
                  onChange={e => { const copy = [...usedEntries]; copy[idx].qtyUsed = e.target.value; setUsedEntries(copy); }} />
              </div>
              <div style={{ width: 100 }}>
                <select style={{ ...selectStyle, textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }} value={entry.uom} onChange={e => { const copy = [...usedEntries]; copy[idx].uom = e.target.value; setUsedEntries(copy); }}>
                  <option value="">Unit</option>
                  {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {usedEntries.length > 1 && (
                <button type="button" style={{ ...btnDanger, padding: '6px 10px' }} onClick={() => setUsedEntries(usedEntries.filter((_, i) => i !== idx))}>✕</button>
              )}
            </div>
            );
          })}
        </div>

        {/* Spoilage */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Spoilage / Waste (Optional)</label>
            <button type="button" style={{ ...btnSecondary, padding: '4px 12px', fontSize: 11 }} onClick={() => setSpoilEntries([...spoilEntries, { item: '', qtySpoiled: '', reason: '', uom: '' }])}>+ Add Spoilage</button>
          </div>
          {spoilEntries.map((entry, idx) => {
            const selectedItem = items.find(i => i._id === entry.item);
            return (
            <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
              <select style={{ ...selectStyle, flex: 2 }} value={entry.item} onChange={e => { const copy = [...spoilEntries]; copy[idx].item = e.target.value; const selItem = items.find(i => i._id === e.target.value); if (selItem) copy[idx].uom = selItem.uom || 'Kg'; else copy[idx].uom = ''; setSpoilEntries(copy); }}>
                <option value="">Select item...</option>
                {items.map(i => <option key={i._id} value={i._id}>{i.name} {i.nameTelugu ? `(${i.nameTelugu})` : ''} ({i.quantity} {i.uom})</option>)}
              </select>
              <div style={{ flex: 1 }}>
                <input style={inputStyle} type="number" min="0" step="0.1" placeholder="Qty spoiled" value={entry.qtySpoiled}
                  onChange={e => { const copy = [...spoilEntries]; copy[idx].qtySpoiled = e.target.value; setSpoilEntries(copy); }} />
              </div>
              <div style={{ width: 100 }}>
                <select style={{ ...selectStyle, textAlign: 'center', fontWeight: 600, color: 'var(--accent)' }} value={entry.uom} onChange={e => { const copy = [...spoilEntries]; copy[idx].uom = e.target.value; setSpoilEntries(copy); }}>
                  <option value="">Unit</option>
                  {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <input style={{ ...inputStyle, flex: 1.5 }} placeholder="Reason (e.g. rotted)" value={entry.reason}
                onChange={e => { const copy = [...spoilEntries]; copy[idx].reason = e.target.value; setSpoilEntries(copy); }} />
              <button type="button" style={{ ...btnDanger, padding: '6px 10px' }} onClick={() => setSpoilEntries(spoilEntries.filter((_, i) => i !== idx))}>✕</button>
            </div>
            );
          })}
        </div>

        <button type="submit" disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Logging...' : '✅ Log Consumption'}
        </button>
      </form>
      )}

      {/* History Table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📜</span> Consumption History
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No consumption logs yet. Start by logging a meal above!</div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Meal', 'Items Consumed', 'Spoilage', 'Issued To', 'Issued By', 'Purpose / Particulars', 'Logged By'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map(log => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, border: '1px solid var(--border)' }}>{log.mealType}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: 11 }}>
                      {log.itemsUsed?.map(u => `${u.item?.name || 'Item'}: ${u.qtyUsed} ${u.item?.uom || ''}`).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11 }}>
                      {log.spoilage?.length > 0 ? (
                        <span style={{ color: '#f04040' }}>{log.spoilage.map(s => `${s.item?.name || 'Item'}: ${s.qtySpoiled} (${s.reason})`).join(', ')}</span>
                      ) : <span style={{ color: 'var(--text3)' }}>None</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{log.issuedTo || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{log.issuedBy || '—'}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text3)', fontSize: 11 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{log.purposeOfUsed || '—'}</div>
                      {log.particulars && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{log.particulars}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text3)' }}>{log.recordedBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. WEEKLY MENU TAB
// ═════════════════════════════════════════════════════════════════════════════
function WeeklyMenuTab() {
  const { can } = useAuth();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDay, setEditDay] = useState(null);
  const [editMeals, setEditMeals] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messAPI.getMenu();
      setMenu(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEditDay = (day) => {
    const dayData = menu.find(m => m.dayOfWeek === day);
    setEditDay(day);
    setEditMeals(dayData?.meals ? JSON.parse(JSON.stringify(dayData.meals)) : {
      breakfast: { name: '', ingredients: [] },
      lunch: { name: '', ingredients: [] },
      snacks: { name: '', ingredients: [] },
      dinner: { name: '', ingredients: [] },
    });
  };

  const handleSaveDay = async () => {
    try {
      await messAPI.updateMenuDay(editDay, { meals: editMeals });
      setEditDay(null);
      setEditMeals(null);
      load();
    } catch (e) {
      alert('Error saving menu');
    }
  };

  const mealEmojis = { breakfast: '🌅', lunch: '☀️', snacks: '🍪', dinner: '🌙' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Edit Panel */}
      {editDay && editMeals && (
        <div style={{ ...cardStyle, borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontFamily: 'var(--font-heading)' }}>
            ✏️ Editing Menu: <span style={{ color: 'var(--accent)' }}>{editDay}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {['breakfast', 'lunch', 'snacks', 'dinner'].map(mealKey => (
              <div key={mealKey} style={{ background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10, textTransform: 'capitalize' }}>
                  {mealEmojis[mealKey]} {mealKey}
                </div>
                <input
                  style={{ ...inputStyle, marginBottom: 8 }}
                  placeholder="Dish name..."
                  value={editMeals[mealKey]?.name || ''}
                  onChange={e => {
                    const copy = { ...editMeals };
                    if (!copy[mealKey]) copy[mealKey] = { name: '', ingredients: [] };
                    copy[mealKey].name = e.target.value;
                    setEditMeals(copy);
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button style={btnPrimary} onClick={handleSaveDay}>💾 Save Changes</button>
            <button style={btnSecondary} onClick={() => { setEditDay(null); setEditMeals(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Menu Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading menu...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {DAYS.map(day => {
            const dayData = menu.find(m => m.dayOfWeek === day);
            const meals = dayData?.meals || {};
            const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
            return (
              <div key={day} style={{
                ...cardStyle,
                borderColor: isToday ? 'var(--accent)' : 'var(--border)',
                boxShadow: isToday ? '0 0 20px var(--accent-glow)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>{day}</div>
                    {isToday && <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>📍 TODAY</span>}
                  </div>
                  {can('manage_menu') && (
                    <button style={{ ...btnSecondary, padding: '5px 10px', fontSize: 11 }} onClick={() => handleEditDay(day)}>✏️ Edit</button>
                  )}
                </div>
                {['breakfast', 'lunch', 'snacks', 'dinner'].map(mealKey => (
                  <div key={mealKey} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10,
                    padding: '8px 10px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>{mealEmojis[mealKey]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{mealKey}</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>
                        {meals[mealKey]?.name || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Not set</span>}
                      </div>
                      {meals[mealKey]?.ingredients?.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                          Needs: {meals[mealKey].ingredients.map(i => i.itemName).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. AI FORECAST TAB
// ═════════════════════════════════════════════════════════════════════════════
function AIForecastTab() {
  const [forecast, setForecast] = useState([]);
  const [students, setStudents] = useState(100);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const runForecast = async () => {
    setLoading(true);
    try {
      const res = await messAPI.getForecast(students);
      setForecast(res.data);
      setCalculated(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const totalShortage = forecast.reduce((acc, f) => acc + f.shortage, 0);
  const totalCost = forecast.reduce((acc, f) => acc + f.estimatedCost, 0);
  const shortageItems = forecast.filter(f => f.shortage > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🤖</span> Nirvahana Mess Demand Forecast
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
            Calculates weekly ingredient demand based on your menu plan and student count. Identifies shortages and generates purchase order estimates.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Students Count</label>
            <input style={{ ...inputStyle, width: 120 }} type="number" min="1" max="5000" value={students} onChange={e => setStudents(Number(e.target.value))} />
          </div>
          <button style={{ ...btnPrimary, padding: '10px 24px' }} onClick={runForecast} disabled={loading}>
            {loading ? '🔄 Calculating...' : '⚡ Run Forecast'}
          </button>
          {calculated && shortageItems.length > 0 && (
            <button style={{ ...btnSecondary, padding: '10px 18px' }} onClick={async () => {
              const { default: jsPDF } = await import('jspdf');
              const { default: autoTable } = await import('jspdf-autotable');
              const doc = new jsPDF();
              // Header
              doc.setFontSize(20); doc.setFont('helvetica', 'bold');
              doc.text('PURCHASE ORDER', 14, 22);
              doc.setFontSize(10); doc.setFont('helvetica', 'normal');
              doc.text(`College Hostel Mess Management`, 14, 30);
              doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 36);
              doc.text(`Students: ${students} | Forecast Period: 1 Week`, 14, 42);
              doc.setDrawColor(94, 106, 210); doc.setLineWidth(0.5);
              doc.line(14, 46, 196, 46);
              // Summary
              doc.setFontSize(12); doc.setFont('helvetica', 'bold');
              doc.text('Order Summary', 14, 54);
              doc.setFontSize(10); doc.setFont('helvetica', 'normal');
              doc.text(`Total Items to Purchase: ${shortageItems.length}`, 14, 62);
              doc.text(`Estimated Total Cost: \u20b9${totalCost.toLocaleString('en-IN')}`, 14, 68);
              // Table
              autoTable(doc, {
                startY: 76,
                head: [['#', 'Item', 'Category', 'Required', 'In Stock', 'To Purchase', 'Est. Cost']],
                body: shortageItems.map((f, i) => [
                  i + 1, f.name, f.category, `${f.required.toFixed(1)} ${f.uom}`,
                  `${f.currentStock} ${f.uom}`, `${f.shortage.toFixed(1)} ${f.uom}`,
                  `\u20b9${f.estimatedCost.toFixed(0)}`
                ]),
                theme: 'grid',
                headStyles: { fillColor: [94, 106, 210] },
                foot: [['', '', '', '', '', 'TOTAL', `\u20b9${totalCost.toLocaleString('en-IN')}`]],
                footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
              });
              // Footer
              const finalY = doc.lastAutoTable.finalY + 20;
              doc.setFontSize(9); doc.setTextColor(120);
              doc.text('Generated by Nirvahana AI \u2014 College Estate Manager', 14, finalY);
              doc.text('This is an auto-generated purchase order based on menu-driven demand forecasting.', 14, finalY + 5);
              doc.save(`Purchase_Order_${new Date().toISOString().split('T')[0]}.pdf`);
            }}>
              📋 Generate Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {calculated && !loading && (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--accent)08, transparent)', borderColor: 'var(--accent)30' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Ingredients</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{forecast.length}</div>
            </div>
            <div style={{ ...cardStyle, padding: 18, background: shortageItems.length > 0 ? 'linear-gradient(135deg, rgba(240,64,64,0.08), transparent)' : 'linear-gradient(135deg, var(--success)08, transparent)' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Shortage Items</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: shortageItems.length > 0 ? '#f04040' : 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{shortageItems.length}</div>
            </div>
            <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, rgba(245,166,35,0.08), transparent)' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Purchase Cost</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>₹{totalCost.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Shortage Alert */}
          {shortageItems.length > 0 && (
            <div style={{
              ...cardStyle, padding: 16,
              background: 'linear-gradient(135deg, rgba(240,64,64,0.08), rgba(245,166,35,0.05))',
              borderColor: 'rgba(240,64,64,0.3)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f04040', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⚠️</span> Purchase Required — {shortageItems.length} items have insufficient stock
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {shortageItems.map((f, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                        Need: {f.required.toFixed(1)} {f.uom} | Have: {f.currentStock} {f.uom}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f04040' }}>-{f.shortage.toFixed(1)} {f.uom}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>₹{f.estimatedCost.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Ingredient', 'Category', 'Required', 'Current Stock', 'Shortage', 'Est. Cost', 'Status'].map((h, i) => (
                    <th key={i} style={{ padding: '13px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((f, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text)' }}>{f.name}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, border: '1px solid var(--border)' }}>{f.category}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text)' }}>{f.required.toFixed(1)} {f.uom}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{f.currentStock} {f.uom}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: f.shortage > 0 ? '#f04040' : 'var(--success)' }}>
                      {f.shortage > 0 ? `-${f.shortage.toFixed(1)}` : '✓ OK'}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>₹{f.estimatedCost.toFixed(0)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {f.shortage > 0 ? (
                        <span style={{ background: 'rgba(240,64,64,0.12)', color: '#f04040', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>PURCHASE</span>
                      ) : (
                        <span style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--success)', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>SUFFICIENT</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!calculated && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Ready to Analyze</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            Enter your student count and click "Run Forecast" to generate ingredient demand projections based on the weekly menu plan.
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. PURCHASES TAB
// ═════════════════════════════════════════════════════════════════════════════
function PurchasesTab() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    item: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    billNo: '',
    company: '',
    uom: 'Kg',
    quantityPurchased: '',
    unitPrice: '',
    shopName: '',
    particulars: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, purchasesRes] = await Promise.all([
        messAPI.getItems(),
        messAPI.getPurchases()
      ]);
      setItems(itemsRes.data);
      setPurchases(purchasesRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item) {
      alert('Please select an item');
      return;
    }
    setSubmitting(true);
    try {
      await messAPI.createPurchase({
        ...form,
        quantityPurchased: Number(form.quantityPurchased),
        unitPrice: Number(form.unitPrice),
      });
      setForm({
        item: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        billNo: '',
        company: '',
        uom: 'Kg',
        quantityPurchased: '',
        unitPrice: '',
        shopName: '',
        particulars: '',
      });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error recording purchase');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase record? This will revert the item stock.')) return;
    try {
      await messAPI.deletePurchase(id);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting purchase');
    }
  };

  const selectedItem = items.find(i => i._id === form.item);

  useEffect(() => {
    if (selectedItem) {
      setForm(f => ({ ...f, uom: selectedItem.uom }));
    }
  }, [form.item, selectedItem]);

  const totalSpent = purchases.reduce((acc, p) => acc + (p.totalCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--accent)08, transparent)', borderColor: 'var(--accent)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Purchase Orders</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{purchases.length}</div>
        </div>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--success)08, transparent)', borderColor: 'var(--success)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Spent (INR)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>₹{totalSpent.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {can('add') && (
          <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '＋ Add Purchase'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && can('add') && (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontFamily: 'var(--font-heading)' }}>
            💰 Record Vegetable/Grocery Purchase
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Item from Catalog</label>
              <select style={selectStyle} required value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}>
                <option value="">Select item...</option>
                {items.map(i => <option key={i._id} value={i._id}>{i.name} {i.nameTelugu ? `(${i.nameTelugu})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Purchase Date</label>
              <input style={inputStyle} type="date" required value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Bill No / Invoice</label>
              <input style={inputStyle} placeholder="e.g. INV-2030" value={form.billNo} onChange={e => setForm({ ...form, billNo: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Company / Brand</label>
              <input style={inputStyle} placeholder="e.g. Local Farms" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Qty Purchased</label>
              <input style={inputStyle} required type="number" step="0.01" min="0.01" value={form.quantityPurchased} onChange={e => setForm({ ...form, quantityPurchased: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Unit Price (₹)</label>
              <input style={inputStyle} required type="number" step="0.01" min="0" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>UOM</label>
              <input style={{ ...inputStyle, background: 'var(--surface2)', opacity: 0.8 }} disabled value={form.uom} />
            </div>
            <div>
              <label style={labelStyle}>Supplier / Shop Name</label>
              <input style={inputStyle} placeholder="e.g. Narasimha Rao Vegetables" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Particulars (Cooking Usage details)</label>
              <input style={inputStyle} placeholder="e.g. For FFC purpose extra dinner" value={form.particulars} onChange={e => setForm({ ...form, particulars: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? 'Saving...' : '💾 Record Purchase'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Loading purchases...</div>
      ) : purchases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No purchases recorded yet.</div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Item Name', 'Supplier', 'Bill No', 'Qty', 'Unit Price', 'Total Cost', 'Brand', 'Particulars', can('delete') ? 'Actions' : ''].filter(Boolean).map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{new Date(p.purchaseDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>
                    {p.item?.name || '—'}
                    {p.item?.nameTelugu && <span style={{ fontSize: 11, color: 'var(--text3)', display: 'block', fontWeight: 400 }}>{p.item.nameTelugu}</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>{p.shopName || '—'}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>{p.billNo || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{p.quantityPurchased} {p.uom}</td>
                  <td style={{ padding: '12px 14px' }}>₹{p.unitPrice}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>₹{p.totalCost || (p.quantityPurchased * p.unitPrice)}</td>
                  <td style={{ padding: '12px 14px' }}>{p.company || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text2)' }}>{p.particulars || '—'}</td>
                  {can('delete') && (
                    <td style={{ padding: '12px 14px' }}>
                      <button style={btnDanger} onClick={() => handleDelete(p._id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. SERVED MEALS LOG TAB
// ═════════════════════════════════════════════════════════════════════════════
function ServedMealsTab() {
  const { can } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    itemsNames: '',
    foodLeftOver: '',
    feedback: 'GOOD',
    boysHostel: '',
    girlsHostel: '',
    externals: '',
    trainers: '',
    guestsFaculty: '',
    staffWardens: '',
    others: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await messAPI.getServedLogs();
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await messAPI.createServedLog(form);
      setForm({
        date: new Date().toISOString().split('T')[0],
        mealType: 'LUNCH',
        itemsNames: '',
        foodLeftOver: '',
        feedback: 'GOOD',
        boysHostel: '',
        girlsHostel: '',
        externals: '',
        trainers: '',
        guestsFaculty: '',
        staffWardens: '',
        others: '',
      });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving meal log');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this served meal log?')) return;
    try {
      await messAPI.deleteServedLog(id);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting log');
    }
  };

  const totalMealsServed = logs.length;
  const avgAttendance = logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + (l.total || 0), 0) / logs.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--accent)08, transparent)', borderColor: 'var(--accent)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Meals Logged</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{totalMealsServed}</div>
        </div>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--success)08, transparent)', borderColor: 'var(--success)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Headcount Per Meal</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{avgAttendance} pax</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {can('add') && (
          <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '＋ Add Served Meal Record'}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && can('add') && (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontFamily: 'var(--font-heading)' }}>
            🍽️ Log Served Meal & Attendance Headcount
          </div>
          
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>Meal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Date Served</label>
              <input style={inputStyle} type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Meal Type</label>
              <select style={selectStyle} required value={form.mealType} onChange={e => setForm({ ...form, mealType: e.target.value })}>
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Items Served (Dishes)</label>
              <input style={inputStyle} required placeholder="e.g. IDLEY, MANGO PAPPU" value={form.itemsNames} onChange={e => setForm({ ...form, itemsNames: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Leftover Food</label>
              <input style={inputStyle} placeholder="e.g. 50 items, 2Kg, None" value={form.foodLeftOver} onChange={e => setForm({ ...form, foodLeftOver: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Feedback</label>
              <select style={selectStyle} value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })}>
                <option value="GOOD">GOOD</option>
                <option value="AVERAGE">AVERAGE</option>
                <option value="POOR">POOR</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 10, marginTop: 10 }}>Attendance Breakdown (Pax)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Boys Hostel</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.boysHostel} onChange={e => setForm({ ...form, boysHostel: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Girls Hostel</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.girlsHostel} onChange={e => setForm({ ...form, girlsHostel: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Externals</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.externals} onChange={e => setForm({ ...form, externals: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Trainers</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.trainers} onChange={e => setForm({ ...form, trainers: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Guests/Faculty</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.guestsFaculty} onChange={e => setForm({ ...form, guestsFaculty: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Staff & Wardens</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.staffWardens} onChange={e => setForm({ ...form, staffWardens: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Others</label>
              <input style={inputStyle} type="number" min="0" placeholder="0" value={form.others} onChange={e => setForm({ ...form, others: e.target.value })} />
            </div>
          </div>

          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? 'Saving...' : '💾 Log Meal Execution'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Loading served logs...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No meals logged yet.</div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Meal Type', 'Dishes Served', 'Leftover', 'Feedback', 'Boys', 'Girls', 'Staff/Others', 'Total Headcount', can('delete') ? 'Actions' : ''].filter(Boolean).map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const staffAndOthers = (log.externals || 0) + (log.trainers || 0) + (log.guestsFaculty || 0) + (log.staffWardens || 0) + (log.others || 0);
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{new Date(log.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, border: '1px solid var(--border)' }}>
                        {log.mealType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>{log.itemsNames}</td>
                    <td style={{ padding: '12px 14px' }}>{log.foodLeftOver || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: log.feedback === 'GOOD' ? 'var(--success)' : log.feedback === 'AVERAGE' ? 'var(--warning, #f5a623)' : '#f04040',
                        fontWeight: 700,
                        fontSize: 11
                      }}>
                        {log.feedback || 'GOOD'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{log.boysHostel || 0}</td>
                    <td style={{ padding: '12px 14px' }}>{log.girlsHostel || 0}</td>
                    <td style={{ padding: '12px 14px' }}>{staffAndOthers}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--text)' }}>{log.total || (log.boysHostel + log.girlsHostel + staffAndOthers)}</td>
                    {can('delete') && (
                      <td style={{ padding: '12px 14px' }}>
                        <button style={btnDanger} onClick={() => handleDelete(log._id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. DAILY GROCERIES SUPPLIES TAB
// ═════════════════════════════════════════════════════════════════════════════
function DailyGroceriesSuppliesTab() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    item: '',
    dateIssued: new Date().toISOString().split('T')[0],
    quantityIssued: '',
    uom: '',
    purposeOfUsed: '',
    purposeOfUsing: '',
    issuedTo: '',
    issuedBy: '',
    particularsExtraCooking: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, suppliesRes] = await Promise.all([
        messAPI.getItems(),
        messAPI.getGroceriesSupplies()
      ]);
      setItems(itemsRes.data);
      setSupplies(suppliesRes.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedItem = items.find(i => i._id === form.item);

  useEffect(() => {
    if (selectedItem) {
      setForm(f => ({ ...f, uom: selectedItem.uom }));
    } else {
      setForm(f => ({ ...f, uom: '' }));
    }
  }, [form.item, selectedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item) {
      alert('Please select an item from the catalog');
      return;
    }
    if (selectedItem && selectedItem.quantity < Number(form.quantityIssued)) {
      alert(`Insufficient stock! Available: ${selectedItem.quantity} ${selectedItem.uom}, Requested: ${form.quantityIssued} ${selectedItem.uom}`);
      return;
    }

    setSubmitting(true);
    try {
      await messAPI.createGroceriesSupply({
        ...form,
        quantityIssued: Number(form.quantityIssued)
      });
      setForm({
        item: '',
        dateIssued: new Date().toISOString().split('T')[0],
        quantityIssued: '',
        uom: '',
        purposeOfUsed: '',
        purposeOfUsing: '',
        issuedTo: '',
        issuedBy: '',
        particularsExtraCooking: ''
      });
      setShowForm(false);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error recording groceries supply');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this groceries supply record? This will revert/increase the item stock.')) return;
    try {
      await messAPI.deleteGroceriesSupply(id);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting groceries supply record');
    }
  };

  const filtered = supplies.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.itemName || '').toLowerCase().includes(q) ||
      (s.issuedTo || '').toLowerCase().includes(q) ||
      (s.issuedBy || '').toLowerCase().includes(q) ||
      (s.purposeOfUsed || '').toLowerCase().includes(q) ||
      (s.purposeOfUsing || '').toLowerCase().includes(q)
    );
  });

  const totalIssuedCount = filtered.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--accent)08, transparent)', borderColor: 'var(--accent)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Groceries Supplies Logged</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{supplies.length}</div>
        </div>
        <div style={{ ...cardStyle, padding: 18, background: 'linear-gradient(135deg, var(--success)08, transparent)', borderColor: 'var(--success)30' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Filtered Transactions</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)', marginTop: 4 }}>{totalIssuedCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {can('add') && (
          <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '＋ Add Daily Grocery Issue'}
          </button>
        )}
        <input
          placeholder="Search supplies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 240 }}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btnSecondary} onClick={async () => {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();
            doc.setFontSize(18); doc.setFont('helvetica', 'bold');
            doc.text('Daily Groceries Supplies Report', 14, 20);
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Records: ${filtered.length}`, 14, 28);
            autoTable(doc, {
              startY: 35,
              head: [['Date Issued', 'Item Name', 'Qty Issued', 'UOM', 'Issued To', 'Issued By', 'Purpose of Used', 'Purpose of Using', 'Extra Cooking Particulars']],
              body: filtered.map(s => [
                new Date(s.dateIssued).toLocaleDateString('en-IN'),
                s.itemName || s.item?.name || '—',
                s.quantityIssued,
                s.uom || s.item?.uom || '—',
                s.issuedTo || '—',
                s.issuedBy || '—',
                s.purposeOfUsed || '—',
                s.purposeOfUsing || '—',
                s.particularsExtraCooking || '—'
              ]),
              theme: 'grid', headStyles: { fillColor: [94, 106, 210] },
              styles: { fontSize: 7 }
            });
            doc.save('Daily_Groceries_Supplies_Report.pdf');
          }}>📄 PDF</button>
          <button style={btnSecondary} onClick={async () => {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(filtered.map(s => ({
              'Date Issued': new Date(s.dateIssued).toLocaleDateString('en-IN'),
              'Item Name': s.itemName || s.item?.name || '',
              'Quantity Issued': s.quantityIssued,
              'UOM': s.uom || s.item?.uom || '',
              'Issued To': s.issuedTo || '',
              'Issued By': s.issuedBy || '',
              'Purpose of Used': s.purposeOfUsed || '',
              'Purpose of Using': s.purposeOfUsing || '',
              'Extra Cooking Particulars': s.particularsExtraCooking || ''
            })));
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Groceries Supplies');
            XLSX.writeFile(wb, 'Daily_Groceries_Supplies_Report.xlsx');
          }}>📗 Excel</button>
        </div>
      </div>

      {/* Form */}
      {showForm && can('add') && (
        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 18, fontFamily: 'var(--font-heading)' }}>
            🥬 Record Daily Grocery Supply/Issue
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Item Name *</label>
              <select style={selectStyle} required value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}>
                <option value="">Select item...</option>
                {items.map(i => <option key={i._id} value={i._id}>{i.name} {i.nameTelugu ? `(${i.nameTelugu})` : ''} ({i.quantity} {i.uom} avail)</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date of Issued *</label>
              <input style={inputStyle} type="date" required value={form.dateIssued} onChange={e => setForm({ ...form, dateIssued: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Quantity Issued *</label>
              <input style={inputStyle} required type="number" step="0.01" min="0.01" placeholder="e.g. 10.5" value={form.quantityIssued} onChange={e => setForm({ ...form, quantityIssued: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>UOM</label>
              <input style={{ ...inputStyle, background: 'var(--surface2)', opacity: 0.8 }} disabled placeholder="Auto-populated" value={form.uom} />
            </div>
            <div>
              <label style={labelStyle}>Issued To *</label>
              <input style={inputStyle} required placeholder="e.g. MAREYAMMA-MASTER" value={form.issuedTo} onChange={e => setForm({ ...form, issuedTo: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Issued By *</label>
              <input style={inputStyle} required placeholder="e.g. Murali krishna" value={form.issuedBy} onChange={e => setForm({ ...form, issuedBy: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Purpose of Used</label>
              <input style={inputStyle} placeholder="e.g. SAMBAR, TIFFIN, VEG CURRY" value={form.purposeOfUsed} onChange={e => setForm({ ...form, purposeOfUsed: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Purpose of Using</label>
              <input style={inputStyle} placeholder="e.g. Daily hostel cooking" value={form.purposeOfUsing} onChange={e => setForm({ ...form, purposeOfUsing: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Particulars for Extra Cooking</label>
              <input style={inputStyle} placeholder="e.g. FOR FFC PURPOSE 50 MEMBERS EXTRA TIFFIN,LUNCH" value={form.particularsExtraCooking} onChange={e => setForm({ ...form, particularsExtraCooking: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={btnPrimary}>
            {submitting ? 'Saving...' : '✅ Save Grocery Issue'}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>Loading supplies data...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No supplies logged yet.</div>
      ) : (
        <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date Issued', 'Item Name', 'Qty Issued', 'UOM', 'Issued To', 'Issued By', 'Purpose of Used', 'Purpose of Using', 'Extra Cooking Particulars', can('delete') ? 'Actions' : ''].filter(Boolean).map((h, i) => (
                  <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--accent-subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{new Date(s.dateIssued).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text)' }}>{s.itemName || s.item?.name || '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700 }}>{s.quantityIssued}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text3)' }}>{s.uom || s.item?.uom || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>{s.issuedTo || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>{s.issuedBy || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11 }}>{s.purposeOfUsed || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11 }}>{s.purposeOfUsing || '—'}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text2)' }}>{s.particularsExtraCooking || '—'}</td>
                  {can('delete') && (
                    <td style={{ padding: '12px 14px' }}>
                      <button style={btnDanger} onClick={() => handleDelete(s._id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN MESS PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function MessPage() {
  const { user, can } = useAuth();
  const [activeTab, setActiveTab] = useState('stock');
  const [showImport, setShowImport] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const allTabs = [
    { id: 'stock', label: 'Stock Catalog', emoji: '📦' },
    { id: 'purchases', label: 'Purchases', emoji: '💰' },
    { id: 'consumption', label: 'Consumption', emoji: '📋' },
    { id: 'menu', label: 'Weekly Menu', emoji: '🗓️' },
    { id: 'served-logs', label: 'Served Meals Log', emoji: '🍽️' },
    { id: 'forecast', label: 'AI Forecast', emoji: '🤖' },
    { id: 'groceries-supplies', label: 'Daily Groceries Supplies', emoji: '🥬' },
  ];

  const tabs = user?.role === 'mess_staff'
    ? allTabs.filter(t => ['stock', 'served-logs', 'groceries-supplies'].includes(t.id))
    : allTabs;

  return (
    <div className="page" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 30 }}>🍽️</span>
          <div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--text)',
              fontFamily: 'var(--font-heading)',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              Hostel Mess Management
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text3)', margin: '4px 0 0', letterSpacing: '0.3px' }}>
              Kitchen stock, daily consumption, menu planning & AI-powered demand forecasting
            </p>
          </div>
        </div>
        {can('delete') && (
          <button 
            onClick={() => setShowImport(true)} 
            style={{
              ...btnPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}
          >
            <span style={{ fontSize: 16 }}>📥</span> Import Excel
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="tab-container" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            label={tab.label}
            emoji={tab.emoji}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && <StockCatalogTab key={`stock-${refreshTrigger}`} />}
      {activeTab === 'purchases' && user?.role !== 'mess_staff' && <PurchasesTab key={`purchases-${refreshTrigger}`} />}
      {activeTab === 'consumption' && user?.role !== 'mess_staff' && <ConsumptionLoggerTab key={`consumption-${refreshTrigger}`} />}
      {activeTab === 'menu' && user?.role !== 'mess_staff' && <WeeklyMenuTab key={`menu-${refreshTrigger}`} />}
      {activeTab === 'served-logs' && <ServedMealsTab key={`served-${refreshTrigger}`} />}
      {activeTab === 'forecast' && user?.role !== 'mess_staff' && <AIForecastTab key={`forecast-${refreshTrigger}`} />}
      {activeTab === 'groceries-supplies' && <DailyGroceriesSuppliesTab key={`groceries-${refreshTrigger}`} />}

      {/* Import Modal */}
      {showImport && (
        <MessExcelImportModal 
          onClose={() => setShowImport(false)} 
          onImported={triggerRefresh} 
        />
      )}
    </div>
  );
}
