import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../api';

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data } = await alertsAPI.getActive();
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load Nirvahana alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to let the AI take action
  const handleActionClick = async (alert) => {
    try {
      await alertsAPI.resolve(alert._id);

      // Auto-Drafting: If the action suggests ordering, open a pre-filled email to the vendor
      const rec = alert.recommended_action.toLowerCase();
      if (rec.includes("purchase") || rec.includes("order") || alert.action_code === "AUTO_ORDER") {
           const subject = encodeURIComponent(`Purchase Order Request - Nirvahana Automated Alert`);
           const body = encodeURIComponent(`Dear Vendor,\n\nOur Estate Management AI (Nirvahana) has detected a critical stockout risk.\n\nInsight: ${alert.message}\nAction Required: ${alert.recommended_action}\n\nPlease provide a quotation for the aforementioned items ASAP.\n\nRegards,\nCollege Estate Manager`);
           window.open(`mailto:vendor@example.com?subject=${subject}&body=${body}`, '_blank');
      }

      // Remove the resolved alert from the UI immediately
      setAlerts(prev => prev.filter(a => a._id !== alert._id));
    } catch (err) {
      console.error("Failed to resolve alert", err);
      alert("System error tracking AI action. Please check connection.");
    }
  };

  // --- Styles ---
  const styles = {
    container: { width: '100%', marginBottom: '24px' },
    headerBox: { backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', marginBottom: '16px', borderLeft: '4px solid #3b82f6', boxShadow: 'var(--shadow)' },
    headerTitle: { margin: '0 0 10px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' },
    summaryText: { margin: 0, color: 'var(--text2)', lineHeight: '1.5' },
    card: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '15px 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' },
    badge: (severity) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
      backgroundColor: severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
      color: severity === 'High' ? '#ef4444' : '#f59e0b'
    }),
    message: { margin: 0, fontSize: '0.95rem', color: 'var(--text2)', lineHeight: '1.5' },
    actionBox: { backgroundColor: 'var(--surface2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' },
    recommendation: { fontSize: '0.85rem', color: 'var(--text)', margin: 0, maxWidth: '70%' },
    button: { backgroundColor: 'var(--accent)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }
  };

  if (loading) {
    return (
      <div style={{ ...styles.headerBox, opacity: 0.7 }}>
         <h3 style={styles.headerTitle}>🔗 Connecting to Nirvahana Core...</h3>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div style={{ ...styles.headerBox, borderLeftColor: '#10b981' }}>
        <h3 style={styles.headerTitle}>🤖 Agent Status: Idle</h3>
        <p style={styles.summaryText}>All inventory systems are nominal. No anomalies detected.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Summary Bar */}
      <div style={styles.headerBox}>
        <h3 style={styles.headerTitle}>🧠 Nirvahana Daily Briefing</h3>
        <p style={styles.summaryText}>I have analyzed your live inventory data and found {alerts.length} critical insights requiring your attention.</p>
      </div>

      {/* Alert Cards */}
      {alerts.map((alert) => (
        <div key={alert._id} style={{ ...styles.card, borderLeft: `5px solid ${alert.severity === 'High' ? '#ef4444' : '#f59e0b'}` }}>
          
          <div style={styles.cardHeader}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {alert.issue_type === 'Anomaly Detection' ? '🕵️‍♂️' : '📦'} {alert.issue_type}
            </span>
            <span style={styles.badge(alert.severity)}>{alert.severity} Priority</span>
          </div>

          <p style={styles.message}>{alert.message}</p>

          {/* Action Area */}
          <div style={styles.actionBox}>
            <p style={styles.recommendation}><strong>Agent Suggests:</strong> {alert.recommended_action}</p>
            <button 
              style={styles.button}
              onClick={() => handleActionClick(alert)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              Approve Action
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartAlerts;