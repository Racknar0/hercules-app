"use client";

import { formatDateMMDDYYYY } from '@/helpers/dateFormat';

export default function OrganizerProcessingSection({
 thinkingData,
 thinkingHistory,
 thinkingOpen,
 setThinkingOpen,
 isUploading,
 formatTime,
 elapsedSeconds,
 streamLogs,
 terminalEndRef,
}) {
 return (
 <>
 {(thinkingData || thinkingHistory.length >0) && (
 <section
 style={{
 background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(15, 23, 42, 0.6))',
 border: '1px solid rgba(168, 85, 247, 0.4)',
 borderRadius: '12px',
 padding: thinkingOpen ? '1.2rem' : '0.6rem 1.2rem',
 marginBottom: '1rem',
 position: 'relative',
 overflow: 'hidden',
 transition: 'padding 0.3s ease',
 }}
 >
 <div
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 height: '3px',
 background: isUploading
 ? 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)'
 : 'linear-gradient(90deg, #22c55e, #10b981)',
 backgroundSize: '200% 100%',
 animation: isUploading ? 'shimmer 2s ease-in-out infinite' : 'none',
 }}
 />
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 cursor: 'pointer',
 userSelect: 'none',
 }}
 onClick={() =>setThinkingOpen((prev) =>!prev)}
 >
 <span style={{ fontSize: '1.3rem' }}>AI</span>
 <span
 style={{
 color: '#c084fc',
 fontWeight: '700',
 fontSize: '1.1rem',
 letterSpacing: '1px',
 }}
 >
 RAZONAMIENTO
 </span>
 <span
 style={{
 color: 'var(--text-muted)',
 fontSize: '0.9rem',
 marginLeft: 'auto',
 }}
 >
 {thinkingHistory.length} doc{thinkingHistory.length !== 1 ? 's' : ''}
 </span>
 <span
 style={{
 fontSize: '1.2rem',
 color: '#a78bfa',
 transition: 'transform 0.3s',
 transform: thinkingOpen ? 'rotate(180deg)' : 'rotate(0deg)',
 }}
 >
 v
 </span>
 </div>

 {thinkingOpen && (
 <div style={{ marginTop: '0.8rem' }}>
 {thinkingData && (
 <div
 style={{
 background: 'rgba(0,0,0,0.35)',
 borderRadius: '8px',
 padding: '1rem',
 marginBottom: thinkingHistory.length >1 ? '0.8rem' : 0,
 }}
 >
 <div
 style={{
 display: 'flex',
 gap: '0.6rem',
 flexWrap: 'wrap',
 marginBottom: '0.7rem',
 }}
 >
 <span
 style={{
 background: 'rgba(168,85,247,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#e9d5ff',
 }}
 >
 {thinkingData.filename}
 </span>
 <span
 style={{
 background:
 thinkingData.summary?.tipo === 'Bill'
 ? 'rgba(251,191,36,0.3)'
 : 'rgba(34,197,94,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color:
 thinkingData.summary?.tipo === 'Bill'
 ? '#fde68a'
 : '#bbf7d0',
 }}
 >
 {thinkingData.summary?.tipo}
 </span>
 <span
 style={{
 background: 'rgba(6,182,212,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#a5f3fc',
 }}
 >
 {thinkingData.summary?.cliente}
 </span>
 {thinkingData.summary?.intruso && (
 <span
 style={{
 background: 'rgba(239,68,68,0.4)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#fca5a5',
 }}
 >
 INTRUSO
 </span>
 )}
 <span
 style={{
 background: 'rgba(59,130,246,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#bfdbfe',
 }}
 >
 {thinkingData.summary?.items} items
 </span>
 </div>
 <div
 style={{
 fontSize: '0.95rem',
 color: '#d1d5db',
 lineHeight: '1.7',
 fontStyle: 'italic',
 maxHeight: '250px',
 overflowY: 'auto',
 whiteSpace: 'pre-wrap',
 scrollbarWidth: 'thin',
 }}
 >
 {thinkingData.reasoning}
 </div>
 </div>
 )}

 {thinkingHistory.length >1 && (
 <details style={{ marginTop: '0.5rem' }}>
 <summary
 style={{
 cursor: 'pointer',
 color: '#a78bfa',
 fontSize: '0.9rem',
 userSelect: 'none',
 }}
 >
 Ver historial completo ({thinkingHistory.length - 1} anteriores)
 </summary>
 <div
 style={{
 maxHeight: '400px',
 overflowY: 'auto',
 marginTop: '0.5rem',
 scrollbarWidth: 'thin',
 }}
 >
 {thinkingHistory
 .slice(0, -1)
 .reverse()
 .map((t, i) =>(
 <div
 key={i}
 style={{
 background: 'rgba(0,0,0,0.2)',
 borderRadius: '6px',
 padding: '0.7rem',
 marginBottom: '0.5rem',
 fontSize: '0.88rem',
 color: '#9ca3af',
 }}
 >
 <strong style={{ color: '#c084fc' }}>{t.filename}</strong>
 <span
 style={{
 marginLeft: '8px',
 color: t.summary?.tipo === 'Bill' ? '#fde68a' : '#bbf7d0',
 }}
 >
 {t.summary?.tipo}
 </span>
 {t.timestamp && (
 <span
 style={{
 marginLeft: '8px',
 color: '#6b7280',
 fontSize: '0.78rem',
 }}
 >
 {formatDateMMDDYYYY(t.timestamp)}
 </span>
 )}
 <div
 style={{
 marginTop: '4px',
 fontStyle: 'italic',
 lineHeight: '1.5',
 whiteSpace: 'pre-wrap',
 }}
 >
 {t.reasoning}
 </div>
 </div>
 ))}
 </div>
 </details>
 )}
 </div>
 )}
 </section>
 )}

 <section className="terminal-container">
 <div className="terminal-header">
 <span>Procesando con inteligencia artificial</span>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span
 style={{
 fontFamily: 'monospace',
 fontSize: '1.1rem',
 color: 'var(--h-primary)',
 fontWeight: 'bold',
 letterSpacing: '2px',
 }}
 >
 {formatTime(elapsedSeconds)}
 </span>
 <span
 className="spinner"
 style={{ width: '12px', height: '12px', borderWidth: '2px' }}
 ></span>
 </div>
 </div>
 <div className="terminal-body">
 {streamLogs.map((log, index) =>(
 <div key={index} className="terminal-line">
 {log}
 </div>
 ))}
 <div ref={terminalEndRef} />
 {!streamLogs.length && (
 <div className="terminal-line">Iniciando interfaz de transferencia...</div>
 )}
 <div className="terminal-line">
 <span style={{ color: 'transparent' }}>_</span>
 <span className="terminal-cursor"></span>
 </div>
 </div>
 </section>
 </>
 );
}

