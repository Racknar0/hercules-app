"use client";

import React from 'react';
import { CheckCircle2, Eye, Trash2 } from 'lucide-react';
import { formatDateMMDDYYYY } from '@/helpers/dateFormat';

export default function PendingConflictsSection({
 pendientes,
 selectedLoteData,
 openDocumentLocal,
 handleAssignPendiente,
 handleDeletePendiente,
}) {
 if (pendientes.length === 0) return null;

 const hasSelectedLote = Boolean(selectedLoteData);

 return (
 <section className="conflict-manager">
 <h3>Pending documents for review ({pendientes.length})</h3>
 <p
 style={{
 marginBottom: '1rem',
 color: 'var(--text-muted)',
 fontSize: '0.85rem',
 }}
 >
 Pending items from the selected batch. Assign or delete them.
 </p>
 <div className="table-wrapper">
 <table style={{ tableLayout: 'fixed', width: '100%' }}>
 <colgroup>
 <col style={{ width: '18%' }} />
 <col style={{ width: '12%' }} />
 <col style={{ width: '8%' }} />
 <col style={{ width: '10%' }} />
 <col style={{ width: '24%' }} />
 <col style={{ width: '12%' }} />
 <col style={{ width: '16%' }} />
 </colgroup>
 <thead>
 <tr>
 <th>Document</th>
 <th>Client</th>
 <th>DOL</th>
 <th>Type</th>
 <th>Reason</th>
 <th>Batch</th>
 <th style={{ textAlign: 'center' }}>Actions</th>
 </tr>
 </thead>
 <tbody>
 {pendientes.map((doc, idx) =>{
 const hasQC =
 doc._qc &&
 doc._qc.discrepancies &&
 doc._qc.discrepancies.length >0;
 const diffFields = hasQC
 ? doc._qc.discrepancies.map((d) =>d.field)
 : [];
 const isDiff = (field) =>
 diffFields.some((f) =>f === field || f.startsWith(field));

 if (hasQC) {
 const r1 = doc._qc.run1;
 const r2 = doc._qc.run2;
 const diffStyle = {
 background: 'rgba(248,113,113,0.12)',
 color: '#fecaca',
 fontWeight: 'bold',
 };
 const normalStyle = {};

 return [
 <tr
 key={`${idx}-r1`}
 style={{
 borderBottom: 'none',
 background: 'rgba(0,200,83,0.04)',
 }}
 >
 <td
 rowSpan={2}
 style={{
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 verticalAlign: 'middle',
 }}
 title={doc.archivoOrigen}
 >
 <small
 className="doc-link"
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 >
 {doc.archivoOrigen}
 </small>
 <div style={{ marginTop: '4px' }}>
 <span
 style={{
 fontSize: '0.6rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'rgba(var(--h-primary-rgb),0.3)',
 color: '#cba6f7',
 }}
 >
 QC: {doc._qc.discrepancies.length} discrepancy(ies)
 </span>
 </div>
 </td>
 <td
 style={{
 ...(isDiff('nombreCliente') ? diffStyle : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 <span
 style={{
 color: '#00c853',
 fontSize: '0.6rem',
 fontWeight: 'bold',
 }}
 >
 R1{' '}
 </span>
 {r1.nombreCliente || '-'}
 </td>
 <td
 style={{
 ...(isDiff('dol') ? diffStyle : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 {formatDateMMDDYYYY(r1.dol) || '-'}
 </td>
 <td
 style={{
 ...(isDiff('tipoDocumento') ? diffStyle : normalStyle),
 }}
 >
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'rgba(0,200,83,0.2)',
 color: '#00c853',
 }}
 >
 {r1.tipoDocumento === 'Medical Record' ? 'Record' : 'Bill'}
 </span>
 </td>
 <td
 rowSpan={2}
 style={{ verticalAlign: 'middle' }}
 className="reason-cell"
 >
 {doc._qc.discrepancies.map((d, di) =>(
 <div
 key={di}
 className="reason-chip"
 >
 <strong className="reason-label">{d.label}:</strong>
 <br />
 <span style={{ color: '#00c853' }}>R1: {d.run1}</span>
 {' vs '}
 <span style={{ color: '#fb923c' }}>R2: {d.run2}</span>
 </div>
 ))}
 </td>
 <td
 rowSpan={2}
 style={{
 fontSize: '0.7rem',
 color: 'var(--text-muted)',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 verticalAlign: 'middle',
 }}
 title={doc._loteKey}
 >
 {doc._loteKey || '-'}
 </td>
 <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '4px',
 alignItems: 'stretch',
 }}
 >
 <button
 className="btn-sm btn-open"
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 style={{ fontSize: '0.7rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
 >
 <Eye size={12} />
 View Doc
 </button>
 <button
 className="btn-sm"
 onClick={() =>handleAssignPendiente(idx, 'run1')}
 disabled={!hasSelectedLote}
 style={{
 fontSize: '0.7rem',
 padding: '3px 6px',
 background: 'rgba(34,197,94,0.14)',
 color: '#86efac',
 border: '1px solid rgba(34,197,94,0.32)',
 borderRadius: '4px',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <CheckCircle2 size={12} />
 Approve R1
 </button>
 <button
 className="btn-sm"
 onClick={() =>handleAssignPendiente(idx, 'run2')}
 disabled={!hasSelectedLote}
 style={{
 fontSize: '0.7rem',
 padding: '3px 6px',
 background: 'rgba(34,197,94,0.14)',
 color: '#86efac',
 border: '1px solid rgba(34,197,94,0.32)',
 borderRadius: '4px',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <CheckCircle2 size={12} />
 Approve R2
 </button>
 <button
 className="btn-sm btn-reject"
 onClick={() =>handleDeletePendiente(idx)}
 style={{ fontSize: '0.7rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
 >
 <Trash2 size={12} />
 Delete
 </button>
 </div>
 </td>
 </tr>,
 <tr
 key={`${idx}-r2`}
 style={{
 borderTop: '1px dashed rgba(var(--h-primary-rgb),0.3)',
 background: 'rgba(var(--h-primary-rgb),0.04)',
 }}
 >
 <td
 style={{
 ...(isDiff('nombreCliente') ? diffStyle : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 <span
 style={{
 color: 'var(--h-primary)',
 fontSize: '0.6rem',
 fontWeight: 'bold',
 }}
 >
 R2{' '}
 </span>
 {r2.nombreCliente || '-'}
 </td>
 <td
 style={{
 ...(isDiff('dol') ? diffStyle : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 {formatDateMMDDYYYY(r2.dol) || '-'}
 </td>
 <td
 style={{
 ...(isDiff('tipoDocumento') ? diffStyle : normalStyle),
 }}
 >
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: 'rgba(var(--h-primary-rgb),0.2)',
 color: 'var(--h-primary)',
 }}
 >
 {r2.tipoDocumento === 'Medical Record' ? 'Record' : 'Bill'}
 </span>
 </td>
 </tr>,
 ];
 }

 return (
 <tr key={idx} className="conflict-row">
 <td
 style={{
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc.archivoOrigen}
 >
 <small
 className="doc-link"
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 >
 {doc.archivoOrigen}
 </small>
 </td>
 <td
 style={{
 color: '#ff9800',
 fontWeight: 'bold',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc.nombreCliente || '-'}
 >
 {doc.nombreCliente || '-'}
 </td>
 <td style={{ fontSize: '0.8rem' }}>{formatDateMMDDYYYY(doc.dol) || '-'}</td>
 <td>
 {(() =>{
 const tipo = (doc.tipoDocumento || '').toLowerCase();
 const isMedical = tipo.includes('medical');
 const isBill = tipo.includes('bill');
 return (
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background: isMedical
 ? 'rgba(var(--h-primary-rgb),0.3)'
 : isBill
 ? 'rgba(var(--h-primary-rgb),0.2)'
 : 'rgba(255,255,255,0.1)',
 color: isMedical
 ? '#cba6f7'
 : isBill
 ? 'var(--h-primary)'
 : '#888',
 }}
 >
 {isMedical ? 'Record' : isBill ? 'Bill' : '?'}
 </span>
 );
 })()}
 </td>
 <td
 className="reason-cell"
 >
 <div className="reason-chip" style={{ marginBottom: 0 }}>{doc._pendienteMotivo}</div>
 </td>
 <td
 style={{
 fontSize: '0.7rem',
 color: 'var(--text-muted)',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc._loteKey}
 >
 {doc._loteKey || '-'}
 </td>
 <td style={{ textAlign: 'center' }}>
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '4px',
 alignItems: 'stretch',
 }}
 >
 <button
 className="btn-sm btn-open"
 onClick={() =>openDocumentLocal(doc.archivoOrigen)}
 style={{ fontSize: '0.7rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
 >
 <Eye size={12} />
 View
 </button>
 <button
 className="btn-sm btn-approve"
 onClick={() =>handleAssignPendiente(idx)}
 disabled={!hasSelectedLote}
 title={
 hasSelectedLote
 ? `Assign to ${selectedLoteData.nombre}`
 : 'Select a batch'
 }
 style={{ fontSize: '0.7rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
 >
 <CheckCircle2 size={12} />
 Assign
 </button>
 <button
 className="btn-sm btn-reject"
 onClick={() =>handleDeletePendiente(idx)}
 style={{ fontSize: '0.7rem', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
 >
 <Trash2 size={12} />
 Delete
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </section>
 );
}

