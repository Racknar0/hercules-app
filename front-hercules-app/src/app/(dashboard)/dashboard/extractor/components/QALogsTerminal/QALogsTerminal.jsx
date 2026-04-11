export default function QALogsTerminal({ qaLogs, logsEndRef }) {
 if (!qaLogs.length) return null;

 return (
 <section className="log-terminal" style={{ marginBottom: '1.5rem', maxHeight: '250px', overflow: 'auto' }}>
 {qaLogs.map((log, index) =>(
 <div
 key={index}
 style={{
 fontFamily: 'monospace',
 fontSize: '0.8rem',
 color: log.includes('ERROR') ? '#ff4d4d' : log.includes('') ? '#22C55E' : 'var(--text-main)'
 }}
 >
 {log}
 </div>
 ))}
 <div ref={logsEndRef} />
 </section>
 );
}
