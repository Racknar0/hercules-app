export default function NoResultsState() {
    return (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
            <h3 style={{ color: 'var(--text-muted)' }}>Sin resultados QA para este batch</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Presiona <strong style={{ color: '#00e676' }}>&apos;Iniciar Analisis QA&apos;</strong> para comenzar.
            </p>
        </div>
    );
}
