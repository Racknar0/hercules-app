"use client";

import React from 'react';
import EditablePencil from '../../../shared/components/EditablePencil/EditablePencil';

export default function LoteDocumentsSection({
 selectedLoteData,
 loteDocuments,
 groupedByType,
 medicalBySender,
 billsBySender,
 openDocumentLocal,
 handleDeleteRecord,
 handleRescanDoc,
 rescanningFile,
 pageRescanTarget,
 setPageRescanTarget,
 pageRescanInput,
 setPageRescanInput,
 updateDocumentField,
 updateLineItemField,
 updateSenderGroup,
}) {
 if (!selectedLoteData || loteDocuments.length === 0) return null;

 return (
 <div>
 <div className="date-group-container">
 <h2 className="date-header">
 Lote: {selectedLoteData.nombre} | DOL: {selectedLoteData.dol} - {loteDocuments.length} documentos
 </h2>
 <section className="results-split">
 <div className="results-half">
 <h2 style={{ borderBottom: 'none' }}>
 Medical Records <span className="badge-count">{groupedByType.medical.length}</span>
 </h2>
 <div className="table-wrapper">
 <table>
 <thead>
 <tr>
 <th>Client / Document</th>
 <th>Score</th>
 <th>Fecha Servicio</th>
 <th>Doctor</th>
 <th>Procedimiento</th>
 </tr>
 </thead>
 <tbody>
 {medicalBySender.length === 0 && (
 <tr>
 <td colSpan="5" style={{ textAlign: 'center' }}>Vacio</td>
 </tr>
 )}
 {medicalBySender.map(([senderName, group]) =>{
 const seenDocs = new Set();
 return (
 <React.Fragment key={`mp-${senderName}`}>
 <tr
 style={{
 background: 'linear-gradient(90deg, rgba(255,92,0,0.25), rgba(255,92,0,0.1))',
 borderLeft: '4px solid #FF5C00',
 }}
 >
 <td
 colSpan="5"
 style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '0.95rem',
 letterSpacing: '0.5px',
 }}
 >
 <span style={{ color: '#cba6f7' }}>
 <EditablePencil
 value={senderName}
 onSave={(nextValue) =>updateSenderGroup(senderName, nextValue)}
 inputWidth="220px"
 />
 </span>
 <span
 style={{
 marginLeft: '12px',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 }}
 >
 ({group.items.length} visita{group.items.length !== 1 ? 's' : ''})
 </span>
 </td>
 </tr>
 {group.items.map((item, iIdx) =>{
 const doc = item._parentDoc;
 const isFirstForDoc = !seenDocs.has(doc.archivoOrigen);
 if (isFirstForDoc) seenDocs.add(doc.archivoOrigen);
 const docItemsInGroup = group.items.filter(
 (i) =>i._parentDoc.archivoOrigen === doc.archivoOrigen,
 );
 const docRowSpan = docItemsInGroup.length;
 const editableNameField = doc.nombrePaciente?.trim()
 ? 'nombrePaciente'
 : 'nombreCliente';
 const displayPersonName =
 doc.nombrePaciente?.trim() || doc.nombreCliente || '--';

 return (
 <tr key={`mp-${senderName}-${iIdx}`}>
 {isFirstForDoc && (
 <td rowSpan={docRowSpan}>
 <strong style={{ color: 'var(--accent)' }}>
 <EditablePencil
 value={displayPersonName}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 editableNameField,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </strong>
 <br />
 <small
 style={{
 cursor: 'pointer',
 color: '#FF5C00',
 textDecoration: 'underline',
 }}
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 >
 {doc.archivoOrigen}
 </small>
 {doc._dolMissing && (
 <div style={{ marginTop: '4px' }}>
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'rgba(255,152,0,0.25)',
 color: '#ff9800',
 border: '1px solid rgba(255,152,0,0.4)',
 }}
 >
 DOL no encontrado
 </span>
 </div>
 )}
 <br />
 <button
 className="btn-sm btn-reject"
 onClick={() =>handleDeleteRecord(doc.archivoOrigen)}
 style={{ marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem' }}
 >
 Eliminar
 </button>
 <button
 className="btn-sm"
 onClick={() =>handleRescanDoc(doc.archivoOrigen)}
 disabled={!!rescanningFile}
 style={{
 marginTop: '3px',
 padding: '2px 8px',
 fontSize: '0.7rem',
 background: 'rgba(255,92,0,0.3)',
 color: '#FF5C00',
 border: '1px solid rgba(255,92,0,0.4)',
 borderRadius: '4px',
 cursor: rescanningFile ? 'wait' : 'pointer',
 }}
 >
 {rescanningFile === doc.archivoOrigen ? 'Escaneando...' : 'Re-scan IA'}
 </button>
 <button
 className="btn-sm"
 onClick={() =>{
 setPageRescanTarget(
 pageRescanTarget === doc.archivoOrigen
 ? null
 : doc.archivoOrigen,
 );
 setPageRescanInput('');
 }}
 disabled={!!rescanningFile}
 style={{
 marginTop: '3px',
 padding: '2px 8px',
 fontSize: '0.7rem',
 background: 'rgba(255,92,0,0.3)',
 color: '#cba6f7',
 border: '1px solid rgba(255,92,0,0.4)',
 borderRadius: '4px',
 cursor: 'pointer',
 }}
 >
 Pags
 </button>
 {pageRescanTarget === doc.archivoOrigen && (
 <div
 style={{
 marginTop: '4px',
 display: 'flex',
 gap: '3px',
 alignItems: 'center',
 }}
 >
 <input
 type="text"
 value={pageRescanInput}
 onChange={(e) =>setPageRescanInput(e.target.value)}
 onKeyDown={(e) =>{
 if (e.key === 'Enter' && pageRescanInput.trim()) {
 handleRescanDoc(
 doc.archivoOrigen,
 pageRescanInput.trim(),
 );
 }
 }}
 placeholder="1-5, 3, 8"
 autoFocus
 style={{
 width: '70px',
 padding: '3px 5px',
 fontSize: '0.7rem',
 borderRadius: '4px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,92,0,0.5)',
 outline: 'none',
 }}
 />
 <button
 onClick={() =>{
 if (pageRescanInput.trim()) {
 handleRescanDoc(
 doc.archivoOrigen,
 pageRescanInput.trim(),
 );
 }
 }}
 disabled={!pageRescanInput.trim()}
 style={{
 padding: '3px 6px',
 fontSize: '0.65rem',
 borderRadius: '4px',
 background: 'rgba(255,92,0,0.5)',
 color: 'white',
 border: 'none',
 cursor: 'pointer',
 }}
 >
 Go
 </button>
 </div>
 )}
 </td>
 )}
 {isFirstForDoc && (
 <td rowSpan={docRowSpan} style={{ textAlign: 'center' }}>
 {doc._nameMatchScore != null ? (
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 gap: '4px',
 }}
 >
 <span
 style={{
 fontSize: '0.85rem',
 fontWeight: 'bold',
 padding: '4px 10px',
 borderRadius: '8px',
 background:
 doc._nameMatchScore >= 70
 ? 'rgba(0,200,83,0.2)'
 : doc._nameMatchScore >= 40
 ? 'rgba(255,152,0,0.2)'
 : 'rgba(255,0,68,0.2)',
 color:
 doc._nameMatchScore >= 70
 ? '#00c853'
 : doc._nameMatchScore >= 40
 ? '#ff9800'
 : '#ff0044',
 border: `1px solid ${
 doc._nameMatchScore >= 70
 ? 'rgba(0,200,83,0.4)'
 : doc._nameMatchScore >= 40
 ? 'rgba(255,152,0,0.4)'
 : 'rgba(255,0,68,0.4)'
 }`,
 }}
 >
 {doc._nameMatchScore}%
 </span>
 <span
 style={{
 fontSize: '0.6rem',
 color: 'var(--text-muted)',
 }}
 >
 {doc._nameMatchScore >= 70
 ? 'Match'
 : doc._nameMatchScore >= 40
 ? 'Revisar'
 : 'Posible intruso'}
 </span>
 </div>
 ) : (
 <span
 style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
 >
 -
 </span>
 )}
 </td>
 )}
 <td>
 <EditablePencil
 value={item.fecha || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'fecha',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="160px"
 />
 </td>
 <td>
 <EditablePencil
 value={item.nombreDoctor?.trim() || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'nombreDoctor',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="190px"
 />
 </td>
 <td>
 <small style={{ color: 'var(--text-muted)' }}>
 <EditablePencil
 value={item.procedimientoEjecutado || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'procedimientoEjecutado',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="260px"
 />
 </small>
 </td>
 </tr>
 );
 })}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 <div className="results-half">
 <h2 style={{ borderBottom: 'none' }}>
 Financial Bills <span className="badge-count">{groupedByType.bills.length}</span>
 </h2>
 <div className="table-wrapper">
 <table>
 <thead>
 <tr>
 <th>Doc Cliente / Sender</th>
 <th>Score</th>
 <th>Fecha</th>
 <th>Doctor</th>
 <th>Monto</th>
 </tr>
 </thead>
 <tbody>
 {billsBySender.length === 0 && (
 <tr>
 <td colSpan="5" style={{ textAlign: 'center' }}>Vacio</td>
 </tr>
 )}
 {billsBySender.map(([senderName, group]) =>{
 const seenDocs = new Set();
 return (
 <React.Fragment key={`bp-${senderName}`}>
 <tr
 style={{
 background: 'linear-gradient(90deg, rgba(255,92,0,0.2), rgba(59,130,246,0.1))',
 borderLeft: '4px solid #FF5C00',
 }}
 >
 <td
 colSpan="4"
 style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '0.95rem',
 letterSpacing: '0.5px',
 }}
 >
 <span style={{ color: '#FF5C00' }}>
 <EditablePencil
 value={senderName}
 onSave={(nextValue) =>updateSenderGroup(senderName, nextValue)}
 inputWidth="220px"
 />
 </span>
 <span
 style={{
 marginLeft: '12px',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 }}
 >
 ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
 </span>
 </td>
 <td
 style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '1rem',
 color: '#f59e0b',
 textAlign: 'right',
 }}
 >
 {group.totalCost >0
 ? `$${group.totalCost.toLocaleString('en-US', {
 minimumFractionDigits: 2,
 })}`
 : '-'}
 </td>
 </tr>
 {group.items.map((item, iIdx) =>{
 const doc = item._parentDoc;
 const isFirstForDoc = !seenDocs.has(doc.archivoOrigen);
 if (isFirstForDoc) seenDocs.add(doc.archivoOrigen);
 const docItemsInGroup = group.items.filter(
 (i) =>i._parentDoc.archivoOrigen === doc.archivoOrigen,
 );
 const docRowSpan = docItemsInGroup.length;
 const editableNameField = doc.nombrePaciente?.trim()
 ? 'nombrePaciente'
 : 'nombreCliente';
 const displayPersonName =
 doc.nombrePaciente?.trim() || doc.nombreCliente || '--';

 return (
 <tr key={`bp-${senderName}-${iIdx}`}>
 {isFirstForDoc && (
 <td rowSpan={docRowSpan}>
 <strong style={{ color: 'var(--accent)' }}>
 <EditablePencil
 value={displayPersonName}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 editableNameField,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </strong>
 <br />
 <strong
 style={{
 color: 'var(--text-muted)',
 fontSize: '0.85em',
 }}
 >
 (
 <EditablePencil
 value={doc.quienEnvia || ''}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 'quienEnvia',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="220px"
 />
 )
 </strong>
 <br />
 <small
 style={{
 cursor: 'pointer',
 color: '#FF5C00',
 textDecoration: 'underline',
 }}
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 >
 {doc.archivoOrigen}
 </small>
 {doc._dolMissing && (
 <div style={{ marginTop: '4px' }}>
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'rgba(255,152,0,0.25)',
 color: '#ff9800',
 border: '1px solid rgba(255,152,0,0.4)',
 }}
 >
 DOL no encontrado
 </span>
 </div>
 )}
 <br />
 <button
 className="btn-sm btn-reject"
 onClick={() =>handleDeleteRecord(doc.archivoOrigen)}
 style={{ marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem' }}
 >
 Eliminar
 </button>
 <button
 className="btn-sm"
 onClick={() =>handleRescanDoc(doc.archivoOrigen)}
 disabled={!!rescanningFile}
 style={{
 marginTop: '3px',
 padding: '2px 8px',
 fontSize: '0.7rem',
 background: 'rgba(255,92,0,0.3)',
 color: '#FF5C00',
 border: '1px solid rgba(255,92,0,0.4)',
 borderRadius: '4px',
 cursor: rescanningFile ? 'wait' : 'pointer',
 }}
 >
 {rescanningFile === doc.archivoOrigen ? 'Escaneando...' : 'Re-scan IA'}
 </button>
 <button
 className="btn-sm"
 onClick={() =>{
 setPageRescanTarget(
 pageRescanTarget === doc.archivoOrigen
 ? null
 : doc.archivoOrigen,
 );
 setPageRescanInput('');
 }}
 disabled={!!rescanningFile}
 style={{
 marginTop: '3px',
 padding: '2px 8px',
 fontSize: '0.7rem',
 background: 'rgba(255,92,0,0.3)',
 color: '#cba6f7',
 border: '1px solid rgba(255,92,0,0.4)',
 borderRadius: '4px',
 cursor: 'pointer',
 }}
 >
 Pags
 </button>
 {pageRescanTarget === doc.archivoOrigen && (
 <div
 style={{
 marginTop: '4px',
 display: 'flex',
 gap: '3px',
 alignItems: 'center',
 }}
 >
 <input
 type="text"
 value={pageRescanInput}
 onChange={(e) =>setPageRescanInput(e.target.value)}
 onKeyDown={(e) =>{
 if (e.key === 'Enter' && pageRescanInput.trim()) {
 handleRescanDoc(
 doc.archivoOrigen,
 pageRescanInput.trim(),
 );
 }
 }}
 placeholder="1-5, 3, 8"
 autoFocus
 style={{
 width: '70px',
 padding: '3px 5px',
 fontSize: '0.7rem',
 borderRadius: '4px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,92,0,0.5)',
 outline: 'none',
 }}
 />
 <button
 onClick={() =>{
 if (pageRescanInput.trim()) {
 handleRescanDoc(
 doc.archivoOrigen,
 pageRescanInput.trim(),
 );
 }
 }}
 disabled={!pageRescanInput.trim()}
 style={{
 padding: '3px 6px',
 fontSize: '0.65rem',
 borderRadius: '4px',
 background: 'rgba(255,92,0,0.5)',
 color: 'white',
 border: 'none',
 cursor: 'pointer',
 }}
 >
 Go
 </button>
 </div>
 )}
 </td>
 )}
 {isFirstForDoc && (
 <td rowSpan={docRowSpan} style={{ textAlign: 'center' }}>
 {doc._nameMatchScore != null ? (
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 gap: '4px',
 }}
 >
 <span
 style={{
 fontSize: '0.85rem',
 fontWeight: 'bold',
 padding: '4px 10px',
 borderRadius: '8px',
 background:
 doc._nameMatchScore >= 70
 ? 'rgba(0,200,83,0.2)'
 : doc._nameMatchScore >= 40
 ? 'rgba(255,152,0,0.2)'
 : 'rgba(255,0,68,0.2)',
 color:
 doc._nameMatchScore >= 70
 ? '#00c853'
 : doc._nameMatchScore >= 40
 ? '#ff9800'
 : '#ff0044',
 border: `1px solid ${
 doc._nameMatchScore >= 70
 ? 'rgba(0,200,83,0.4)'
 : doc._nameMatchScore >= 40
 ? 'rgba(255,152,0,0.4)'
 : 'rgba(255,0,68,0.4)'
 }`,
 }}
 >
 {doc._nameMatchScore}%
 </span>
 <span
 style={{
 fontSize: '0.6rem',
 color: 'var(--text-muted)',
 }}
 >
 {doc._nameMatchScore >= 70
 ? 'Match'
 : doc._nameMatchScore >= 40
 ? 'Revisar'
 : 'Posible intruso'}
 </span>
 </div>
 ) : (
 <span
 style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
 >
 -
 </span>
 )}
 </td>
 )}
 <td>
 <EditablePencil
 value={item.fecha || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'fecha',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="160px"
 />
 </td>
 <td>
 <EditablePencil
 value={item.nombreDoctor?.trim() || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'nombreDoctor',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="190px"
 />
 </td>
 <td style={{ color: '#FF5C00', fontWeight: 'bold' }}>
 <EditablePencil
 value={item.monto ?? ''}
 displayValue={
 item.monto != null
 ? `$${Number(item.monto).toLocaleString('en-US', {
 minimumFractionDigits: 2,
 })}`
 : '--'
 }
 type="number"
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'monto',
 nextValue,
 )
 }
 inputWidth="130px"
 />
 </td>
 </tr>
 );
 })}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </section>
 </div>
 </div>
 );
}
