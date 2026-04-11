import { AlertTriangle, PlayCircle, XCircle, RotateCcw } from 'lucide-react';

export default function QAControlPanel({
 hasPendientes,
 qaStatus,
 filesUnavailable,
 data,
 fileCheck,
 isRunning,
 hasResults,
 onStart,
 onCancel,
 onReRun
}) {
 return (
 <section
 style={{
 background: 'var(--card-bg)',
 borderRadius: '16px',
 padding: '1.5rem',
 border: hasPendientes ? '2px solid #ff4d4d' : '2px solid rgba(0,230,118,0.3)',
 marginBottom: '1.5rem'
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
 <div>
 <h3 style={{ color: hasPendientes ? '#ff4d4d' : '#22C55E', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
 {hasPendientes && <AlertTriangle size={18} />}
 {hasPendientes
 ? `Hay ${qaStatus.pendientesCount} Pendiente(s) sin resolver`
 : filesUnavailable
 ? 'Algunos archivos podrian no estar en cache'
 : 'Listo para analisis QA'}
 </h3>
 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
 {hasPendientes
 ? 'Resuelve todos los pendientes en el Organizer.'
 : `${data?.totalMedical || fileCheck?.medicalCount || 0} Medical Records · ${data?.totalBills || 0} Bills (excluidos) · ${fileCheck?.available || 0} en cache`}
 </p>
 </div>
 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
 <button
 className="btn"
 disabled={hasPendientes || isRunning}
 onClick={onStart}
 style={{
 background: hasPendientes ? '#333' : 'linear-gradient(135deg, #22C55E 0%, var(--h-primary) 100%)',
 color: hasPendientes ? '#888' : 'black',
 fontWeight: 'bold',
 minWidth: '220px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '8px'
 }}
 >
 {isRunning ? (
 <>
 <span className="spinner" style={{ width: 16, height: 16, marginRight: 8, display: 'inline-block' }}></span>
 Analizando...
 </>
 ) : (
 <>
 <PlayCircle size={16} />
 Iniciar Analisis QA
 </>
 )}
 </button>
 {isRunning && (
 <button className="btn" style={{ background: '#ff0044', fontWeight: 'bold', animation: 'pulseBadge 1s infinite', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={onCancel}>
 <XCircle size={16} />
 Cancelar
 </button>
 )}
 {hasResults && !isRunning && (
 <button className="btn" style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)', color: 'black', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={onReRun}>
 <RotateCcw size={16} />
 Re-ejecutar
 </button>
 )}
 </div>
 </div>
 </section>
 );
}

