"use client";

import Select from 'react-select';

export default function OrganizerHeader({
 loteOptions,
 selectedLote,
 setSelectedLote,
 customSelectStyles,
 handleNewProcess,
 handleInjectDummy,
 handleDeleteLote,
 handleResetDB,
 isUploading,
 cancelProcess,
}) {
 return (
 <>
 <header>
 <h1>Hercules IA</h1>
 <p>Administrador Historico Maestro con escudo anti-duplicados y visor local.</p>
 </header>

 <section className="actions-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
 <div className="select-container">
 <Select
 isClearable
 options={loteOptions}
 value={selectedLote}
 onChange={setSelectedLote}
 placeholder="Seleccionar lote (Cliente + DOL)..."
 styles={customSelectStyles}
 noOptionsMessage={() =>'No hay lotes en el Master DB'}
 />
 </div>
 <div
 style={{
 display: 'flex',
 gap: '0.4rem',
 flexWrap: 'wrap',
 alignItems: 'center',
 }}
 >
 <button
 className="btn"
 style={{
 background: 'linear-gradient(135deg, #ff9800, #ff5722)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 }}
 onClick={handleNewProcess}
 title="Limpiar batch actual y empezar nuevo"
 >
 Nuevo Proceso
 </button>
 <button
 className="btn btn-download"
 style={{
 background: '#FF5C00',
 color: 'black',
 padding: '8px 14px',
 fontSize: '0.85rem',
 }}
 onClick={handleInjectDummy}
 title="Simula inyeccion de data sin IA"
 >
 Mock
 </button>
 {selectedLote && (
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 100, 0, 0.8)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 }}
 onClick={handleDeleteLote}
 title="Elimina el caso seleccionado"
 >
 Eliminar Caso
 </button>
 )}
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 0, 0, 0.7)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 }}
 onClick={handleResetDB}
 title="Borra toda la DB"
 >
 Reset DB
 </button>
 {isUploading && (
 <button
 className="btn"
 style={{
 background: '#ff0044',
 padding: '8px 14px',
 fontSize: '0.85rem',
 animation: 'pulseBadge 1s infinite',
 }}
 onClick={cancelProcess}
 >
 Cancelar
 </button>
 )}
 </div>
 </section>
 </>
 );
}
