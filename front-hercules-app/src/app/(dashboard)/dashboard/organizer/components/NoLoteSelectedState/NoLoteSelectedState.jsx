"use client";

export default function NoLoteSelectedState({ selectedLote, loteOptions }) {
    if (selectedLote || loteOptions.length === 0) return null;

    return (
        <div
            style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-muted)',
            }}
        >
            <h3>Selecciona un lote del dropdown para ver sus documentos</h3>
            <p>{loteOptions.length} lote(s) disponibles en la base de datos.</p>
        </div>
    );
}
