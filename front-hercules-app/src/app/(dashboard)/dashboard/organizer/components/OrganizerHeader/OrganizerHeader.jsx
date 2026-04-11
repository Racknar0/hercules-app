"use client";

import Select from 'react-select';
import { PlusCircle, RotateCcw, Trash2, XCircle } from 'lucide-react';

export default function OrganizerHeader({
 loteOptions,
 selectedLote,
 setSelectedLote,
 customSelectStyles,
 handleNewProcess,
 handleDeleteLote,
 handleResetDB,
 isUploading,
 cancelProcess,
}) {
 return (
 <>
 <header>
 <h1>Hercules IA</h1>
 <p>Master Historical Manager with anti-duplicate shield and local viewer.</p>
 </header>

 <section className="actions-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
 <div className="select-container">
 <Select
 instanceId="organizer-header-lote-select"
 inputId="organizer-header-lote-select-input"
 isClearable
 options={loteOptions}
 value={selectedLote}
 onChange={setSelectedLote}
 placeholder="Select batch (Client + DOL)..."
 styles={customSelectStyles}
 noOptionsMessage={() =>'No batches in Master DB'}
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
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleNewProcess}
 title="Clear current selection to start another scan"
 >
 <PlusCircle size={14} />
 New Process
 </button>
 {selectedLote && (
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 100, 0, 0.8)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleDeleteLote}
 title="Delete selected case"
 >
 <Trash2 size={14} />
 Delete Case
 </button>
 )}
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 0, 0, 0.7)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleResetDB}
 title="Delete entire DB"
 >
 <RotateCcw size={14} />
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
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={cancelProcess}
 >
 <XCircle size={14} />
 Cancel
 </button>
 )}
 </div>
 </section>
 </>
 );
}

