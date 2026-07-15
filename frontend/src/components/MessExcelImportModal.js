import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { messAPI } from '../api';

const normalizeUOM = (uom) => {
  if (!uom) return 'Kg';
  const norm = uom.toString().trim().toLowerCase();
  if (norm === 'kg' || norm === 'kgs' || norm === 'kilogram' || norm === 'kilograms') return 'Kg';
  if (norm === 'litre' || norm === 'litres' || norm === 'liter' || norm === 'liters' || norm === 'l') return 'Litre';
  if (norm === 'pack' || norm === 'packet' || norm === 'packets' || norm === 'packs') return 'Pack';
  if (norm === 'bag' || norm === 'bags') return 'Bag';
  if (norm === 'nos' || norm === 'no' || norm === 'number' || norm === 'numbers' || norm === 'pcs' || norm === 'pieces') return 'Nos';
  
  const matched = ['Kg', 'Litre', 'Pack', 'Bag', 'Nos'].find(val => val.toLowerCase() === norm);
  if (matched) return matched;
  return 'Kg';
};

const normalizeCategory = (cat) => {
  if (!cat) return 'OTHER';
  const norm = cat.toString().trim().toUpperCase();
  const valid = ['GROCERY', 'VEGETABLE', 'DAIRY', 'MEAT', 'SPICE', 'FRUIT', 'OTHER'];
  if (valid.includes(norm)) return norm;
  if (norm === 'FRUITS') return 'FRUIT';
  return 'OTHER';
};

// ── Column mapping lists by import type
const IMPORT_TYPES = {
  items: {
    label: 'Stock Items (Catalog)',
    fields: [
      { key: 'name', label: 'Item Name *', required: true, synonyms: ['item name', 'name of item', 'name of the item', 'name', 'items names', 'name of the items '] },
      { key: 'nameTelugu', label: 'Telugu Name', synonyms: ['telugu name', 'name in telugu', 'item telugu name', '\r\nname of the item\r'] },
      { key: 'category', label: 'Category', synonyms: ['category', 'segment', 'type'] },
      { key: 'quantity', label: 'Qty in Stock', synonyms: ['qty', 'quantity', 'qty in stock', 'available quantity ', 'balance '] },
      { key: 'uom', label: 'UOM', synonyms: ['uom', 'unit', 'unit\'s ', 'unit\'s  2'] },
      { key: 'threshold', label: 'Low Stock Threshold', synonyms: ['threshold', 'low stock threshold', 'min qty', 'order'] },
      { key: 'costPerUnit', label: 'Cost Per Unit (₹)', synonyms: ['cost per unit', 'unit price', 'cost', 'unit price (₹)'] },
    ]
  },
  purchases: {
    label: 'Purchases History',
    fields: [
      { key: 'itemName', label: 'Item Name *', required: true, synonyms: ['item name', 'name of item', 'name of the item', 'name', 'item name', 'name of the items ', 'item name'] },
      { key: 'purchaseDate', label: 'Purchase Date', synonyms: ['date of purchased ', 'date', 'purchase date', 'date of purchase', ' date of purchased '] },
      { key: 'billNo', label: 'Bill / Invoice No', synonyms: ['bill no', 'invoice no', 'bill no/invoice no', 'bill/ invoice no', 'bill/invoice no'] },
      { key: 'company', label: 'Company / Brand', synonyms: ['company', 'brand', 'purchased-item company'] },
      { key: 'uom', label: 'UOM', synonyms: ['uom', 'unit', 'quantity '] },
      { key: 'quantityPurchased', label: 'Qty Purchased', synonyms: ['qty', 'quantity', 'qty purchased', 'quantity purchased', 'qty '] },
      { key: 'unitPrice', label: 'Unit Price (₹)', synonyms: ['unit price', 'price', 'rate', 'unit price (₹)'] },
      { key: 'shopName', label: 'Supplier / Shop Name', synonyms: ['shop name', 'supplier', 'supplier name', 'purchased from(shop name)'] },
      { key: 'particulars', label: 'Particulars / Purpose', synonyms: ['particulars', 'particulers', 'purpose', 'particulers for coking ', 'using on '] },
    ]
  },
  consumption: {
    label: 'Daily Consumption Logs',
    fields: [
      { key: 'itemName', label: 'Item Name *', required: true, synonyms: ['item name', 'name of item', 'name of the item', 'name', 'name of the items ', 'name of item'] },
      { key: 'date', label: 'Issued Date', synonyms: ['issued date', 'date of issued ', 'date', 'issued date', 'date of  issued'] },
      { key: 'mealType', label: 'Meal Type', synonyms: ['meal', 'meal type', 'purpose of using ', 'particulers'] },
      { key: 'qtyUsed', label: 'Qty Consumed', synonyms: ['qty', 'qty used', 'quantity issued', 'quantity issued ', 'qty consumed'] },
      { key: 'uom', label: 'UOM / Unit', synonyms: ['uom', 'unit', 'uom/unit', 'quantity ', 'units'] },
      { key: 'qtySpoiled', label: 'Qty Spoiled / Waste', synonyms: ['qty spoiled', 'qty wasted', 'spoilage qty'] },
      { key: 'reason', label: 'Spoilage Reason', synonyms: ['reason', 'spoilage reason', 'reason for waste'] },
      { key: 'issuedBy', label: 'Issued By', synonyms: ['issued by', 'by'] },
      { key: 'issuedTo', label: 'Issued To (Cook)', synonyms: ['issued to', 'to', 'cook'] },
      { key: 'purposeOfUsed', label: 'Purpose of Used', synonyms: ['purpose of used ', 'purpose of used', 'purpose of using '] },
      { key: 'particulars', label: 'Particulars', synonyms: ['particulars', 'particulers', 'particulars for extra cooking '] },
    ]
  },
  'served-logs': {
    label: 'Served Meals & Headcount',
    fields: [
      { key: 'date', label: 'Date served', synonyms: ['date ', 'date', 'served date'] },
      { key: 'mealType', label: 'Meal Type (e.g. LUNCH)', synonyms: ['meal type', 'meal', 'type'] },
      { key: 'itemsNames', label: 'Dishes Served *', required: true, synonyms: ['items names', 'dishes', 'dishes served', 'food served', 'items names '] },
      { key: 'foodLeftOver', label: 'Leftover Food', synonyms: ['food left over', 'leftover', 'food lift over', 'food leftover'] },
      { key: 'feedback', label: 'Feedback Rating', synonyms: ['feed back', 'feedback', 'rating'] },
      { key: 'boysHostel', label: 'Boys Headcount', synonyms: [' boys hostel', ' boys hostal', 'boys headcount', 'boys count', ' boys hostel'] },
      { key: 'girlsHostel', label: 'Girls Headcount', synonyms: ['girls hostel', 'girls  hostal', 'girls headcount', 'girls count', 'girls  hostel'] },
      { key: 'externals', label: 'Externals Count', synonyms: ['externals', 'external\'s ', 'externals count'] },
      { key: 'trainers', label: 'Trainers Count', synonyms: ['trainers', 'trainers ', 'trainers count'] },
      { key: 'guestsFaculty', label: 'Guests/Faculty Count', synonyms: ['guests/faculty', 'guests', 'faculty', 'guests/faculty count', 'guests/faculty'] },
      { key: 'staffWardens', label: 'Staff & Wardens Count', synonyms: ['staff&wardens', 'staff', 'wardens', 'staff count'] },
      { key: 'others', label: 'Others Count', synonyms: ['others', 'others count'] },
    ]
  },
  'groceries-supplies': {
    label: 'Groceries Supplies',
    fields: [
      { key: 'itemName', label: 'Item Name *', required: true, synonyms: ['item name', 'name of item', 'name of the item', 'name', 'name of item', 'items names', 'name of item	'] },
      { key: 'dateIssued', label: 'Date Issued', synonyms: ['date issued', 'date of issued ', 'date', 'issued date', 'date of  issued', 'date of issued	'] },
      { key: 'quantityIssued', label: 'Qty Issued', synonyms: ['quantity issued', 'quantity issued ', 'qty issued', 'qty', 'qty ', 'quantity issued	'] },
      { key: 'issuedTo', label: 'Issued To', synonyms: ['issued to', 'to', 'issued to	'] },
      { key: 'issuedBy', label: 'Issued By', synonyms: ['issued by', 'by', 'issued by	'] },
      { key: 'purposeOfUsed', label: 'Purpose of Used', synonyms: ['purpose of used', 'purpose of used ', 'purpose of used	'] },
      { key: 'purposeOfUsing', label: 'Purpose of Using', synonyms: ['purpose of using', 'purpose of using ', 'purpose of using	'] },
      { key: 'particularsExtraCooking', label: 'Extra Cooking Particulars', synonyms: ['particulars for extra cooking', 'particulars for extra cooking ', 'particulars for extra cooking	'] }
    ]
  }
};

// ── Shared UI Styles ────────────────────────────────────────────────────────
const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 24,
  position: 'relative',
  color: 'var(--text)',
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
  transition: 'all 0.2s',
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
  transition: 'all 0.2s',
};

function StepBadge({ n, active, done }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-heading)',
      background: done ? '#22c55e' : active ? 'var(--accent)' : 'var(--border)',
      color: done || active ? 'white' : 'var(--text3)',
      border: done || active ? 'none' : '1px solid var(--border)',
    }}>{done ? '✓' : n}</div>
  );
}

export default function MessExcelImportModal({ onClose, onImported }) {
  const [step, setStep] = useState(1); // 1=file & type, 2=mapping, 3=preview, 4=results
  const [importType, setImportType] = useState('items');
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [headerMapping, setHeaderMapping] = useState({});
  const [rows, setRows] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  // ── Auto Mapping Columns Based on synonyms
  const autoMapHeaders = useCallback((headers, type) => {
    const fields = IMPORT_TYPES[type].fields;
    const mapping = {};
    headers.forEach(h => {
      const norm = (h || '').toString().toLowerCase().trim();
      const matchedField = fields.find(f => 
        f.synonyms.includes(norm) || 
        norm.includes(f.key.toLowerCase())
      );
      if (matchedField) {
        mapping[h] = matchedField.key;
      }
    });
    setHeaderMapping(mapping);
  }, []);

  // ── Step 1: Handle File selection
  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      setSheets(wb.SheetNames);
      
      // Auto-detect a matching sheet based on import type
      let defaultSheet = wb.SheetNames[0];
      if (importType === 'items') {
        const found = wb.SheetNames.find(s => s.toLowerCase().includes('stock') || s.toLowerCase().includes('grocery') && !s.toLowerCase().includes('purchase') && !s.toLowerCase().includes('supply'));
        if (found) defaultSheet = found;
      } else if (importType === 'purchases') {
        const found = wb.SheetNames.find(s => s.toLowerCase().includes('purchase') || s.toLowerCase().includes('purchese'));
        if (found) defaultSheet = found;
      } else if (importType === 'consumption') {
        const found = wb.SheetNames.find(s => s.toLowerCase().includes('supply') || s.toLowerCase().includes('supplys'));
        if (found) defaultSheet = found;
      } else if (importType === 'served-logs') {
        const found = wb.SheetNames.find(s => s.toLowerCase().includes('menu') || s.toLowerCase().includes('day wise'));
        if (found) defaultSheet = found;
      } else if (importType === 'groceries-supplies') {
        const found = wb.SheetNames.find(s => s.toLowerCase().includes('grocery') || s.toLowerCase().includes('groceries') || s.toLowerCase().includes('supply') || s.toLowerCase().includes('supplies'));
        if (found) defaultSheet = found;
      }
      
      setSelectedSheet(defaultSheet);
      loadSheet(wb, defaultSheet, importType);
    };
    reader.readAsArrayBuffer(f);
  }, [importType, autoMapHeaders]);

  const loadSheet = (wb, sheetName, type) => {
    const ws = wb.Sheets[sheetName];
    // Find reference range of sheet (skip empty headers)
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!json.length) {
      setRawHeaders([]);
      setRows([]);
      return;
    }
    const headers = Object.keys(json[0]);
    setRawHeaders(headers);
    autoMapHeaders(headers, type);
    setRows(json);
    setStep(2);
  };

  const onSheetChange = (name) => {
    setSelectedSheet(name);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      loadSheet(wb, name, importType);
    };
    reader.readAsArrayBuffer(file);
  };

  const onImportTypeChange = (type) => {
    setImportType(type);
    if (file) {
      // Re-trigger load with new type
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        loadSheet(wb, selectedSheet, type);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // ── Step 2 → 3: Apply Mapping and Validate
  const goPreview = () => {
    const fields = IMPORT_TYPES[importType].fields;
    const mappedKeys = Object.values(headerMapping);
    
    // Check required fields
    const missing = fields.filter(f => f.required && !mappedKeys.includes(f.key));
    if (missing.length > 0) {
      alert(`⚠️ Mapping Required:\nPlease map the following mandatory columns:\n\n${missing.map(m => m.label).join('\n')}`);
      return;
    }

    // Map rows and validate
    const valid = [];
    const invalid = [];

    rows.forEach((rawRow, idx) => {
      const mapped = {};
      Object.entries(rawRow).forEach(([rawHeader, value]) => {
        const fieldKey = headerMapping[rawHeader];
        if (fieldKey) mapped[fieldKey] = value;
      });

      if (mapped.uom !== undefined) mapped.uom = normalizeUOM(mapped.uom);
      if (mapped.category !== undefined) mapped.category = normalizeCategory(mapped.category);

      // Simple validation rules
      const errors = [];
      if (importType === 'items') {
        if (!mapped.name || mapped.name.toString().trim() === '') errors.push('Item name is required');
      } else if (importType === 'purchases') {
        if (!mapped.itemName || mapped.itemName.toString().trim() === '') errors.push('Item name is required');
        mapped.quantityPurchased = parseFloat(mapped.quantityPurchased) || 0;
        mapped.unitPrice = parseFloat(mapped.unitPrice) || 0;
      } else if (importType === 'consumption') {
        if (!mapped.itemName || mapped.itemName.toString().trim() === '') errors.push('Item name is required');
        mapped.qtyUsed = parseFloat(mapped.qtyUsed) || 0;
        mapped.qtySpoiled = parseFloat(mapped.qtySpoiled) || 0;
      } else if (importType === 'served-logs') {
        if (!mapped.itemsNames || mapped.itemsNames.toString().trim() === '') errors.push('Dishes served names required');
        mapped.date = mapped.date || new Date().toISOString().split('T')[0];
        mapped.mealType = (mapped.mealType || 'GENERAL').toUpperCase().trim();
      } else if (importType === 'groceries-supplies') {
        if (!mapped.itemName || mapped.itemName.toString().trim() === '') errors.push('Item Name is required');
        mapped.quantityIssued = parseFloat(mapped.quantityIssued) || 0;
        mapped.issuedTo = (mapped.issuedTo || 'N/A').toString().trim();
        mapped.issuedBy = (mapped.issuedBy || 'N/A').toString().trim();
      }

      if (errors.length > 0) {
        invalid.push({ ...mapped, _row: idx + 2, _errors: errors });
      } else {
        valid.push({ ...mapped, _row: idx + 2 });
      }
    });

    setValidRows(valid);
    setInvalidRows(invalid);
    setStep(3);
  };

  // ── Step 3 → 4: Submit bulk import API
  const handleImport = async () => {
    setImporting(true);
    try {
      let res;
      if (importType === 'items') {
        res = await messAPI.bulkImportItems(validRows);
      } else if (importType === 'purchases') {
        res = await messAPI.bulkImportPurchases(validRows);
      } else if (importType === 'consumption') {
        res = await messAPI.bulkImportConsumption(validRows);
      } else if (importType === 'served-logs') {
        res = await messAPI.bulkImportServedLogs(validRows);
      } else if (importType === 'groceries-supplies') {
        res = await messAPI.bulkImportGroceriesSupplies(validRows);
      }
      setResult(res.data);
      setStep(4);
      onImported && onImported();
    } catch (e) {
      setResult({ error: e.response?.data?.message || 'Import transaction failed' });
      setStep(4);
    }
    setImporting(false);
  };

  const STEPS = ['Setup & Upload', 'Column Map', 'Preview Data', 'Completed'];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div style={{
        ...cardStyle, width: '100%', maxWidth: 750, maxHeight: '90vh',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--text)' }}>📥 Mess Excel Import Wizard</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }} onClick={onClose}>✕</button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: '10px 0' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StepBadge n={i + 1} active={step === i + 1} done={step > i + 1} />
                <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--text3)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > i + 1 ? '#22c55e' : 'var(--border)', margin: '0 10px', minWidth: 20 }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Setup & Upload ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>1. Select Data Import Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {Object.entries(IMPORT_TYPES).map(([key, value]) => (
                  <button key={key} type="button"
                    onClick={() => onImportTypeChange(key)}
                    style={{
                      ...btnSecondary,
                      padding: '12px 14px',
                      background: importType === key ? 'var(--accent)' : 'var(--accent-subtle)',
                      color: importType === key ? '#fff' : 'var(--text2)',
                      border: importType === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                      fontWeight: 700,
                    }}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>2. Drag or Upload Excel Sheet</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: dragOver ? 'var(--accent-subtle)' : 'var(--surface2)',
                }}
              >
                <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
                <h4 style={{ margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>Select Excel Spreadsheet</h4>
                <p style={{ color: 'var(--text3)', fontSize: 12, margin: '0 0 14px 0' }}>Supports .xlsx, .xls, .csv</p>
                <button type="button" style={btnSecondary}>Choose File</button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: MAPPING ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)' }}>
                  File: <strong>{file?.name}</strong> | Found <strong>{rows.length} rows</strong>
                </p>
              </div>
              {sheets.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Select Sheet:</span>
                  <select style={{ ...selectStyle, width: 180, padding: '6px 10px' }} value={selectedSheet} onChange={e => onSheetChange(e.target.value)}>
                    {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--accent-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: 10, textAlign: 'left', color: 'var(--text3)' }}>Spreadsheet Column</th>
                    <th style={{ padding: 10, textAlign: 'left', color: 'var(--text3)' }}>Maps to Field</th>
                    <th style={{ padding: 10, textAlign: 'left', color: 'var(--text3)' }}>Sample Value</th>
                  </tr>
                </thead>
                <tbody>
                  {rawHeaders.map(h => (
                    <tr key={h} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 10, fontWeight: 700, color: 'var(--text)' }}>{h}</td>
                      <td style={{ padding: 10 }}>
                        <select
                          style={{ ...selectStyle, padding: '6px 10px', fontSize: 12 }}
                          value={headerMapping[h] || ''}
                          onChange={e => setHeaderMapping(prev => ({ ...prev, [h]: e.target.value || undefined }))}
                        >
                          <option value="">— Ignore column —</option>
                          {IMPORT_TYPES[importType].fields.map(f => (
                            <option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: 10, color: 'var(--text3)', fontStyle: 'italic', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {rows[0]?.[h]?.toString() || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button style={btnSecondary} onClick={() => setStep(1)}>← Back</button>
              <button style={btnPrimary} onClick={goPreview}>Preview Columns →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PREVIEW ── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{validRows.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Valid rows to import</div>
              </div>
              <div style={{ padding: 14, background: invalidRows.length > 0 ? 'rgba(240,64,64,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${invalidRows.length > 0 ? 'rgba(240,64,64,0.2)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: invalidRows.length > 0 ? '#f04040' : 'var(--text2)' }}>{invalidRows.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Invalid rows (will be skipped)</div>
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div style={{ background: 'rgba(240,64,64,0.05)', border: '1px solid rgba(240,64,64,0.15)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f04040', marginBottom: 6 }}>Rows with validation errors:</div>
                {invalidRows.slice(0, 4).map(r => (
                  <div key={r._row} style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>
                    Line {r._row}: <strong>{r.name || r.itemName || r.itemsNames || 'Row'}</strong> — {r._errors.join(', ')}
                  </div>
                ))}
                {invalidRows.length > 4 && <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>...and {invalidRows.length - 4} more rows</div>}
              </div>
            )}

            {validRows.length > 0 ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Preview of first 4 valid rows:</div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--accent-subtle)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text3)' }}>Row</th>
                        {IMPORT_TYPES[importType].fields.filter(f => f.required).map(f => (
                          <th key={f.key} style={{ padding: 8, textAlign: 'left', color: 'var(--text3)' }}>{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 4).map(r => (
                        <tr key={r._row} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 8, color: 'var(--text3)' }}>{r._row}</td>
                          {IMPORT_TYPES[importType].fields.filter(f => f.required).map(f => (
                            <td key={f.key} style={{ padding: 8, fontWeight: 600 }}>{r[f.key]?.toString() || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontStyle: 'italic' }}>No valid rows found in this sheet mapping.</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button style={btnSecondary} onClick={() => setStep(2)}>← Back</button>
              {validRows.length > 0 && (
                <button style={btnPrimary} onClick={handleImport} disabled={importing}>
                  {importing ? '⏳ Importing...' : `✅ Import ${validRows.length} Records`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: RESULTS ── */}
        {step === 4 && result && (
          <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.error ? (
              <>
                <div style={{ fontSize: 50 }}>❌</div>
                <h3 style={{ margin: 0, color: '#f04040', fontFamily: 'var(--font-heading)' }}>Import Transaction Failed</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, margin: '0 auto', maxWidth: 450 }}>{result.error}</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 50 }}>🎉</div>
                <h3 style={{ margin: 0, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>Import Completed Successfully!</h3>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '10px 0' }}>
                  <div style={{ padding: '14px 24px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>{result.imported}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Records Imported</div>
                  </div>
                  {result.failed > 0 && (
                    <div style={{ padding: '14px 24px', background: 'rgba(240,64,64,0.08)', border: '1px solid rgba(240,64,64,0.2)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#f04040', fontFamily: 'var(--font-heading)' }}>{result.failed}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Failed</div>
                    </div>
                  )}
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div style={{ textAlign: 'left', background: 'rgba(240,64,64,0.04)', border: '1px solid rgba(240,64,64,0.15)', padding: 12, borderRadius: 'var(--radius-sm)', maxHeight: 150, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f04040', marginBottom: 4 }}>Failed Row Logs:</div>
                    {result.errors.map((e, idx) => (
                      <div key={idx} style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>
                        Row {e.row}: <strong>{e.itemName}</strong> — {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button style={{ ...btnPrimary, minWidth: 150 }} onClick={onClose}>Close Wizard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text3)',
  marginBottom: 8,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
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
  transition: 'border-color 0.2s',
  outline: 'none',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'GENERAL'];
const CATEGORIES = ['GROCERY', 'VEGETABLE', 'DAIRY', 'MEAT', 'SPICE', 'OTHER'];
const UOM_OPTIONS = ['Kg', 'Litre', 'Pack', 'Bag', 'Nos'];
