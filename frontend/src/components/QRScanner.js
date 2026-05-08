import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { adminAPI } from '../api';

const QRScanner = ({ onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Scanner on mount
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(async (decodedText) => {
      // Pause scanning
      scanner.pause();
      setLoading(true);
      setError(null);
      
      try {
        const res = await adminAPI.get(`/items/qr/${decodedText}`);
        setScanResult(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Item not found in database.');
      } finally {
        setLoading(false);
        // We do not resume scanner automatically unless user dismisses the result
      }
    }, (error) => {
      // Ignore routine scan errors
    });

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleQuickDeduct = async () => {
    try {
      await adminAPI.post(`/items/${scanResult._id}/quick-deduct`, {});
      alert('1 Unit Deducted Successfully!');
      setScanResult(prev => ({ ...prev, quantityRemaining: prev.quantityRemaining - 1 }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deduct');
    }
  };

  return (
    <div className="qr-scanner-overlay" style={styles.overlay}>
      <div className="qr-scanner-modal card" style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, color: 'var(--text)' }}>📷 Scan Asset QR</h3>
          <button className="btn" onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>
        
        {!scanResult && !error && (
          <div id="qr-reader" style={styles.readerBox}></div>
        )}

        {loading && <p style={{ textAlign: 'center', color: 'var(--text2)' }}>Looking up asset...</p>}

        {error && (
          <div style={styles.resultBox}>
            <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>❌ {error}</p>
            <button className="btn primary" onClick={() => { setError(null); document.getElementById('html5-qrcode-button-camera-start')?.click(); }}>Scan Again</button>
          </div>
        )}

        {scanResult && (
          <div style={styles.resultBox}>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--accent)' }}>{scanResult.itemName}</h2>
            <div style={styles.detailGrid}>
              <span><strong>Type:</strong> {scanResult.assetType || 'Consumable'}</span>
              <span><strong>Total Stock:</strong> {scanResult.quantityPurchased}</span>
              <span><strong>Remaining:</strong> <b style={{color: scanResult.quantityRemaining < 5 ? 'var(--danger)' : 'var(--success)'}}>{scanResult.quantityRemaining}</b></span>
              <span><strong>Location:</strong> {scanResult.location ? `${scanResult.location.building} - ${scanResult.location.room}` : 'Unassigned'}</span>
            </div>
            
            <div style={styles.actions}>
              {scanResult.assetType !== 'Fixed Asset' && (
                <button className="btn warning" onClick={handleQuickDeduct} disabled={scanResult.quantityRemaining <= 0}>
                  ⚡ Quick Deduct 1 Unit
                </button>
              )}
              <button className="btn" onClick={() => { setScanResult(null); }}>Scan Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
  modal: { width: '90%', maxWidth: '400px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'transparent', border: '1px solid var(--border)', padding: '5px 10px', fontSize: '1rem', color: 'var(--text2)', cursor: 'pointer', borderRadius: '8px' },
  readerBox: { width: '100%', overflow: 'hidden', borderRadius: '12px' },
  resultBox: { display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center' },
  detailGrid: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', textAlign: 'left', backgroundColor: 'var(--surface2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' },
  actions: { display: 'flex', gap: '10px', marginTop: '10px', width: '100%' }
};

export default QRScanner;
