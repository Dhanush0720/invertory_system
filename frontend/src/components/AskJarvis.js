import React, { useState, useRef, useEffect } from 'react';
import { alertsAPI } from '../api';

const SUGGESTED_QUESTIONS = [
  "Which items are low on stock?",
  "Which department uses the most items?",
  "What is the total inventory value?",
];

const AskNirvahana = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m Nirvahana, your inventory intelligence assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAsk = async (text) => {
    const q = (text || query).trim();
    if (!q) return;

    const newMessages = [...messages, { role: 'user', text: q }];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      const res = await alertsAPI.ask(q);
      setMessages([...newMessages, { role: 'assistant', text: res.data.answer }]);
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        text: '⚠️ Could not connect to the AI engine. Please check if Ollama is running locally.',
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '20px' : '28px',
          right: isMobile ? '20px' : '28px',
          width: '58px',
          height: '58px',
          borderRadius: '20px',
          background: isOpen
            ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
            : 'linear-gradient(135deg, #f97316, #c2500a)',
          border: 'none',
          boxShadow: isOpen
            ? '0 8px 32px rgba(37,99,235,0.5)'
            : '0 8px 32px rgba(249,115,22,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1001,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(90deg) scale(0.92)' : 'rotate(0deg) scale(1)',
        }}
        title="Ask Nirvahana"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zm-4 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 4a4 4 0 0 0-3.46 2h6.92A4 4 0 0 0 12 15z"/>
          </svg>
        )}
        {!isOpen && (
          <span style={{
            position: 'absolute',
            inset: -5,
            borderRadius: 25,
            border: '2px solid rgba(249,115,22,0.5)',
            animation: 'ping 2.5s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '90px' : '100px',
          right: isMobile ? '16px' : '28px',
          width: isMobile ? 'calc(100vw - 32px)' : '390px',
          maxHeight: isMobile ? 'calc(100vh - 120px)' : '560px',
          background: 'var(--chat-bg)',
          borderRadius: '24px',
          border: '1px solid var(--chat-border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(94, 106, 210, 0.08)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>

          {/* Top Accent Line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, #f97316 40%, #60a5fa 70%, transparent)',
          }} />

          {/* Header */}
          <div style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid var(--chat-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--chat-header-bg)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.08))',
              border: '1px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(249,115,22,0.15)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#f97316">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zm-4 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 4a4 4 0 0 0-3.46 2h6.92A4 4 0 0 0 12 15z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--chat-title)', letterSpacing: '-0.2px', fontFamily: "'Space Grotesk', sans-serif" }}>
                Nirvahana Uplink
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10d96e', boxShadow: '0 0 6px #10d96e' }} />
                <span style={{ fontSize: 11, color: 'var(--chat-status)', fontWeight: 500 }}>AI Engine Active</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'var(--chat-suggest-bg)', border: '1px solid var(--chat-border)',
                color: 'var(--chat-status)', cursor: 'pointer', fontSize: 14,
                width: 30, height: 30, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--chat-header-bg)'; e.currentTarget.style.color = 'var(--chat-title)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--chat-suggest-bg)'; e.currentTarget.style.color = 'var(--chat-status)'; }}
            >✕</button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animation: 'slideIn 0.2s ease',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#f97316">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zm-4 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 4a4 4 0 0 0-3.46 2h6.92A4 4 0 0 0 12 15z"/>
                    </svg>
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '11px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #f97316, #ea6a06)'
                    : msg.isError
                      ? 'rgba(240,64,64,0.1)'
                      : 'var(--chat-bubble-bot)',
                  border: msg.role === 'user'
                    ? 'none'
                    : msg.isError
                      ? '1px solid rgba(240,64,64,0.2)'
                      : '1px solid var(--chat-bubble-bot-border)',
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: msg.role === 'user' ? 'white' : 'var(--chat-text-bot)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: msg.role === 'user' ? '0 4px 16px rgba(249,115,22,0.25)' : 'none',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#f97316">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v2a7 7 0 0 1-7 7H10a7 7 0 0 1-7-7v-2a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zm-4 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 4a4 4 0 0 0-3.46 2h6.92A4 4 0 0 0 12 15z"/>
                  </svg>
                </div>
                <div style={{ padding: '11px 16px', background: 'var(--chat-bubble-bot)', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--chat-bubble-bot-border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316', animation: `pulse 1.2s ease ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--chat-status)', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 8 }}>SUGGESTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(q)}
                    style={{
                      padding: '8px 12px', background: 'var(--chat-suggest-bg)',
                      border: '1px solid var(--chat-suggest-border)', borderRadius: 8,
                      color: 'var(--chat-suggest-text)', fontSize: 12, textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; e.currentTarget.style.color = '#f97316'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'var(--chat-suggest-bg)'; e.currentTarget.style.borderColor = 'var(--chat-suggest-border)'; e.currentTarget.style.color = 'var(--chat-suggest-text)'; }}
                  >
                    ↗ {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--chat-border)', background: 'var(--chat-header-bg)' }}>
            <form onSubmit={e => { e.preventDefault(); handleAsk(); }} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask about inventory..."
                disabled={loading}
                className="chat-input"
                style={{
                  flex: 1, padding: '11px 14px',
                  background: 'var(--chat-input-bg)',
                  border: '1px solid var(--chat-input-border)',
                  borderRadius: 12,
                  color: 'var(--chat-input-text)', fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  outline: 'none', transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--chat-input-border)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  width: 40, height: 40,
                  borderRadius: 12, border: 'none',
                  background: query.trim() && !loading
                    ? 'var(--chat-bubble-user)'
                    : 'var(--chat-suggest-bg)',
                  color: query.trim() && !loading ? 'white' : 'var(--chat-status)',
                  cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, transition: 'all 0.2s',
                  boxShadow: query.trim() && !loading ? '0 4px 16px rgba(94, 106, 210, 0.25)' : 'none',
                }}
              >↑</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AskNirvahana;
