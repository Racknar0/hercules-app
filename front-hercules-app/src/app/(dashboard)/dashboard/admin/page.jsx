export default function AdminDashboardPage() {
    return (
        <section
            style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--h-border)',
                background: 'var(--h-card-bg)',
            }}
        >
            <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Super Admin Section</h1>
            <p style={{ margin: 0, color: 'var(--h-text-secondary)' }}>
                This area is reserved for SUPER_ADMIN accounts. Use it for global controls,
                tenant administration, and platform-level settings.
            </p>
        </section>
    );
}
