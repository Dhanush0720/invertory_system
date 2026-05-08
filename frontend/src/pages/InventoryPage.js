import { useState, useEffect, useCallback } from 'react';
import { itemsAPI, distributionsAPI, masterAPI, agentsAPI } from '../api';
import { CATEGORIES, UOM_OPTIONS } from '../api/constants';
import { useAuth } from '../context/AuthContext';
import ExcelImportModal from '../components/ExcelImportModal';
import { useDebounce } from '../hooks/useDebounce';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLLEGE_NAME } from '../config/logo';

const emptyForm = {
  segment: '', itemName: '', dateOfPurchase: '', company: '',
  billNo: '', uom: 'Nos', quantityPurchased: '', unitPrice: '',
  totalCost: '', shopName: '', particulars: ''
};

const emptyDist = {
  item: '', quantityDistributed: '', dateOfDistribution: '',
  distributedToDepartment: '', authorisedBy: '', distributedTo: '', uom: 'Nos', remarks: ''
};

function StockBar({ purchased, distributed, remaining }) {
  const pct = purchased > 0 ? Math.max(0, (remaining / purchased) * 100) : 0;
  const color = pct === 0 ? '#ef4444' : pct <= 20 ? '#f59e0b' : '#22c55e';
  return (
    <div className="stock-bar-wrap">
      <div className="stock-bar">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="stock-numbers">{remaining}/{purchased}</span>
    </div>
  );
}

export default function InventoryPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segFilter, setSegFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDistModal, setShowDistModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [distForm, setDistForm] = useState(emptyDist);
  const [saving, setSaving] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [suggestions, setSuggestions] = useState({
    itemNames: [], vendors: [], particulars: [], departments: []
  });

  // Debounce search so API is only called 400ms after typing stops
  const debouncedSearch = useDebounce(search, 400);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemsAPI.getAll({ search: debouncedSearch, segment: segFilter, page, limit: LIMIT });
      // Backend now returns { items, total, page, pages }
      const data = res.data;
      if (data.items) {
        setItems(data.items);
        setTotalItems(data.total || 0);
        setTotalPages(data.pages || 1);
      } else {
        // Fallback if older response shape
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, segFilter, page]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [debouncedSearch, segFilter]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const [aiRes, vRes, pRes, dRes] = await Promise.all([
        masterAPI.getSuggestions(),
        masterAPI.getAll('vendors'),
        masterAPI.getAll('particulars'),
        masterAPI.getAll('departments')
      ]);
      setSuggestions({
        itemNames: aiRes.data.itemNames || [],
        vendors: vRes.data.map(v => v.name),
        particulars: pRes.data.map(p => p.name),
        departments: dRes.data.map(d => d.name)
      });
    } catch (e) { console.warn("Auto-suggestions not available", e); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setError(''); setShowAddModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      segment: item.segment || '',
      itemName: item.itemName,
      dateOfPurchase: item.dateOfPurchase ? new Date(item.dateOfPurchase).toISOString().slice(0, 10) : '',
      company: item.company || '',
      billNo: item.billNo || '',
      uom: item.uom || 'Nos',
      quantityPurchased: item.quantityPurchased || '',
      unitPrice: item.unitPrice || '',
      totalCost: item.totalCost || '',
      shopName: item.shopName || '',
      particulars: item.particulars || ''
    });
    setError(''); setShowAddModal(true);
  };

  const openDist = (item) => {
    setDistForm({ ...emptyDist, item: item._id, uom: item.uom || 'Nos' });
    setError(''); setShowDistModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, quantityPurchased: Number(form.quantityPurchased), unitPrice: Number(form.unitPrice), totalCost: Number(form.totalCost) };
      if (editItem) await itemsAPI.update(editItem._id, payload);
      else await itemsAPI.create(payload);
      setShowAddModal(false); fetchItems();
      setSuccess(editItem ? 'Item updated!' : 'Item added!'); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item and all its distributions?')) return;
    try { await itemsAPI.delete(id); fetchItems(); setSuccess('Deleted.'); setTimeout(() => setSuccess(''), 3000); }
    catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleDist = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await distributionsAPI.create({ ...distForm, quantityDistributed: Number(distForm.quantityDistributed) });
      setShowDistModal(false); fetchItems();
      setSuccess('Distribution recorded!'); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to distribute'); }
    finally { setSaving(false); }
  };

  const handleQtyChange = (e) => {
    const val = e.target.value;
    const qty = parseFloat(val);
    setForm(prev => {
      const next = { ...prev, quantityPurchased: val };
      if (!isNaN(qty) && qty > 0 && prev.unitPrice) {
        next.totalCost = (qty * parseFloat(prev.unitPrice)).toFixed(2);
      } else if (!isNaN(qty) && qty > 0 && prev.totalCost) {
        next.unitPrice = (parseFloat(prev.totalCost) / qty).toFixed(2);
      }
      return next;
    });
  };

  const handleUnitPriceChange = (e) => {
    const val = e.target.value;
    const price = parseFloat(val);
    setForm(prev => {
      const next = { ...prev, unitPrice: val };
      const qty = parseFloat(prev.quantityPurchased);
      if (!isNaN(price) && !isNaN(qty)) {
        next.totalCost = (qty * price).toFixed(2);
      }
      return next;
    });
  };

  const handleTotalCostChange = (e) => {
    const val = e.target.value;
    const total = parseFloat(val);
    setForm(prev => {
      const next = { ...prev, totalCost: val };
      const qty = parseFloat(prev.quantityPurchased);
      if (!isNaN(total) && !isNaN(qty) && qty > 0) {
        next.unitPrice = (total / qty).toFixed(2);
      }
      return next;
    });
  };

  const handleVisionUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVisionLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          const mimeType = file.type;

          const { data } = await agentsAPI.vision(base64Image, mimeType);

          setForm(prev => ({
            ...prev,
            itemName: data.itemName || prev.itemName,
            company: data.company || prev.company,
            billNo: data.billNo || prev.billNo,
            quantityPurchased: data.quantityPurchased || prev.quantityPurchased,
            unitPrice: data.unitPrice || prev.unitPrice,
            shopName: data.shopName || prev.shopName
          }));

          setSuccess('✅ AI successfully extracted invoice data!');
          setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
          setError('Failed to parse invoice automatically. Please try again.');
        } finally {
          setVisionLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('File reading failed.');
      setVisionLoading(false);
    }
  };



  const exportPDF = () => {
    const doc = new jsPDF('landscape');

    // Placeholder space for Logo if MD wants to add it later
    // doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20); 

    doc.setFontSize(18);
    doc.text(`${COLLEGE_NAME} - Inventory Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);
    doc.text(`Total Items: ${items.length}`, 14, 36);

    const tableColumn = ["Category", "Item Name", "Company", "Purchase Date", "Purchased QTY", "Unit Price", "Total Cost", "Remaining Stock"];
    const tableRows = [];

    items.forEach(item => {
      const remaining = item.quantityRemaining ?? item.quantityPurchased ?? 0;
      tableRows.push([
        item.segment || 'OTHER',
        item.itemName || '-',
        item.company || '-',
        item.dateOfPurchase ? new Date(item.dateOfPurchase).toLocaleDateString('en-IN') : '-',
        item.quantityPurchased?.toLocaleString() ?? '0',
        item.unitPrice ? `₹${item.unitPrice.toLocaleString('en-IN')}` : '-',
        item.totalCost ? `₹${item.totalCost.toLocaleString('en-IN')}` : '-',
        `${remaining} / ${item.quantityPurchased || 0}`
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save('inventory_report.pdf');
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Inventory Register</h1>
          <p className="page-subtitle">{totalItems} items tracked</p>
        </div>
        {can('add') && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={exportPDF}>📄 Export PDF</button>
            <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>📥 Import Excel</button>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Item</button>
          </div>
        )}
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      {/* Search & Filter */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-control" placeholder="🔍  Search item name, company, particulars…" style={{ flex: 1, minWidth: 200 }}
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" style={{ width: 190 }} value={segFilter} onChange={e => setSegFilter(e.target.value)}>
            <option value="">All Segments</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE — Exact Excel columns */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>No items yet</h3>
              <p>Add items manually or import from Excel</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Item Name</th>
                  <th>Date of Purchase</th>
                  <th>Purchased-Item Company</th>
                  <th>Bill / Invoice No</th>
                  <th>UOM</th>
                  <th>QTY</th>
                  <th>Unit Price (₹)</th>
                  <th>Cost of All Units (₹)</th>
                  <th>Purchased From (Shop)</th>
                  <th>Particulars</th>
                  <th>Stock Status</th>
                  {can('add') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td><span className="badge badge-default" style={{ fontSize: 10 }}>{item.segment || 'OTHER'}</span></td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{item.itemName}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {item.dateOfPurchase ? new Date(item.dateOfPurchase).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.company || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.billNo || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>{item.uom || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantityPurchased?.toLocaleString() ?? 0}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {item.unitPrice ? item.unitPrice.toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#f97316' }}>
                      {item.totalCost ? item.totalCost.toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={item.shopName}>{item.shopName || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={item.particulars}>{item.particulars || '—'}</td>
                    <td style={{ minWidth: 140 }}>
                      <StockBar
                        purchased={item.quantityPurchased || 0}
                        distributed={item.quantityDistributed || 0}
                        remaining={item.quantityRemaining ?? item.quantityPurchased ?? 0}
                      />
                      <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
                        {(item.quantityRemaining ?? item.quantityPurchased) <= 0
                          ? <span className="badge badge-danger" style={{ fontSize: 9 }}>Out of Stock</span>
                          : (item.quantityRemaining ?? item.quantityPurchased) <= 5
                            ? <span className="badge badge-warning" style={{ fontSize: 9 }}>Low Stock</span>
                            : <span className="badge badge-success" style={{ fontSize: 9 }}>In Stock</span>
                        }
                      </div>
                    </td>
                    {can('add') && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openDist(item)} title="Record Distribution">🚚</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)} title="Edit">✏️</button>
                          {can('delete') && (
                            <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                              onClick={() => handleDelete(item._id)} title="Delete">🗑️</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── PAGINATION CONTROLS ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16, marginBottom: 8 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            Page <strong style={{ color: 'var(--text)' }}>{page}</strong> of <strong style={{ color: 'var(--text)' }}>{totalPages}</strong>
            &nbsp;·&nbsp;<strong style={{ color: 'var(--accent)' }}>{totalItems}</strong> items total
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >Next →</button>
        </div>
      )}


      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? '✏️ Edit Item' : '➕ Add New Item'}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', margin: 0 }}>PURCHASE DETAILS (Columns A–K)</p>

              {!editItem && (
                <div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    {visionLoading ? 'Scanning...' : '📸 AI Scan Invoice'}
                    <input type="file" accept="image/*" onChange={handleVisionUpload} style={{ display: 'none' }} disabled={visionLoading} />
                  </label>
                </div>
              )}
            </div>

            <form onSubmit={handleSave}>
              {/* Row 1: Segment + Item Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Segment (Category) *</label>
                  <select className="form-control" value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} required>
                    <option value="">Select segment</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Item Name *</label>
                  <input className="form-control" list="item-names-list" placeholder="e.g. A4 BUNDLES" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} required />
                  <datalist id="item-names-list">
                    {suggestions.itemNames.map((name, i) => <option key={i} value={name} />)}
                  </datalist>
                </div>
              </div>
              {/* Row 2: Date + Company + Bill No */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Purchase</label>
                  <input type="date" className="form-control" value={form.dateOfPurchase} onChange={e => setForm({ ...form, dateOfPurchase: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchased-Item Company</label>
                  <input className="form-control" list="vendors-list" placeholder="e.g. JK EASY" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                  <datalist id="vendors-list">
                    {suggestions.vendors.map((v, i) => <option key={i} value={v} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Bill / Invoice No</label>
                  <input className="form-control" placeholder="e.g. 2338" value={form.billNo} onChange={e => setForm({ ...form, billNo: e.target.value })} />
                </div>
              </div>
              {/* Row 3: UOM + QTY + Unit Price + Cost (auto) */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">UOM (Unit of Material)</label>
                  <select className="form-control" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })}>
                    {['Nos', 'Kg', 'Litres', 'Metres', 'Box', 'Set', 'Pair', 'Roll', 'Packet', 'Bundle', 'Bundles', 'QTY', 'PCS', 'KG', 'NOS', 'Feets'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">QTY (Quantity) *</label>
                  <input type="number" className="form-control" placeholder="0" min="0" step="any" value={form.quantityPurchased} onChange={handleQtyChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹)</label>
                  <input type="number" className="form-control" placeholder="0.00" min="0" step="any" value={form.unitPrice} onChange={handleUnitPriceChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost of All Units (₹)</label>
                  <input type="number" className="form-control" placeholder="0.00" min="0" step="any" style={{ background: 'var(--surface2)', fontWeight: 700, color: '#f97316' }} value={form.totalCost} onChange={handleTotalCostChange} />
                </div>
              </div>
              {/* Row 4: Shop + Particulars */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchased From (Shop Name)</label>
                  <input className="form-control" list="vendors-list" placeholder="e.g. LALITHA FANCY & STATIONERY" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Particulars</label>
                  <input className="form-control" list="particulars-list" placeholder="e.g. COLLEGE PURPOSE" value={form.particulars} onChange={e => setForm({ ...form, particulars: e.target.value })} />
                  <datalist id="particulars-list">
                    {suggestions.particulars.map((p, i) => <option key={i} value={p} />)}
                  </datalist>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editItem ? 'Update Item' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DISTRIBUTION MODAL (Columns L–Q) ── */}
      {showDistModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDistModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3 className="modal-title">🚚 Record Distribution</h3>
              <button className="modal-close" onClick={() => setShowDistModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <p style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.08em', marginBottom: 14 }}>DISTRIBUTION DETAILS (Columns L–Q)</p>
            <form onSubmit={handleDist}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Distribution Authorised By *</label>
                  <input className="form-control" placeholder="e.g. CE / PRINCIPAL" value={distForm.authorisedBy} onChange={e => setDistForm({ ...distForm, authorisedBy: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">UOM</label>
                  <select className="form-control" value={distForm.uom} onChange={e => setDistForm({ ...distForm, uom: e.target.value })}>
                    {['Nos', 'Kg', 'Litres', 'Metres', 'Box', 'Set', 'Pair', 'Roll', 'Packet', 'Bundle', 'Bundles', 'QTY', 'PCS', 'KG', 'NOS'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">QTY Distributed *</label>
                  <input type="number" className="form-control" placeholder="0" min="1" step="any" value={distForm.quantityDistributed} onChange={e => setDistForm({ ...distForm, quantityDistributed: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Distribution *</label>
                  <input type="date" className="form-control" value={distForm.dateOfDistribution} onChange={e => setDistForm({ ...distForm, dateOfDistribution: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Distributed to Department *</label>
                  <input className="form-control" list="departments-list" placeholder="e.g. EXAM CELL / EEE / CSE" value={distForm.distributedToDepartment} onChange={e => setDistForm({ ...distForm, distributedToDepartment: e.target.value })} required />
                  <datalist id="departments-list">
                    {suggestions.departments.map((d, i) => <option key={i} value={d} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Name of Person (Goods Handover)</label>
                  <input className="form-control" placeholder="e.g. HARI EXAM CELL INCHARGE" value={distForm.distributedTo} onChange={e => setDistForm({ ...distForm, distributedTo: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-control" rows="2" placeholder="Optional remarks…" value={distForm.remarks} onChange={e => setDistForm({ ...distForm, remarks: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDistModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Recording…' : 'Record Distribution'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            fetchItems();
            setShowImportModal(false);
            setSuccess('Excel data imported successfully!');
            setTimeout(() => setSuccess(''), 4000);
          }}
        />
      )}
    </div>
  );
}
