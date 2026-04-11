"use client";

import { formatDateMMDDYYYY } from '@/helpers/dateFormat';
import { Trash2, RotateCcw } from 'lucide-react';

export default function TrashSection({ trashData, handleRestoreRecord }) {
 if (trashData.length === 0) return null;

 return (
 <section
 style={{
 maxWidth: '1200px',
 margin: '2rem auto',
 border: '2px dashed #ff3333',
 padding: '1rem',
 borderRadius: '8px',
 background: 'rgba(255,0,0,0.05)',
 }}
 >
 <h2 style={{ color: '#ff3333', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
 <Trash2 size={20} />
 Recycle Bin
 </h2>
 <ul style={{ listStyle: 'none', padding: 0 }}>
 {trashData.map((t, idx) =>(
 <li
 key={idx}
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 background: 'rgba(0,0,0,0.5)',
 padding: '10px',
 marginBottom: '8px',
 borderRadius: '4px',
 }}
 >
 <div>
 <strong style={{ color: 'white' }}>{t.archivoOrigen}</strong>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
 Deleted: {formatDateMMDDYYYY(t.deletedAt)}
 {t.doc._fromLote && ` | Batch: ${t.doc._fromLote}`}
 </div>
 </div>
 <button
 className="btn-sm"
 style={{ background: 'var(--h-primary)', color: 'black', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
 onClick={() =>handleRestoreRecord(idx)}
 >
 <RotateCcw size={14} />
 Restore
 </button>
 </li>
 ))}
 </ul>
 </section>
 );
}

