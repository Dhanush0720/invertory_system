import { useState, useEffect, useCallback } from 'react';
import { distributionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COLLEGE_NAME } from '../config/logo';

export default function DistributionsPage() {
  const { user } = useAuth();
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await distributionsAPI.getAll({ department: search });
      setDistributions(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

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

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Placeholder space for Logo if MD wants to add it later
    // doc.addImage(logoBase64, 'PNG', 14, 10, 20, 20); 
    
    doc.setFontSize(18);
    doc.text(`${COLLEGE_NAME} - Distributions Report`, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);
    doc.text(`Total Records: ${distributions.length}`, 14, 36);

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
      startY: 44,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save('distributions_report.pdf');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚚 Distributions</h1>
          <p className="page-subtitle">Complete history of all distributed items</p>
        </div>
        <button className="btn btn-secondary" onClick={exportPDF}>📄 Export PDF</button>
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

      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Filter by department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

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
