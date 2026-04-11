import { getQA, QA_FIELDS } from '../qaConfig/qaConfig';

export default function ProvidersResultsSection({ data, openDoc }) {
 return (
 <section>
 <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.2rem' }}>Resultados por Medical Provider</h2>
 {data.providerNames.map(provider =>{
 const records = data.groupedByProvider[provider].filter(record =>record.hasQA);
 if (!records.length) return null;

 return (
 <div key={provider} style={{ marginBottom: '2rem' }}>
 <h3 style={{ color: '#FF5C00', marginBottom: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,92,0,0.3)' }}>
 {provider}
 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
 ({records.length})
 </span>
 </h3>
 <div className="qa-grid">
 {records.map((record, index) =>(
 <div key={index} className="qa-card">
 <div className="qa-card-header">
 <h3 className="doc-link" style={{ display: 'inline-block' }} onClick={() =>openDoc(record.archivo)}>{record.archivo}</h3>
 <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
 <span style={{ fontSize: '0.65rem', background: 'rgba(0,230,118,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#22C55E' }}>
 Muestra #{record.sampleOrder}
 </span>
 </div>
 </div>

 <div>
 {QA_FIELDS.map(field =>{
 const qa = getQA(record.qa[field.key]);
 return (
 <div key={field.key} className="qa-item" style={{ marginBottom: '0.8rem' }}>
 <span className="qa-label">{field.label}</span>
 <span className="qa-value" style={{ color: field.color }}>{qa.answer}</span>
 {qa.source && (
 <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>
 {qa.source}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </section>
 );
}
