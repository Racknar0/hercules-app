"use client";

import Select from 'react-select';

const selectStyles = {
 control: (base) =>({ ...base, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'white', minWidth: '350px' }),
 menu: (base) =>({ ...base, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }),
 option: (base, state) =>({ ...base, background: state.isFocused ? 'rgba(var(--h-primary-rgb),0.3)' : 'transparent', color: 'white' }),
 singleValue: (base) =>({ ...base, color: 'white' }),
 input: (base) =>({ ...base, color: 'white' }),
 placeholder: (base) =>({ ...base, color: '#888' }),
};

export default function BatchSelectorCard({
 loteOptions,
 selectedLote,
 setSelectedLote,
 fileCheck,
 filesUnavailable,
}) {
 return (
 <section
 style={{
 background: 'var(--card-bg)',
 borderRadius: '16px',
 padding: '1.5rem',
 border: '2px solid rgba(var(--h-primary-rgb),0.3)',
 marginBottom: '1.5rem',
 }}
 >
 <h3 style={{ color: 'var(--h-primary)', marginBottom: '0.8rem' }}>
 Seleccionar Batch para Análisis
 </h3>
 <Select
 instanceId="extractor-batch-select"
 inputId="extractor-batch-select-input"
 isClearable
 options={loteOptions}
 value={selectedLote}
 onChange={setSelectedLote}
 placeholder=" Seleccionar Lote (Cliente + DOL)..."
 styles={selectStyles}
 noOptionsMessage={() =>
 'No hay lotes disponibles. Procesa documentos en el Organizer primero.'
 }
 />

 {fileCheck && selectedLote && (
 <div
 style={{
 marginTop: '0.8rem',
 padding: '10px',
 borderRadius: '8px',
 background: filesUnavailable
 ? 'rgba(255,0,0,0.1)'
 : 'rgba(0,230,118,0.05)',
 border: filesUnavailable
 ? '1px solid #ff4d4d'
 : '1px solid rgba(0,230,118,0.2)',
 }}
 >
 {filesUnavailable ? (
 <p
 style={{
 color: '#ff4d4d',
 margin: 0,
 fontSize: '0.85rem',
 }}
 >
 {' '}
 <strong>
 Los documentos de este batch ya no están disponibles.
 </strong>{' '}
 Los archivos temporales se eliminan después de 72 horas.
 Necesitas volver a correr el Medical Organizer para este
 caso.
 </p>
 ) : (
 <p
 style={{
 color: '#22C55E',
 margin: 0,
 fontSize: '0.85rem',
 }}
 >
 {fileCheck.available} archivo(s) disponibles ·{' '}
 {fileCheck.medicalCount} Medical Record(s) ·{' '}
 {fileCheck.unavailable >0
 ? ` ${fileCheck.unavailable} no encontrado(s)`
 : 'Todos los archivos en caché'}
 </p>
 )}
 </div>
 )}
 </section>
 );
}


