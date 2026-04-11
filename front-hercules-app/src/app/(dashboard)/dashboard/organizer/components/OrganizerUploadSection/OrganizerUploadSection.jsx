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
 Official folder profiling
 </h3>
 <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label style={{ display: 'block', marginBottom: '5px' }}>
 Client name (fixed)
 </label>
 <input
 type="text"
 value={officialClient}
 onChange={(e) =>setOfficialClient(e.target.value)}
 placeholder="E.g.: CAMILO TORRES"
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
 Date of Loss (fixed) <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>({DATE_FORMAT_HINT})</span>
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
 AI model
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
 Flash Preview (recommended)
 </option>
 <option value="gemini-3.1-flash-lite-preview" style={{ color: 'black' }}>
 Flash Lite 3.1 (ultra fast)
 </option>
 <option value="gemini-3.1-pro-preview" style={{ color: 'black' }}>
 Pro Preview (intelligent)
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
 Quality control (double AI review)
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
 Doubles processing time
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
 <h3>{files.length} files captured in memory</h3>
 <p
 style={{
 marginTop: '10px',
 color: 'var(--accent)',
 fontStyle: 'italic',
 }}
 >
 {files.slice(0, 4).map((f) =>f.name).join(', ')}{' '}
 {files.length >4 ? `and ${files.length - 4} more...` : ''}
 </p>
 </div>
 ) : (
 <div>
 <h3>Drop complete folders or PDF/images here</h3>
 <p>
 The recursive logic will search for compatible documents inside the folder.
 </p>
 </div>
 )}
 </section>
 </>
 );
}

