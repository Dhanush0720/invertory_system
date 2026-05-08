import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { itemsAPI } from '../api';
import { CATEGORIES } from '../api/constants';

// ── Column mapping: maps common Excel header names → our field names
const FIELD_MAP = {
  // Segment
  'segment':                   'segment',
  'categories':                'segment',
  'category':                  'segment',

  // Item name
  'item name':                 'itemName',
  'itemname':                  'itemName',
  'item':                      'itemName',
  'name':                      'itemName',
  'name of item':              'itemName',
  'name of the item':          'itemName',
  'particular':                'itemName',

  // Date of purchase
  'date of purchase':          'dateOfPurchase',
  'purchase date':             'dateOfPurchase',
  'date':                      'dateOfPurchase',
  'purchased date':            'dateOfPurchase',

  // Company
  'purchased-item company':    'company',
  'company':                   'company',
  'brand':                     'company',
  'make':                      'company',

  // Bill no
  'bill/ invoice no':          'billNo',
  'bill/invoice no':           'billNo',
  'bill no/invoice no':        'billNo',
  'bill no':                   'billNo',
  'invoice no':                'billNo',
  'invoice':                   'billNo',

  // UOM purchase
  'uom (unit of material)':    'uom',
  'uom':                       'uom',
  'unit of measure':           'uom',
  'unit':                      'uom',

  // QTY purchased
  'qty':                       'quantityPurchased',
  'quantity':                  'quantityPurchased',
  'qty purchased':             'quantityPurchased',
  'quantity purchased':        'quantityPurchased',
  'purchased quantity':        'quantityPurchased',
  'no of items':               'quantityPurchased',
  'count':                     'quantityPurchased',

  // Unit price
  'unit price':                'unitPrice',
  'price':                     'unitPrice',
  'unit price (₹)':            'unitPrice',
  'rate':                      'unitPrice',
  'amount':                    'unitPrice',

  // Total cost
  'cost of all units':         'totalCost',
  'cost of all units (₹)':     'totalCost',
  'total cost':                'totalCost',
  'total':                     'totalCost',

  // Shop name
  'purchased from(shop name)': 'shopName',
  'purchased from (shop)':     'shopName',
  'shop name':                 'shopName',
  'vendor':                    'shopName',

  // Particulars
  'particulers':               'particulars',
  'particulars':               'particulars',

  // Distribution
  'distribution auhorised by': 'authorisedBy',
  'distribution authorised by':'authorisedBy',
  'authorised by':             'authorisedBy',

  // Dist UOM — skip (duplicate col name)

  // Dist QTY
  'qty distributed':           'quantityDistributed',
  'quantity distributed':      'quantityDistributed',

  // Dist date
  'date of distribution':      'dateOfDistribution',

  // Dept
  'distributed to department': 'distributedToDepartment',
  'distributed to dept':       'distributedToDepartment',

  // Person
  'name of the person to which goods handover': 'handoverPerson',
};

const REQUIRED_FIELDS = ['itemName'];
const ALL_FIELDS = [
  { key: 'category',               label: 'Category' },
  { key: 'itemName',               label: 'Item Name *' },
  { key: 'dateOfPurchase',         label: 'Date of Purchase' },
  { key: 'company',                label: 'Company' },
  { key: 'billNo',                 label: 'Bill No' },
  { key: 'uom',                    label: 'UOM' },
  { key: 'quantityPurchased',      label: 'Qty Purchased' },
  { key: 'unitPrice',              label: 'Unit Price' },
  { key: 'shopName',               label: 'Shop Name' },
  { key: 'particulars',            label: 'Particulars' },
  { key: 'quantityDistributed',    label: 'Qty Distributed' },
  { key: 'dateOfDistribution',     label: 'Date of Distribution' },
  { key: 'distributedToDepartment',label: 'Distributed To Dept' },
  { key: 'authorisedBy',           label: 'Authorised By' },
];

function mapHeaders(rawHeaders) {
  const mapping = {}; // rawHeader → fieldKey
  rawHeaders.forEach(h => {
    const norm = (h || '').toString().toLowerCase().trim();
    if (FIELD_MAP[norm]) mapping[h] = FIELD_MAP[norm];
  });
  return mapping;
}

function parseRows(sheetData, headerMapping) {
  return sheetData.map(rawRow => {
    const mapped = {};
    Object.entries(rawRow).forEach(([rawHeader, value]) => {
      const field = headerMapping[rawHeader];
      if (field) mapped[field] = value;
    });
    return mapped;
  }).filter(row => Object.keys(row).length > 0);
}

function validateRow(row, idx) {
  const errors = [];
  
  // Clean or default data for robustness
  if (row.quantityPurchased === undefined || row.quantityPurchased === null || row.quantityPurchased.toString().trim() === '') {
    row.quantityPurchased = 0;
  }

  REQUIRED_FIELDS.forEach(f => {
    if (!row[f] || row[f].toString().trim() === '') {
      errors.push(`Missing ${f}`);
    }
  });
  
  if (row.quantityPurchased !== 0 && isNaN(parseFloat(row.quantityPurchased))) {
    errors.push('Quantity must be a number');
  }
  if (row.unitPrice && isNaN(parseFloat(row.unitPrice))) {
    errors.push('Unit price must be a number');
  }
  return errors;
}

// ── Sub-components
function StepBadge({ n, active, done }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif',
      background: done ? '#22c55e' : active ? 'var(--accent)' : 'var(--surface2)',
      color: done || active ? 'white' : 'var(--text2)',
      border: done || active ? 'none' : '1px solid var(--border)',
    }}>{done ? '✓' : n}</div>
  );
}

export default function ExcelImportModal({ onClose, onImported }) {
  const [step, setStep]           = useState(1); // 1=upload 2=map 3=preview 4=result
  const [file, setFile]           = useState(null);
  const [sheets, setSheets]       = useState([]);
  const [selectedSheet, setSheet] = useState('');
  const [rawHeaders, setRawHeaders]   = useState([]);
  const [headerMapping, setMapping]   = useState({});
  const [rows, setRows]           = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef = useRef();

  // ── Step 1: parse workbook
  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      setSheets(wb.SheetNames);
      setSheet(wb.SheetNames[0]);
      loadSheet(wb, wb.SheetNames[0]);
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const loadSheet = (wb, sheetName) => {
    const ws       = wb.Sheets[sheetName];
    const json     = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!json.length) { setRawHeaders([]); setRows([]); return; }
    const headers  = Object.keys(json[0]);
    const mapping  = mapHeaders(headers);
    setRawHeaders(headers);
    setMapping(mapping);
    setRows(json);
    setStep(2);
  };

  const onSheetChange = (name) => {
    setSheet(name);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      loadSheet(wb, name);
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Step 2 → 3: apply mapping & validate
  const goPreview = () => {
    const mappedFields = Object.values(headerMapping);
    const missing = REQUIRED_FIELDS.filter(rf => !mappedFields.includes(rf));
    if (missing.length > 0) {
      const missingLabels = missing.map(m => ALL_FIELDS.find(af => af.key === m)?.label).join(', ');
      alert(`⚠️ Please map the following required fields before proceeding:\n\n${missingLabels}`);
      return;
    }

    const parsed = parseRows(rows, headerMapping);
    const valid = [], invalid = [];
    parsed.forEach((row, i) => {
      const errs = validateRow(row, i);
      if (errs.length) invalid.push({ ...row, _row: i + 2, _errors: errs });
      else              valid.push({ ...row, _row: i + 2 });
    });
    setValidRows(valid);
    setInvalidRows(invalid);
    setStep(3);
  };

  // ── Step 3 → 4: import
  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await itemsAPI.bulkImport(validRows);
      setResult(res.data);
      setStep(4);
      onImported && onImported();
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Import failed' });
      setStep(4);
    } finally {
      setImporting(false);
    }
  };

  const STEPS = ['Upload File', 'Map Columns', 'Preview', 'Results'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">📥 Import from Excel</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <StepBadge n={i + 1} active={step === i + 1} done={step > i + 1} />
                <span style={{ fontSize: 13, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--text2)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? '#22c55e' : 'var(--border)', margin: '0 12px' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === 1 && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: '48px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                background: dragOver ? 'rgba(249,115,22,0.05)' : 'var(--surface2)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', marginBottom: 8 }}>Drop your Excel file here</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>or click to browse — supports .xlsx, .xls, .csv</p>
              <span className="btn btn-secondary">Choose File</span>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Format guide */}
            <div style={{ marginTop: 20, padding: 16, background: 'var(--surface2)', borderRadius: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text)' }}>📋 Expected Column Names (flexible — we'll auto-detect):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                {['Categories', 'Item Name', 'Date of Purchase', 'Company', 'Bill No/Invoice No', 'UOM', 'QTY', 'Unit Price', 'Purchased From(Shop Name)', 'PARTICULERS', 'QTY (distributed)', 'Date of Distribution', 'Distributed to Department', 'Distribution Authorised by'].map(c => (
                  <span key={c} style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--border)', padding: '2px 8px', borderRadius: 4 }}>{c}</span>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 10 }}>💡 Your Excel file from the estate manager will be auto-detected correctly.</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Column Mapping ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: 'var(--text2)' }}>
                  Found <strong style={{ color: 'var(--text)' }}>{rows.length} rows</strong> in <strong style={{ color: 'var(--text)' }}>{file?.name}</strong>
                </p>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Review or adjust column mappings below. Unmapped columns will be ignored.</p>
              </div>
              {sheets.length > 1 && (
                <div>
                  <label className="form-label">Sheet</label>
                  <select className="form-control" style={{ width: 160 }} value={selectedSheet} onChange={e => onSheetChange(e.target.value)}>
                    {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Your Excel Column</th>
                    <th>Maps To Field</th>
                    <th>Sample Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rawHeaders.map(h => (
                    <tr key={h}>
                      <td style={{ fontWeight: 600, maxWidth: 200 }}>{h}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ width: '100%', fontSize: 13 }}
                          value={headerMapping[h] || ''}
                          onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value || undefined }))}
                        >
                          <option value="">— Ignore this column —</option>
                          {ALL_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rows[0]?.[h]?.toString() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={goPreview}>Preview Data →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 3 && (
          <div>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '14px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e', fontFamily: 'Syne,sans-serif' }}>{validRows.length}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>✅ Valid rows — ready to import</div>
              </div>
              <div style={{ flex: 1, padding: '14px 18px', background: invalidRows.length ? 'rgba(239,68,68,0.08)' : 'var(--surface2)', border: `1px solid ${invalidRows.length ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: invalidRows.length ? '#ef4444' : 'var(--text2)', fontFamily: 'Syne,sans-serif' }}>{invalidRows.length}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>⚠️ Invalid rows — will be skipped</div>
              </div>
            </div>

            {/* Invalid rows */}
            {invalidRows.length > 0 && (
              <div style={{ marginBottom: 16, padding: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>⚠️ Rows with errors (will be skipped):</p>
                {invalidRows.slice(0, 5).map(r => (
                  <div key={r._row} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                    Row {r._row}: <strong>{r.itemName || '—'}</strong> — {r._errors.join(', ')}
                  </div>
                ))}
                {invalidRows.length > 5 && <div style={{ fontSize: 12, color: 'var(--text2)' }}>…and {invalidRows.length - 5} more</div>}
              </div>
            )}

            {/* Preview table of valid rows */}
            {validRows.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Preview of first 5 valid rows:</p>
                <div style={{ overflowX: 'auto', marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Category</th>
                        <th>Item Name</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Dist. Qty</th>
                        <th>Dist. Dept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 10).map(r => (
                        <tr key={r._row}>
                          <td style={{ color: 'var(--text2)' }}>{r._row}</td>
                          <td><span className="badge badge-default" style={{ fontSize: 10 }}>{r.category || 'OTHER'}</span></td>
                          <td style={{ fontWeight: 600 }}>{r.itemName}</td>
                          <td>{r.quantityPurchased}</td>
                          <td>{r.unitPrice ? `₹${r.unitPrice}` : '—'}</td>
                          <td>{r.quantityDistributed || '—'}</td>
                          <td style={{ color: 'var(--text2)' }}>{r.distributedToDepartment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {validRows.length === 0 && (
              <div className="empty-state">
                <div className="icon">⚠️</div>
                <h3>No valid rows found</h3>
                <p>Please go back and fix column mappings</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
              {validRows.length > 0 && (
                <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                  {importing ? '⏳ Importing...' : `✅ Import ${validRows.length} Items`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Results ── */}
        {step === 4 && result && (
          <div style={{ textAlign: 'center' }}>
            {result.error ? (
              <>
                <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', marginBottom: 8, color: 'var(--danger)' }}>Import Failed</h3>
                <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{result.error}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: 'Syne,sans-serif', marginBottom: 20 }}>Import Complete!</h3>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{ padding: '16px 28px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e', fontFamily: 'Syne,sans-serif' }}>{result.imported}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>Items Imported</div>
                  </div>
                  {result.failed > 0 && (
                    <div style={{ padding: '16px 28px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', fontFamily: 'Syne,sans-serif' }}>{result.failed}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>Failed</div>
                    </div>
                  )}
                </div>

                {result.errors?.length > 0 && (
                  <div style={{ textAlign: 'left', padding: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Failed rows:</p>
                    {result.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
                        Row {e.row}: <strong>{e.itemName}</strong> — {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <button className="btn btn-primary" style={{ minWidth: 140 }} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
