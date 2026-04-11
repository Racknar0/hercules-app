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
 <h3>Select a batch from the dropdown to view its documents</h3>
 <p>{loteOptions.length} batch(es) available in the database.</p>
 </div>
 );
}
