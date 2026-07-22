import { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../api';
import { useDebounce } from '../hooks/useDebounce';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await auditAPI.getAll({ 
        page, 
        limit: 50, 
        search: debouncedSearch, 
        actionType: actionFilter 
      });
      setLogs(data.logs);
      setPage(data.page);
      setTotalPages(data.pages);
      setTotalRecords(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, actionFilter]);

  const getActionBadge = (action) => {
    const map = {
      'CREATED': { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
      'UPDATED': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
      'DELETED': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
      'DISTRIBUTED': { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316' },
      'RETURNED': { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }
    };
    const style = map[action] || { bg: 'var(--surface2)', color: 'var(--text2)' };
    return (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: '20px', 
        fontSize: '10px', 
        fontWeight: 'bold', 
        backgroundColor: style.bg, 
        color: style.color 
      }}>
        {action}
      </span>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🛡️ Audit Logs</h1>
          <p className="page-subtitle">Track all inventory actions across the system.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            className="form-control" 
            placeholder="🔍  Search logs by notes, item, or user name…" 
            style={{ flex: 1, minWidth: 200 }}
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          <select 
            className="form-control" 
            style={{ width: 190 }} 
            value={actionFilter} 
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="CREATED">CREATED</option>
            <option value="UPDATED">UPDATED</option>
            <option value="DELETED">DELETED</option>
            <option value="DISTRIBUTED">DISTRIBUTED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="heading" style={{ fontSize: 15 }}>Recent Activity</h3>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{totalRecords} total records</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state"><h3>No audit logs found</h3></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Item</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td>{getActionBadge(log.actionType)}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      {log.performedBy ? `${log.performedBy.name}` : 'System'}
                      <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400 }}>
                         {log.performedBy ? log.performedBy.role : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      {log.item ? log.item.itemName : <span style={{color: '#ef4444'}}>Item Deleted</span>}
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 300, whiteSpace: 'normal' }}>
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Page {page} of {totalPages}</span>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
