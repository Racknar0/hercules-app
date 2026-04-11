import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function getQA(field) {
    if (!field) return { answer: '—', source: '' };
    if (typeof field === 'string') return { answer: field, source: '' };
    return { answer: field.answer || '—', source: field.source || '' };
}

const QA_FIELDS = [
    { key: 'edadCliente', label: '👤 Edad del Cliente', color: '#ff9800' },
    { key: 'diagnostico', label: '🩺 Diagnóstico', color: 'var(--accent)' },
    { key: 'limitacionesVidaDiaria', label: '⚠️ Limitaciones Diarias', color: '#ff4d4d' },
    { key: 'recomendacionesFuturas', label: '💊 Tratamientos/Recomendaciones', color: '#00d2ff' },
    { key: 'diasIncapacidad', label: '⏳ Dias Off / Incapacidades', color: 'yellow' },
    { key: 'hechos', label: '🚗 Hechos del Accidente', color: '#00e676' },
];

const STATUS_LABELS = {
    sampled: { text: '✅ Revisado', color: '#00e676' },
    not_sampled: { text: '⏭️ No muestreado', color: '#888' },
    excluded_bill: { text: '❌ Excluido (Bill)', color: '#ff4d4d' },
    unavailable: { text: '⚠️ Archivo no disponible', color: '#ff9800' },
};

const selectStyles = {
    control: (base) => ({ ...base, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'white', minWidth: '350px' }),
    menu: (base) => ({ ...base, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }),
    option: (base, state) => ({ ...base, background: state.isFocused ? 'rgba(138,43,226,0.3)' : 'transparent', color: 'white' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#888' }),
};

export default function MedicalExtractor() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qaStatus, setQaStatus] = useState({ hasData: false, count: 0, pendientesCount: 0 });
    const [isRunning, setIsRunning] = useState(false);
    const [qaLogs, setQaLogs] = useState([]);
    const [loteOptions, setLoteOptions] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);
    const [fileCheck, setFileCheck] = useState(null); // {available, unavailable, medicalCount}
    const logsEndRef = useRef(null);

    // Fetch lotes for selector
    const fetchLotes = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/profiles`);
            const json = await res.json();
            const opts = (json.profiles || []).map(p => ({
                value: JSON.stringify({ nombre: p.labelCliente, dol: p.dol }),
                label: `🧑‍⚕️ ${p.labelCliente} | 🚗 DOL: ${p.dol} (${p.documentCount} docs${p.pendientesCount > 0 ? ` · ⚠️${p.pendientesCount} pend.` : ''})`
            }));
            setLoteOptions(opts);
        } catch(e) {}
    };

    const fetchQAData = async (nombre, dol) => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/qa-data`;
            if (nombre && dol) url += `?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`;
            let statusUrl = `${API_BASE}/api/qa-status`;
            if (nombre && dol) statusUrl += `?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`;
            const [dataRes, statusRes] = await Promise.all([
                fetch(url),
                fetch(statusUrl)
            ]);
            const json = await dataRes.json();
            const status = await statusRes.json();
            if (json.success) setData(json);
            setQaStatus(status);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Check if files still exist in temp_docs
    const checkFiles = async (nombre, dol) => {
        try {
            const res = await fetch(`${API_BASE}/api/check-files?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`);
            const json = await res.json();
            setFileCheck(json);
        } catch(e) {
            setFileCheck({ available: 0, unavailable: 0, medicalCount: 0, error: true });
        }
    };

    useEffect(() => { fetchLotes(); fetchQAData(); }, []);
    useEffect(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [qaLogs]);

    // When lote changes, check files and reload QA data
    useEffect(() => {
        if (selectedLote) {
            const parsed = JSON.parse(selectedLote.value);
            checkFiles(parsed.nombre, parsed.dol);
            fetchQAData(parsed.nombre, parsed.dol);
        } else {
            setFileCheck(null);
            fetchQAData();
        }
    }, [selectedLote]);

    const openDoc = (filename) => {
        window.open(`${API_BASE}/api/documents/${filename}`, '_blank');
    };

    // ===== INICIAR CORRIDA QA =====
    const startQARun = async () => {
        if (!selectedLote) return alert('Selecciona un batch/lote primero.');
        if (qaStatus.pendientesCount > 0) {
            return alert(`⛔ Hay ${qaStatus.pendientesCount} documento(s) pendientes. Resuelve todos en el Organizer primero.`);
        }
        if (fileCheck && fileCheck.available === 0 && fileCheck.totalMedical > 0) {
            if (!window.confirm('⚠️ Los archivos de este batch no están en caché (expirados). La IA omitirá los que no encuentre. ¿Continuar?')) return;
        }

        const parsed = JSON.parse(selectedLote.value);
        setIsRunning(true);
        setQaLogs(['[QA] Iniciando corrida de análisis QA...']);

        try {
            const response = await fetch(`${API_BASE}/api/run-qa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiModel: 'gemini-3-flash-preview', nombre: parsed.nombre, dol: parsed.dol })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.type === 'progress') {
                            setQaLogs(prev => [...prev, `[QA] ${parsed.msg}`]);
                        } else if (parsed.type === 'result') {
                            if (parsed.data.error) {
                                setQaLogs(prev => [...prev, `[ERROR] ${parsed.data.error}`]);
                            } else {
                                setQaLogs(prev => [...prev, `[DONE] ✅ ${parsed.data.processed} procesados, ${parsed.data.failed} fallidos`]);
                            }
                        }
                    } catch (e) {}
                }
            }
        } catch (e) {
            setQaLogs(prev => [...prev, `[ERROR] Conexión fallida: ${e.message}`]);
        } finally {
            setIsRunning(false);
            const p = JSON.parse(selectedLote.value);
            fetchQAData(p.nombre, p.dol);
        }
    };

    const cancelQA = async () => {
        try {
            await fetch(`${API_BASE}/api/cancel`, { method: 'POST' });
            setQaLogs(prev => [...prev, '[SYS] ⛔ Cancelación enviada...']);
        } catch(e) {}
    };

    const reRunQA = async () => {
        if (!selectedLote) return alert('Selecciona un batch primero.');
        if (!window.confirm('¿Re-ejecutar? Esto borrará los resultados QA actuales de este lote y correrá nuevamente.')) return;
        const parsed = JSON.parse(selectedLote.value);
        try {
            await fetch(`${API_BASE}/api/clear-qa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: parsed.nombre, dol: parsed.dol })
            });
            setQaLogs([]);
            await fetchQAData(parsed.nombre, parsed.dol);
            startQARun();
        } catch(e) { alert('Error: ' + e.message); }
    };

    if (loading && !selectedLote) {
        return (
            <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
            </div>
        );
    }

    const hasPendientes = qaStatus.pendientesCount > 0;
    const hasResults = data && data.sampledCount > 0 && data.providerNames && data.providerNames.length > 0 &&
        Object.values(data.groupedByProvider || {}).some(recs => recs.some(r => r.hasQA));
    const filesUnavailable = fileCheck && fileCheck.available === 0 && fileCheck.totalMedical > 0;

    return (
        <div className="app-container" style={{ marginTop: '1rem' }}>
            <header>
                <h1 style={{ color: '#00d2ff' }}>Med Extractor QA</h1>
                <p>Corrida independiente sobre Medical Records aprobados. Análisis forense con trazabilidad de fuentes.</p>
            </header>

            {/* ===== SELECTOR DE BATCH ===== */}
            <section style={{
                background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem',
                border: '2px solid rgba(0,210,255,0.3)', marginBottom: '1.5rem'
            }}>
                <h3 style={{ color: '#00d2ff', marginBottom: '0.8rem' }}>📦 Seleccionar Batch para Análisis</h3>
                <Select
                    isClearable
                    options={loteOptions}
                    value={selectedLote}
                    onChange={setSelectedLote}
                    placeholder="🔍 Seleccionar Lote (Cliente + DOL)..."
                    styles={selectStyles}
                    noOptionsMessage={() => 'No hay lotes disponibles. Procesa documentos en el Organizer primero.'}
                />

                {/* File availability status */}
                {fileCheck && selectedLote && (
                    <div style={{ marginTop: '0.8rem', padding: '10px', borderRadius: '8px', background: filesUnavailable ? 'rgba(255,0,0,0.1)' : 'rgba(0,230,118,0.05)', border: filesUnavailable ? '1px solid #ff4d4d' : '1px solid rgba(0,230,118,0.2)' }}>
                        {filesUnavailable ? (
                            <p style={{ color: '#ff4d4d', margin: 0, fontSize: '0.85rem' }}>
                                ⚠️ <strong>Los documentos de este batch ya no están disponibles.</strong> Los archivos temporales se eliminan después de 72 horas. Necesitas volver a correr el Medical Organizer para este caso.
                            </p>
                        ) : (
                            <p style={{ color: '#00e676', margin: 0, fontSize: '0.85rem' }}>
                                ✅ {fileCheck.available} archivo(s) disponibles · {fileCheck.medicalCount} Medical Record(s) · {fileCheck.unavailable > 0 ? `⚠️ ${fileCheck.unavailable} no encontrado(s)` : 'Todos los archivos en caché'}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* ===== NO BATCH SELECTED ===== */}
            {!selectedLote && (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h3 style={{ color: 'var(--text-muted)' }}>Selecciona un Batch arriba</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Elige el lote de documentos sobre el cual ejecutar el análisis QA.
                    </p>
                </div>
            )}

            {/* ===== PANEL DE CONTROL (solo si hay batch seleccionado) ===== */}
            {selectedLote && (
                <>
                    <section style={{
                        background: 'var(--card-bg)', borderRadius: '16px', padding: '1.5rem',
                        border: hasPendientes ? '2px solid #ff4d4d' : '2px solid rgba(0,230,118,0.3)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ color: hasPendientes ? '#ff4d4d' : '#00e676', marginBottom: '0.3rem' }}>
                                    {hasPendientes ? `⛔ ${qaStatus.pendientesCount} Pendiente(s) sin resolver`
                                        : filesUnavailable ? '⚠️ Algunos archivos podrían no estar en caché'
                                        : '✅ Listo para análisis QA'}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                                    {hasPendientes ? 'Resuelve todos los pendientes en el Organizer.'
                                        : `${data?.totalMedical || fileCheck?.medicalCount || 0} Medical Records · ${data?.totalBills || 0} Bills (excluidos) · ${fileCheck?.available || 0} en caché`}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn"
                                    disabled={hasPendientes || isRunning}
                                    onClick={startQARun}
                                    style={{
                                        background: hasPendientes ? '#333' : 'linear-gradient(135deg, #00e676 0%, #00d2ff 100%)',
                                        color: hasPendientes ? '#888' : 'black',
                                        fontWeight: 'bold', minWidth: '220px'
                                    }}
                                >
                                    {isRunning ? (<><span className="spinner" style={{ width: 16, height: 16, marginRight: 8, display: 'inline-block' }}></span> Analizando...</>) : '🧠 Iniciar Análisis QA'}
                                </button>
                                {isRunning && (
                                    <button className="btn" style={{ background: '#ff0044', fontWeight: 'bold', animation: 'pulseBadge 1s infinite' }} onClick={cancelQA}>
                                        ✋ Cancelar
                                    </button>
                                )}
                                {hasResults && !isRunning && (
                                    <button className="btn" style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)', color: 'black', fontWeight: 'bold' }} onClick={reRunQA}>
                                        🔄 Re-ejecutar
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* TERMINAL */}
                    {qaLogs.length > 0 && (
                        <section className="log-terminal" style={{ marginBottom: '1.5rem', maxHeight: '250px', overflow: 'auto' }}>
                            {qaLogs.map((log, i) => (
                                <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: log.includes('ERROR') ? '#ff4d4d' : log.includes('✅') ? '#00e676' : 'var(--text-main)' }}>
                                    {log}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </section>
                    )}

                    {/* SIN RESULTADOS */}
                    {!hasResults && !isRunning && !filesUnavailable && (
                        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
                            <h3 style={{ color: 'var(--text-muted)' }}>Sin resultados QA para este batch</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Presiona <strong style={{ color: '#00e676' }}>"Iniciar Análisis QA"</strong> para comenzar.
                            </p>
                        </div>
                    )}

                    {/* ===== RESULTADOS QA ===== */}
                    {hasResults && (
                        <>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {[
                                    { val: data.sampledCount, label: 'Records Analizados', color: '#00e676', bg: 'rgba(0,230,118,0.1)', border: '#00e676' },
                                    { val: data.totalMedical, label: 'Total Medical Records', color: 'var(--accent)', bg: 'rgba(138,43,226,0.1)', border: 'rgba(138,43,226,0.4)' },
                                    { val: data.totalBills, label: 'Bills (Excluidos)', color: '#ff4d4d', bg: 'rgba(255,0,0,0.05)', border: 'rgba(255,0,0,0.3)' },
                                    { val: data.providerNames.length, label: 'Providers', color: '#00d2ff', bg: 'rgba(0,210,255,0.1)', border: 'rgba(0,210,255,0.3)' },
                                ].map((s, i) => (
                                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px', padding: '12px 20px', flex: 1, minWidth: '140px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* TABLA DE INSUMOS */}
                            <section style={{ marginBottom: '2rem' }}>
                                <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.2rem' }}>📋 Tabla de Insumos Validados</h2>
                                <div className="table-wrapper">
                                    <table style={{ tableLayout: 'fixed', width: '100%' }}>
                                        <colgroup>
                                            <col style={{ width: '5%' }} /><col style={{ width: '30%' }} /><col style={{ width: '15%' }} /><col style={{ width: '25%' }} /><col style={{ width: '25%' }} />
                                        </colgroup>
                                        <thead><tr><th>#</th><th>Documento</th><th>Tipo</th><th>Provider</th><th>Estado QA</th></tr></thead>
                                        <tbody>
                                            {data.inputsTable.map((row, i) => {
                                                const st = STATUS_LABELS[row.status] || STATUS_LABELS.not_sampled;
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                                                        <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.archivo}>
                                                            <small style={{ cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline' }} onClick={() => openDoc(row.archivo)}>{row.archivo}</small>
                                                        </td>
                                                        <td><span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: row.isMedical ? 'rgba(138,43,226,0.3)' : 'rgba(255,0,0,0.2)', color: row.isMedical ? '#ccc' : '#ff6666' }}>{row.tipoDocumento}</span></td>
                                                        <td style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.provider}</td>
                                                        <td><span style={{ fontSize: '0.8rem', color: st.color, fontWeight: 'bold' }}>{st.text}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* POR PROVIDER */}
                            <section>
                                <h2 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1.2rem' }}>🏥 Resultados por Medical Provider</h2>
                                {data.providerNames.map(prov => {
                                    const records = data.groupedByProvider[prov].filter(r => r.hasQA);
                                    if (!records.length) return null;
                                    return (
                                        <div key={prov} style={{ marginBottom: '2rem' }}>
                                            <h3 style={{ color: '#00d2ff', marginBottom: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0,210,255,0.3)' }}>
                                                🏢 {prov} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '10px' }}>({records.length})</span>
                                            </h3>
                                            <div className="qa-grid">
                                                {records.map((rec, rIdx) => (
                                                    <div key={rIdx} className="qa-card">
                                                        <div className="qa-card-header">
                                                            <h3 style={{ cursor: 'pointer' }} onClick={() => openDoc(rec.archivo)}>📄 {rec.archivo}</h3>
                                                            <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '0.65rem', background: 'rgba(0,230,118,0.2)', padding: '2px 8px', borderRadius: '4px', color: '#00e676' }}>Muestra #{rec.sampleOrder}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {QA_FIELDS.map(f => {
                                                                const qa = getQA(rec.qa[f.key]);
                                                                return (
                                                                    <div key={f.key} className="qa-item" style={{ marginBottom: '0.8rem' }}>
                                                                        <span className="qa-label">{f.label}</span>
                                                                        <span className="qa-value" style={{ color: f.color }}>{qa.answer}</span>
                                                                        {qa.source && <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>📍 {qa.source}</div>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>

                            {/* RESUMEN EJECUTIVO */}
                            <section style={{ marginTop: '2rem', background: 'rgba(0,210,255,0.03)', border: '2px solid rgba(0,210,255,0.3)', borderRadius: '16px', padding: '2rem' }}>
                                <h2 style={{ color: '#00d2ff', marginBottom: '1.5rem' }}>📊 Resumen Ejecutivo</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                    Basado en {data.sampledCount} Medical Record(s) de {data.providerNames.length} provider(s).
                                </p>
                                {QA_FIELDS.map(f => {
                                    const entries = [];
                                    Object.values(data.groupedByProvider).forEach(recs => {
                                        recs.forEach(rec => {
                                            if (!rec.qa) return;
                                            const qa = getQA(rec.qa[f.key]);
                                            if (qa.answer && qa.answer !== '—' && !qa.answer.toLowerCase().includes('not specified') && !qa.answer.toLowerCase().includes('not discussed')) {
                                                entries.push({ answer: qa.answer, source: qa.source, archivo: rec.archivo });
                                            }
                                        });
                                    });
                                    if (!entries.length) return null;
                                    return (
                                        <div key={f.key} style={{ marginBottom: '1.5rem' }}>
                                            <h4 style={{ color: f.color, marginBottom: '0.5rem' }}>{f.label}</h4>
                                            {entries.map((e, i) => (
                                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', borderLeft: `3px solid ${f.color}` }}>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{e.answer}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '3px' }}>
                                                        📄 <span style={{ cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline' }} onClick={() => openDoc(e.archivo)}>{e.archivo}</span>
                                                        {e.source && <> — 📍 {e.source}</>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </section>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
