export default function NoResultsState() {
 return (
 <div style={{ textAlign: 'center', padding: '3rem 0' }}>
 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
 <h3 style={{ color: 'var(--text-muted)' }}>No QA results for this batch</h3>
 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
 Click <strong style={{ color: '#22C55E' }}>&apos;Start QA Analysis&apos;</strong> to begin.
 </p>
 </div>
 );
}
