export default function NoBatchSelectedState() {
 return (
 <div style={{ textAlign: 'center', padding: '3rem 0' }}>
 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
 <h3 style={{ color: 'var(--text-muted)' }}>Select a Batch above</h3>
 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
 Choose the document batch to run QA analysis on.
 </p>
 </div>
 );
}
