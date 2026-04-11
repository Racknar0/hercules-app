import { STATUS_LABELS } from '../qaConfig/qaConfig';

export default function InputsTableSection({ data, openDoc }) {
    return (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.2rem' }}>Tabla de Insumos Validados</h2>
            <div className="table-wrapper">
                <table style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '25%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Documento</th>
                            <th>Tipo</th>
                            <th>Provider</th>
                            <th>Estado QA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.inputsTable.map((row, index) => {
                            const status = STATUS_LABELS[row.status] || STATUS_LABELS.not_sampled;
                            return (
                                <tr key={index}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{index + 1}</td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.archivo}>
                                        <small style={{ cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline' }} onClick={() => openDoc(row.archivo)}>
                                            {row.archivo}
                                        </small>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: row.isMedical ? 'rgba(138,43,226,0.3)' : 'rgba(255,0,0,0.2)',
                                                color: row.isMedical ? '#ccc' : '#ff6666'
                                            }}
                                        >
                                            {row.tipoDocumento}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.provider}</td>
                                    <td>
                                        <span style={{ fontSize: '0.8rem', color: status.color, fontWeight: 'bold' }}>{status.text}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
