export default function QAStatsCards({ data }) {
    const stats = [
        { val: data.sampledCount, label: 'Records Analizados', color: '#00e676', bg: 'rgba(0,230,118,0.1)', border: '#00e676' },
        { val: data.totalMedical, label: 'Total Medical Records', color: 'var(--accent)', bg: 'rgba(138,43,226,0.1)', border: 'rgba(138,43,226,0.4)' },
        { val: data.totalBills, label: 'Bills (Excluidos)', color: '#ff4d4d', bg: 'rgba(255,0,0,0.05)', border: 'rgba(255,0,0,0.3)' },
        { val: data.providerNames.length, label: 'Providers', color: '#00d2ff', bg: 'rgba(0,210,255,0.1)', border: 'rgba(0,210,255,0.3)' }
    ];

    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {stats.map((stat, index) => (
                <div
                    key={index}
                    style={{
                        background: stat.bg,
                        border: `1px solid ${stat.border}`,
                        borderRadius: '12px',
                        padding: '12px 20px',
                        flex: 1,
                        minWidth: '140px',
                        textAlign: 'center'
                    }}
                >
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color }}>{stat.val}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
