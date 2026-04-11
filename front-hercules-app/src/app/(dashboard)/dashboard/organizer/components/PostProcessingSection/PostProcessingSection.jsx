"use client";

import { Sparkles, FileSpreadsheet, Archive } from 'lucide-react';

export default function PostProcessingSection({
 selectedLote,
 loteDocuments,
 downloadFilteredExcel,
 downloadNormalizedPack,
}) {
 if (!selectedLote || loteDocuments.length === 0) return null;

 return (
 <section
 style={{
 background: 'linear-gradient(135deg, rgba(var(--h-primary-rgb), 0.08), rgba(59, 130, 246, 0.08))',
 border: '1px solid rgba(var(--h-primary-rgb), 0.3)',
 borderRadius: '12px',
 padding: '1.5rem',
 marginTop: '1.5rem',
 }}
 >
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.6rem',
 marginBottom: '1rem',
 }}
 >
 <Sparkles size={22} color="var(--h-primary)" />
 <span
 style={{
 color: 'var(--h-primary)',
 fontWeight: '700',
 fontSize: '1.15rem',
 letterSpacing: '1px',
 }}
 >
 PROCESSING
 </span>
 <span
 style={{
 color: 'var(--text-muted)',
 fontSize: '0.85rem',
 marginLeft: 'auto',
 }}
 >
 {loteDocuments.length} approved docs
 </span>
 </div>
 <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
 <button
 className="btn"
 style={{
 background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
 padding: '10px 20px',
 fontSize: '0.9rem',
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 }}
 onClick={downloadFilteredExcel}
 >
 <FileSpreadsheet size={16} />
 Download File (Excel)
 </button>
 <button
 className="btn"
 style={{
 background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
 padding: '10px 20px',
 fontSize: '0.9rem',
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 }}
 onClick={downloadNormalizedPack}
 >
 <Archive size={16} />
 Download Normalized Pack
 </button>
 </div>
 <div
 style={{
 marginTop: '0.8rem',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 lineHeight: '1.5',
 }}
 >
 <strong>Normalized Pack:</strong>Renames files to{' '}
 <code style={{ color: '#a78bfa' }}>[MM-DD-AAAA] - [Provider] - [$Amount].pdf</code>,
 converts images to PDF, and packages everything into a ZIP.
 </div>
 </section>
 );
}

