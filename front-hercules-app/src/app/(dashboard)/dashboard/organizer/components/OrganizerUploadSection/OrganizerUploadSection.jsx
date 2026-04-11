"use client";

import { DATE_FORMAT_HINT } from '@/helpers/dateFormat';

export default function OrganizerUploadSection({
 files,
 isDragging,
 handleDragOver,
 handleDragLeave,
 handleDrop,
 fileInputRef,
 handleFileSelect,
 officialClient,
 setOfficialClient,
 officialDol,
 setOfficialDol,
 aiModel,
 setAiModel,
 enableQC,
 setEnableQC,
}) {
 return (
 <>
 {files.length >0 && (
 <section
 className="lote-formulario"
 style={{
 background: 'rgba(var(--h-primary-rgb), 0.05)',
 padding: '20px',
 borderRadius: '12px',
 marginBottom: '20px',
 border: '1px solid var(--h-primary)',
 }}
 >
 <h3 style={{ marginBottom: '15px', color: 'var(--h-primary)' }}>
 Perfilado oficial de carpeta
 </h3>
 <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label style={{ display: 'block', marginBottom: '5px' }}>
 Nombre de cliente (fijo)
 </label>
 <input
 type="text"
 value={officialClient}
 onChange={(e) =>setOfficialClient(e.target.value)}
 placeholder="Ej: CAMILO TORRES"
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 />
 </div>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label style={{ display: 'block', marginBottom: '5px' }}>
 Date of Loss (fijo) <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>({DATE_FORMAT_HINT})</span>
 </label>
 <input
 type="text"
 value={officialDol}
 onChange={(e) =>setOfficialDol(e.target.value)}
 placeholder={DATE_FORMAT_HINT}
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 />
 </div>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label style={{ display: 'block', marginBottom: '5px' }}>
 Modelo IA
 </label>
 <select
 value={aiModel}
 onChange={(e) =>setAiModel(e.target.value)}
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 >
 <option value="gemini-3-flash-preview" style={{ color: 'black' }}>
 Flash Preview (recomendado)
 </option>
 <option value="gemini-3.1-flash-lite-preview" style={{ color: 'black' }}>
 Flash Lite 3.1 (ultra rapido)
 </option>
 <option value="gemini-3.1-pro-preview" style={{ color: 'black' }}>
 Pro Preview (inteligente)
 </option>
 </select>
 </div>
 </div>

 <div
 style={{
 marginTop: '12px',
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 }}
 >
 <label
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 cursor: 'pointer',
 userSelect: 'none',
 }}
 >
 <input
 type="checkbox"
 checked={enableQC}
 onChange={(e) =>setEnableQC(e.target.checked)}
 style={{
 width: '18px',
 height: '18px',
 accentColor: 'var(--h-primary)',
 cursor: 'pointer',
 }}
 />
 <span
 style={{
 color: enableQC ? 'var(--h-primary)' : '#6B7280',
 fontWeight: enableQC ? 'bold' : 'normal',
 transition: 'color 0.2s',
 }}
 >
 Control de calidad (doble revision IA)
 </span>
 </label>
 {enableQC && (
 <span
 style={{
 fontSize: '0.75rem',
 color: '#ff9800',
 background: 'rgba(255,152,0,0.15)',
 padding: '3px 8px',
 borderRadius: '6px',
 }}
 >
 Duplica el tiempo de procesamiento
 </span>
 )}
 </div>
 </section>
 )}

 <section
 className={`dropzone ${isDragging ? 'dragging' : ''}`}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() =>fileInputRef.current.click()}
 >
 <input
 type="file"
 multiple
 webkitdirectory="true"
 ref={fileInputRef}
 onChange={handleFileSelect}
 accept=".png,.jpg,.jpeg,.pdf,.webp"
 />
 <div className="drop-icon">Folder</div>
 {files.length >0 ? (
 <div>
 <h3>{files.length} archivos capturados en memoria</h3>
 <p
 style={{
 marginTop: '10px',
 color: 'var(--accent)',
 fontStyle: 'italic',
 }}
 >
 {files.slice(0, 4).map((f) =>f.name).join(', ')}{' '}
 {files.length >4 ? `y ${files.length - 4} mas...` : ''}
 </p>
 </div>
 ) : (
 <div>
 <h3>Suelta carpetas completas o PDF/imagenes aqui</h3>
 <p>
 La logica recursiva buscara documentos compatibles dentro de la carpeta.
 </p>
 </div>
 )}
 </section>
 </>
 );
}

