import { useState, useEffect, useCallback, useMemo } from 'react';
import { distributionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { exportToCSV } from '../utils/csvExporter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLLEGE_NAME } from '../config/logo';

const PALETTE = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#f59e0b','#06b6d4','#84cc16','#ef4444','#10b981'];

export default function DistributionsPage() {
  const { user } = useAuth();
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const fetchDists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await distributionsAPI.getAll({ 
        search: debouncedSearch,
        startDate,
        endDate
      });
      setDistributions(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [debouncedSearch, startDate, endDate]);

  useEffect(() => { fetchDists(); }, [fetchDists]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this distribution record?')) return;
    try {
      await distributionsAPI.delete(id);
      fetchDists();
    } catch (err) { alert('Delete failed'); }
  };

  const handleReturn = async (id, maxQty) => {
    const rawQty = window.prompt(`How many units do you want to return to stock? (Max: ${maxQty})`);
    if (!rawQty) return;
    const qty = Number(rawQty);
    if (isNaN(qty) || qty <= 0 || qty > maxQty) {
      alert("Invalid quantity. Must be a number between 1 and " + maxQty);
      return;
    }
    try {
      await distributionsAPI.returnItem(id, qty);
      fetchDists();
      alert(`Successfully returned ${qty} units back to stock!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Return failed');
    }
  };

  // Summary stats
  const totalDistributed = distributions.reduce((s, d) => s + d.quantityDistributed, 0);
  const departments = [...new Set(distributions.map(d => d.distributedToDepartment))];

  const deptData = useMemo(() => {
    const summary = {};
    distributions.forEach(d => {
      const dept = d.distributedToDepartment || 'Other';
      summary[dept] = (summary[dept] || 0) + (d.quantityDistributed || 0);
    });
    return Object.entries(summary)
      .map(([name, qty]) => ({ name, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [distributions]);

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text(`${COLLEGE_NAME} - Distributions Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);

    let filterText = `Total Records: ${distributions.length}`;
    if (startDate || endDate) {
      filterText += ` | Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`;
    }
    if (search) {
      filterText += ` | Search Term: "${search}"`;
    }
    doc.text(filterText, 14, 34);

    const tableColumn = ["Item Name", "Category", "Qty", "UOM", "Distributed To", "Authorised By", "Date", "Remarks"];
    const tableRows = [];

    distributions.forEach(d => {
      tableRows.push([
        d.item?.itemName || '—',
        d.item?.segment || d.item?.category || '—',
        d.quantityDistributed,
        d.uom || d.item?.uom || '—',
        d.distributedToDepartment || '—',
        d.authorisedBy || '—',
        new Date(d.dateOfDistribution).toLocaleDateString('en-IN'),
        d.remarks || '—'
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save('distributions_report.pdf');
  };

  const exportCSV = () => {
    const headersMap = {
      'item.itemName': 'Item Name',
      'item.segment': 'Category',
      quantityDistributed: 'Quantity Distributed',
      uom: 'Unit of Measure',
      distributedToDepartment: 'Distributed To Department',
      authorisedBy: 'Authorized By',
      dateOfDistribution: 'Date of Distribution',
      'distributedBy.name': 'Distributed By Staff',
      remarks: 'Remarks'
    };
    const formattedData = distributions.map(d => ({
      ...d,
      dateOfDistribution: d.dateOfDistribution ? new Date(d.dateOfDistribution).toLocaleDateString('en-IN') : '—'
    }));
    exportToCSV(formattedData, 'distributions_export.csv', headersMap);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Distributions</h1>
          <p className="page-subtitle">Complete history of all distributed items</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportPDF}>📄 Export PDF</button>
          <button className="btn btn-secondary" onClick={exportCSV}>📊 Export CSV</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.12)' }}>📋</div>
          <div>
            <div className="stat-value">{distributions.length}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>📦</div>
          <div>
            <div className="stat-value">{totalDistributed.toLocaleString()}</div>
            <div className="stat-label">Units Distributed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>🏢</div>
          <div>
            <div className="stat-value">{departments.length}</div>
            <div className="stat-label">Departments Served</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>🔍</span>
            <input 
              className="form-control" 
              placeholder="Search by item name, department, or receiver…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>From:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 140 }}
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>To:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 140 }}
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
          {(startDate || endDate || search) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Analytics Chart */}
      {!loading && distributions.length > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
          <h3 className="heading" style={{ fontSize: 16, marginBottom: 16 }}>📊 Department Distribution Quantities</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text3)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text3)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="quantity" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : distributions.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🚚</div>
              <h3>No distributions yet</h3>
              <p>Go to Inventory and distribute items to departments</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Distributed To</th>
                  <th>Authorised By</th>
                  <th>Date</th>
                  <th>Distributed By</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.item?.itemName || '—'}</td>
                    <td><span className="badge badge-default">{d.item?.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{d.quantityDistributed}</td>
                    <td>{d.uom || d.item?.uom || '—'}</td>
                    <td>{d.distributedToDepartment}</td>
                    <td>{d.authorisedBy}</td>
                    <td>{new Date(d.dateOfDistribution).toLocaleDateString('en-IN')}</td>
                    <td>{d.distributedBy?.name || '—'}</td>
                    <td style={{ color: 'var(--text2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.remarks || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(user?.role === 'admin' || user?.role === 'staff') && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleReturn(d._id, d.quantityDistributed)}>↩️ Return</button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
