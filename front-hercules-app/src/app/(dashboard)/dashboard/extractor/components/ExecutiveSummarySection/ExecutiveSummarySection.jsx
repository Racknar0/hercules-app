import { getQA, hasMeaningfulAnswer, QA_FIELDS } from '../qaConfig/qaConfig';

export default function ExecutiveSummarySection({ data, openDoc }) {
 return (
 <section style={{ marginTop: '2rem', background: 'rgba(255,92,0,0.03)', border: '2px solid rgba(255,92,0,0.3)', borderRadius: '16px', padding: '2rem' }}>
 <h2 style={{ color: '#FF5C00', marginBottom: '1.5rem' }}>Resumen Ejecutivo</h2>
 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
 Basado en {data.sampledCount} Medical Record(s) de {data.providerNames.length} provider(s).
 </p>

 {QA_FIELDS.map(field =>{
 const entries = [];

 Object.values(data.groupedByProvider).forEach(records =>{
 records.forEach(record =>{
 if (!record.qa) return;
 const qa = getQA(record.qa[field.key]);
 if (hasMeaningfulAnswer(qa.answer)) {
 entries.push({ answer: qa.answer, source: qa.source, archivo: record.archivo });
 }
 });
 });

 if (!entries.length) return null;

 return (
 <div key={field.key} style={{ marginBottom: '1.5rem' }}>
 <h4 style={{ color: field.color, marginBottom: '0.5rem' }}>{field.label}</h4>
 {entries.map((entry, index) =>(
 <div
 key={index}
 style={{
 background: 'rgba(255,255,255,0.03)',
 padding: '10px 14px',
 borderRadius: '8px',
 marginBottom: '6px',
 borderLeft: `3px solid ${field.color}`
 }}
 >
 <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{entry.answer}</div>
 <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '3px' }}>
 <span className="doc-link" onClick={() =>openDoc(entry.archivo)}>
 {entry.archivo}
 </span>
 {entry.source && <>- {entry.source}</>}
 </div>
 </div>
 ))}
 </div>
 );
 })}
 </section>
 );
}
