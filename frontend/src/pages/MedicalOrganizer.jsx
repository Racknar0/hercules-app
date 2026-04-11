import { useState, useRef, useEffect } from 'react';
import Select from 'react-select';

// API Base: en dev usa .env (VITE_API_URL=http://localhost:3000), en prod usa mismo origin via nginx proxy
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: state.isFocused ? '#00d2ff' : 'rgba(255, 255, 255, 0.2)',
        boxShadow: state.isFocused ? '0 0 0 1px #00d2ff' : 'none',
        color: 'white',
        borderRadius: '12px',
        padding: '4px',
    }),
    menu: (base) => ({
        ...base,
        background: '#1a1d2d',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    }),
    option: (base, state) => ({
        ...base,
        background: state.isFocused ? 'rgba(138, 43, 226, 0.3)' : 'transparent',
        color: 'white',
        cursor: 'pointer',
    }),
    multiValue: (base) => ({
        ...base,
        background: 'rgba(138, 43, 226, 0.6)',
        borderRadius: '6px',
    }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    placeholder: (base) => ({ ...base, color: '#8b8d99' }),
};

export default function MedicalOrganizer() {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Terminal
    const [streamLogs, setStreamLogs] = useState([]);
    const terminalEndRef = useRef(null);

    // IA Thinking (razonamiento en tiempo real)
    const [thinkingData, setThinkingData] = useState(null);
    const [thinkingHistory, setThinkingHistory] = useState([]);
    const [thinkingOpen, setThinkingOpen] = useState(true);

    // Lotes (para el select)
    const [loteOptions, setLoteOptions] = useState([]);
    const [selectedLote, setSelectedLote] = useState(null);

    // Documentos del lote seleccionado
    const [loteDocuments, setLoteDocuments] = useState([]);

    // Pendientes (alertas)
    const [pendientes, setPendientes] = useState([]);

    // Papelera
    const [trashData, setTrashData] = useState([]);

    // Campos del formulario de lote
    const [officialClient, setOfficialClient] = useState('');
    const [officialDol, setOfficialDol] = useState('');
    const [aiModel, setAiModel] = useState('gemini-3-flash-preview');
    const [enableQC, setEnableQC] = useState(false);

    // Timer de proceso
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef(null);

    const fileInputRef = useRef(null);

    // Timer: iniciar/parar cuando isUploading cambia
    useEffect(() => {
        if (isUploading) {
            setElapsedSeconds(0);
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isUploading]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // ===========================
    // FETCH DATA
    // ===========================
    const fetchProfiles = () => {
        fetch(`${API_BASE}/api/profiles`)
            .then(res => res.json())
            .then(data => {
                if (data.profiles) {
                    const opts = data.profiles.map(p => ({
                        value: JSON.stringify({ nombre: p.labelCliente, dol: p.dol }),
                        label: `🧑‍⚕️ ${p.labelCliente} | 🚗 DOL: ${p.dol} (${p.documentCount} docs${p.pendientesCount > 0 ? ` · ⚠️${p.pendientesCount} pend.` : ''})`,
                    }));
                    setLoteOptions(opts);
                }
            })
            .catch(console.error);
    };

    const fetchPendientes = (nombre, dol) => {
        if (!nombre || !dol) {
            setPendientes([]);
            return;
        }
        fetch(`${API_BASE}/api/pendientes?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setPendientes(data.data);
            })
            .catch(console.error);
    };

    const fetchTrash = () => {
        fetch(`${API_BASE}/api/deleted-records`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setTrashData(data.list);
            })
            .catch(console.error);
    };

    const fetchLoteDocuments = (nombre, dol) => {
        fetch(`${API_BASE}/api/lote-documents?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setLoteDocuments(data.data);
            })
            .catch(console.error);
    };

    const fetchAll = () => {
        fetchProfiles();
        fetchTrash();
        if (selectedLote) {
            const parsed = JSON.parse(selectedLote.value);
            fetchPendientes(parsed.nombre, parsed.dol);
            fetchLoteDocuments(parsed.nombre, parsed.dol);
        } else {
            setPendientes([]);
        }
    };

    useEffect(() => {
        fetchProfiles();
        fetchTrash();
    }, []);

    useEffect(() => {
        if (selectedLote) {
            const parsed = JSON.parse(selectedLote.value);
            fetchLoteDocuments(parsed.nombre, parsed.dol);
            fetchPendientes(parsed.nombre, parsed.dol);
            // Cargar historial de razonamiento IA persistido
            fetch(`${API_BASE}/api/thinking?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data.length > 0) {
                        setThinkingHistory(data.data);
                        setThinkingData(data.data[data.data.length - 1]);
                    } else {
                        setThinkingHistory([]);
                        setThinkingData(null);
                    }
                })
                .catch(() => {});
        } else {
            setLoteDocuments([]);
            setPendientes([]);
            setThinkingHistory([]);
            setThinkingData(null);
        }
    }, [selectedLote]);

    // ===========================
    // DRAG & DROP
    // ===========================
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

    const traverseFileTree = (item, path = '') => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file) => resolve([file]));
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                dirReader.readEntries(async (entries) => {
                    let folderFiles = [];
                    for (let i = 0; i < entries.length; i++) {
                        folderFiles = folderFiles.concat(await traverseFileTree(entries[i], path + item.name + '/'));
                    }
                    resolve(folderFiles);
                });
            }
        });
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        let newFiles = [];
        if (e.dataTransfer.items) {
            const items = Object.values(e.dataTransfer.items);
            for (const item of items) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    const filesExtracted = await traverseFileTree(entry);
                    newFiles = newFiles.concat(filesExtracted);
                }
            }
        } else if (e.dataTransfer.files) {
            newFiles = Array.from(e.dataTransfer.files);
        }
        if (newFiles.length > 0) setFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    // Autoscroll terminal (solo dentro del contenedor, no la página)
    useEffect(() => {
        if (terminalEndRef.current) {
            const container = terminalEndRef.current.parentElement;
            if (container) container.scrollTop = container.scrollHeight;
        }
    }, [streamLogs]);

    // ===========================
    // UPLOAD IA
    // ===========================
    const evalFilesForDuplicates = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setStreamLogs([]);

        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('officialClientName', officialClient);
        formData.append('officialDol', officialDol);
        formData.append('aiModel', aiModel);
        formData.append('enableQC', enableQC);

        try {
            const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n');
                    buffer = parts.pop();
                    for (const p of parts) {
                        if (!p.trim()) continue;
                        try {
                            const event = JSON.parse(p);
                            if (event.type === 'progress') {
                                setStreamLogs(prev => [...prev, event.msg]);
                            } else if (event.type === 'thinking') {
                                setThinkingData(event);
                                setThinkingHistory(prev => [...prev, event]);
                            } else if (event.type === 'result') {
                                if (event.data.error) {
                                    alert('Error: ' + event.data.error);
                                } else {
                                    setStreamLogs(prev => [...prev, `✅ Lote procesado: ${event.data.savedCount} guardados, ${event.data.pendientesCount} en alertas.`]);
                                    fetchAll();
                                }
                            }
                        } catch (ex) { /* skip */ }
                    }
                }
                if (done) break;
            }
        } catch (error) {
            alert('Error en Streaming: ' + error.message);
        } finally {
            setIsUploading(false);
            setFiles([]);
        }
    };

    // ===========================
    // CANCELAR PROCESO
    // ===========================
    const cancelProcess = async () => {
        try {
            await fetch(`${API_BASE}/api/cancel`, { method: 'POST' });
            setStreamLogs(prev => [...prev, '[SYS] ⛔ Cancelación enviada...']);
        } catch(e) {}
    };

    // ===========================
    // NUEVO PROCESO (reset batch)
    // ===========================
    const handleNewProcess = () => {
        if (!window.confirm('¿Iniciar nuevo proceso? Esto limpiará los archivos en cola y los logs. La data ya guardada NO se pierde.')) return;
        setFiles([]);
        setStreamLogs([]);
        setOfficialClient('');
        setOfficialDol('');
    };

    // ===========================
    // MOCK DEV
    // ===========================
    const handleInjectDummy = async () => {
        let mockName = officialClient;
        let mockDol = officialDol;
        if (!mockName) {
            mockName = prompt('Nombre de cliente para el Mock:', 'JUAN JUAREZ');
            if (!mockName) return;
        }
        if (!mockDol) {
            mockDol = prompt('Date of Loss para el Mock (MM/DD/YYYY):', '05/06/2024');
            if (!mockDol) return;
        }
        setStreamLogs(['[SYS] Inyectando Dummy...']);
        try {
            const res = await fetch(`${API_BASE}/api/upload-dummy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ officialClientName: mockName, officialDol: mockDol })
            });
            const data = await res.json();
            if (data.success) {
                setStreamLogs(prev => [...prev, `✅ Mock: ${data.savedCount} guardados, ${data.pendientesCount} alertas.`]);
                fetchAll();
            }
        } catch(e) { setStreamLogs(prev => [...prev, '[SYS] Error dummy.']); }
    };

    // ===========================
    // ACCIONES PENDIENTES
    // ===========================
    const handleAssignPendiente = async (idx, selectedRun) => {
        if (!selectedLote) {
            return alert('Selecciona un lote del dropdown para asignar este documento.');
        }
        const parsed = JSON.parse(selectedLote.value);
        try {
            const res = await fetch(`${API_BASE}/api/assign-pendiente`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pendienteIndex: idx, nombre: parsed.nombre, dol: parsed.dol, selectedRun })
            });
            const data = await res.json();
            if (data.success) fetchAll();
        } catch(e) { alert("Fallo asignando"); }
    };

    const handleDeletePendiente = async (idx) => {
        if (!selectedLote) return alert('Selecciona un lote primero.');
        if (!window.confirm('¿Eliminar este documento permanentemente?')) return;
        const parsed = JSON.parse(selectedLote.value);
        try {
            const res = await fetch(`${API_BASE}/api/pendiente?index=${idx}&nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchAll();
        } catch(e) { alert("Fallo eliminando"); }
    };

    // ===========================
    // ACCIONES DOCUMENTOS DE LOTE
    // ===========================
    const handleDeleteRecord = async (archivoOrigen) => {
        if (!selectedLote) return;
        if (!window.confirm(`¿Eliminar ${archivoOrigen} del lote?`)) return;
        const parsed = JSON.parse(selectedLote.value);
        try {
            const res = await fetch(`${API_BASE}/api/records?archivoOrigen=${encodeURIComponent(archivoOrigen)}&nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchAll();
        } catch(e) { alert("Fallo eliminando"); }
    };

    // ===========================
    // RESCAN DOCUMENTO CON IA
    // ===========================
    const [rescanningFile, setRescanningFile] = useState(null);
    const [pageRescanTarget, setPageRescanTarget] = useState(null); // archivoOrigen del doc con input abierto
    const [pageRescanInput, setPageRescanInput] = useState('');

    const handleRescanDoc = async (archivoOrigen, pages) => {
        if (!selectedLote) return;
        if (!pages && !window.confirm(`¿Re-escanear "${archivoOrigen}" con IA? Esto re-evaluará la extracción.`)) return;
        const parsed = JSON.parse(selectedLote.value);
        setRescanningFile(archivoOrigen);
        try {
            const body = { archivoOrigen, nombre: parsed.nombre, dol: parsed.dol };
            if (pages) body.pages = pages;
            const res = await fetch(`${API_BASE}/api/rescan-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Re-scan completado para ${archivoOrigen}${pages ? ` (Págs: ${pages})` : ''}. Data actualizada.`);
                fetchAll();
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch(e) {
            alert('Error en re-scan: ' + e.message);
        } finally {
            setRescanningFile(null);
            setPageRescanTarget(null);
            setPageRescanInput('');
        }
    };

    // ===========================
    // RESTAURAR PAPELERA
    // ===========================
    const handleRestoreRecord = async (trashIndex) => {
        const entry = trashData[trashIndex];
        if (!entry) return;
        const targetNombre = entry.doc._fromLote || (selectedLote ? JSON.parse(selectedLote.value).nombre : null);
        const targetDol = entry.doc._fromDol || (selectedLote ? JSON.parse(selectedLote.value).dol : null);
        if (!targetNombre || !targetDol) return alert('Selecciona un lote destino.');
        try {
            const res = await fetch(`${API_BASE}/api/restore-record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trashIndex, nombre: targetNombre, dol: targetDol })
            });
            const data = await res.json();
            if (data.success) fetchAll();
        } catch(e) { alert("Fallo restaurando"); }
    };

    // ===========================
    // PDF VIEWER
    // ===========================
    const openDocumentLocal = (filename) => {
        window.open(`${API_BASE}/api/documents/${filename}`, '_blank');
    };

    // ===========================
    // DOWNLOAD EXCEL
    // ===========================
    const downloadFilteredExcel = () => {
        if (selectedLote && pendientes.length > 0) {
            return alert(`⛔ No puedes descargar el Excel mientras haya ${pendientes.length} documento(s) pendientes de revisión en este lote. Asígnalos o elimínalos primero.`);
        }
        let url = `${API_BASE}/api/download`;
        if (selectedLote) {
            const parsed = JSON.parse(selectedLote.value);
            url += `?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`;
        }
        window.open(url, '_blank');
    };

    // ===========================
    // RESET DB
    // ===========================
    const handleResetDB = async () => {
        if (!window.confirm('¿BORRAR toda la base de datos permanentemente?')) return;
        try {
            await fetch(`${API_BASE}/api/reset-db`, { method: 'DELETE' });
            setLoteDocuments([]);
            setLoteOptions([]);
            setSelectedLote(null);
            setPendientes([]);
            setTrashData([]);
        } catch(e) { console.error(e); }
    };

    const handleDeleteLote = async () => {
        if (!selectedLote) return alert('Selecciona un caso primero.');
        const parsed = JSON.parse(selectedLote.value);
        if (!window.confirm(`¿ELIMINAR el caso completo?\n\n🧑‍⚕️ ${parsed.nombre}\n🚗 DOL: ${parsed.dol}\n\nEsto borrará TODOS los documentos, pendientes y papelera de este caso.`)) return;
        try {
            const url = `${API_BASE}/api/lote?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`;
            const res = await fetch(url, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Caso eliminado: ${data.docsRemoved} docs, ${data.pendRemoved} pendientes, ${data.trashRemoved} papelera, ${data.tempFilesRemoved || 0} archivos temp`);
                setSelectedLote(null);
                setLoteDocuments([]);
                setPendientes([]);
                fetchProfiles();
                fetchTrash();
            } else {
                alert('Error: ' + (data.error || 'Desconocido'));
            }
        } catch(e) { alert('Error eliminando caso: ' + e.message); }
    };

    // ===========================
    // AGRUPAR DOCS DEL LOTE POR TIPO
    // ===========================
    const groupedByType = loteDocuments.reduce((acc, doc) => {
        const isMed = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical');
        if (isMed) acc.medical.push(doc);
        else acc.bills.push(doc);
        return acc;
    }, { medical: [], bills: [] });

    // ===========================
    // RENDER
    // ===========================
    return (
        <div className="app-container">
            <header>
                <h1>Med Organizer AI</h1>
                <p>Administrador Histórico Maestro con Escudo Anti-Duplicados y Visor Local.</p>
            </header>

            <section className="actions-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="select-container">
                    <Select
                        isClearable
                        options={loteOptions}
                        value={selectedLote}
                        onChange={setSelectedLote}
                        placeholder="🔍 Seleccionar Lote (Cliente + DOL)..."
                        styles={customSelectStyles}
                        noOptionsMessage={() => 'No hay lotes en el Master DB'}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-download" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={downloadFilteredExcel}>
                        📥 Excel {selectedLote ? 'Lote' : 'General'}
                    </button>
                    <button
                        className="btn"
                        style={{ background: 'linear-gradient(135deg, #ff9800, #ff5722)', padding: '8px 14px', fontSize: '0.85rem' }}
                        onClick={handleNewProcess}
                        title="Limpiar batch actual y empezar nuevo"
                    >
                        🔄 Nuevo Proceso
                    </button>
                    <button
                        className="btn btn-download"
                        style={{ background: '#00d2ff', color: 'black', padding: '8px 14px', fontSize: '0.85rem' }}
                        onClick={handleInjectDummy}
                        title="Simula inyección de data sin IA"
                    >
                        🧪 Mock
                    </button>
                    {selectedLote && (
                        <button
                            className="btn btn-discard"
                            style={{ background: 'rgba(255, 100, 0, 0.8)', padding: '8px 14px', fontSize: '0.85rem' }}
                            onClick={handleDeleteLote}
                            title="Elimina el caso seleccionado"
                        >
                            🔥 Eliminar Caso
                        </button>
                    )}
                    <button
                        className="btn btn-discard"
                        style={{ background: 'rgba(255, 0, 0, 0.7)', padding: '8px 14px', fontSize: '0.85rem' }}
                        onClick={handleResetDB}
                        title="Borra TODA la DB"
                    >
                        🗑️ Reset DB
                    </button>
                    {isUploading && (
                        <button
                            className="btn"
                            style={{ background: '#ff0044', padding: '8px 14px', fontSize: '0.85rem', animation: 'pulseBadge 1s infinite' }}
                            onClick={cancelProcess}
                        >
                            ✋ Cancelar
                        </button>
                    )}
                </div>
            </section>

            {/* ===== FORMULARIO DE LOTE & DROPZONE ===== */}
            {!isUploading ? (
                <>
                {files.length > 0 && (
                    <section className="lote-formulario" style={{background: 'rgba(0, 210, 255, 0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #00d2ff'}}>
                        <h3 style={{marginBottom: '15px', color: '#00d2ff'}}>🛡️ Perfilado Oficial de Carpeta (Blindaje IA)</h3>
                        <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                            <div style={{flex: 1, minWidth: '200px'}}>
                                <label style={{display: 'block', marginBottom: '5px'}}>Nombre de Cliente (Fijo):</label>
                                <input type="text" value={officialClient} onChange={e => setOfficialClient(e.target.value)} placeholder="Ej: CAMILO TORRES" style={{width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}} />
                            </div>
                            <div style={{flex: 1, minWidth: '200px'}}>
                                <label style={{display: 'block', marginBottom: '5px'}}>Date of Loss (Fijo):</label>
                                <input type="text" value={officialDol} onChange={e => setOfficialDol(e.target.value)} placeholder="MM/DD/YYYY" style={{width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}} />
                            </div>
                            <div style={{flex: 1, minWidth: '200px'}}>
                                <label style={{display: 'block', marginBottom: '5px'}}>Modelo IA:</label>
                                <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>
                                    <option value="gemini-3-flash-preview" style={{color: 'black'}}>Flash Preview (Recomendado)</option>
                                    <option value="gemini-3.1-flash-lite-preview" style={{color: 'black'}}>Flash Lite 3.1 (Ultra Rápido)</option>
                                    <option value="gemini-3.1-pro-preview" style={{color: 'black'}}>Pro Preview (Inteligente)</option>
                                </select>
                            </div>
                        </div>
                        {/* QC Toggle */}
                        <div style={{marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none'}}>
                                <input
                                    type="checkbox"
                                    checked={enableQC}
                                    onChange={e => setEnableQC(e.target.checked)}
                                    style={{width: '18px', height: '18px', accentColor: '#8a2be2', cursor: 'pointer'}}
                                />
                                <span style={{color: enableQC ? '#8a2be2' : '#8b8d99', fontWeight: enableQC ? 'bold' : 'normal', transition: 'color 0.2s'}}>
                                    🔍 Control de Calidad (Doble Revisión IA)
                                </span>
                            </label>
                            {enableQC && (
                                <span style={{fontSize: '0.75rem', color: '#ff9800', background: 'rgba(255,152,0,0.15)', padding: '3px 8px', borderRadius: '6px'}}>
                                    ⚠️ Duplica el tiempo de procesamiento
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
                    onClick={() => fileInputRef.current.click()}
                >
                    <input type="file" multiple webkitdirectory="true" ref={fileInputRef} onChange={handleFileSelect} accept=".png,.jpg,.jpeg,.pdf,.webp" />
                    <div className="drop-icon">📂</div>
                    {files.length > 0 ? (
                        <div>
                            <h3>{files.length} archivos capturados en memoria</h3>
                            <p style={{ marginTop: '10px', color: 'var(--accent)', fontStyle: 'italic' }}>
                                {files.slice(0, 4).map(f => f.name).join(', ')} {files.length > 4 ? `y ${files.length - 4} más...` : ''}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3>Suelte Carpetas Enteras o PDFs / Imágenes aquí</h3>
                            <p>Nuestra lógica recursiva buscará los documentos compatibles dentro de la carpeta.</p>
                        </div>
                    )}
                </section>
                </>
            ) : (
                <>
                {/* ===== BLOQUE DE PENSAMIENTO IA ===== */}
                {(thinkingData || thinkingHistory.length > 0) && (
                    <section style={{
                        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(15, 23, 42, 0.6))',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '12px',
                        padding: thinkingOpen ? '1.2rem' : '0.6rem 1.2rem',
                        marginBottom: '1rem',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'padding 0.3s ease'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                            background: isUploading ? 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)' : 'linear-gradient(90deg, #22c55e, #10b981)',
                            backgroundSize: '200% 100%',
                            animation: isUploading ? 'shimmer 2s ease-in-out infinite' : 'none'
                        }} />
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => setThinkingOpen(prev => !prev)}
                        >
                            <span style={{ fontSize: '1.3rem' }}>🧠</span>
                            <span style={{ color: '#c084fc', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '1px' }}>RAZONAMIENTO IA</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: 'auto' }}>
                                {thinkingHistory.length} doc{thinkingHistory.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ fontSize: '1.2rem', color: '#a78bfa', transition: 'transform 0.3s', transform: thinkingOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>

                        {thinkingOpen && (
                            <div style={{ marginTop: '0.8rem' }}>
                                {thinkingData && (
                                    <div style={{
                                        background: 'rgba(0,0,0,0.35)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        marginBottom: thinkingHistory.length > 1 ? '0.8rem' : 0
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
                                            <span style={{ background: 'rgba(168,85,247,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.88rem', color: '#e9d5ff' }}>
                                                📄 {thinkingData.filename}
                                            </span>
                                            <span style={{ background: thinkingData.summary?.tipo === 'Bill' ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.88rem', color: thinkingData.summary?.tipo === 'Bill' ? '#fde68a' : '#bbf7d0' }}>
                                                {thinkingData.summary?.tipo === 'Bill' ? '💰' : '🏥'} {thinkingData.summary?.tipo}
                                            </span>
                                            <span style={{ background: 'rgba(6,182,212,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.88rem', color: '#a5f3fc' }}>
                                                👤 {thinkingData.summary?.cliente}
                                            </span>
                                            {thinkingData.summary?.intruso && (
                                                <span style={{ background: 'rgba(239,68,68,0.4)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.88rem', color: '#fca5a5' }}>
                                                    🚨 INTRUSO
                                                </span>
                                            )}
                                            <span style={{ background: 'rgba(59,130,246,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.88rem', color: '#bfdbfe' }}>
                                                📋 {thinkingData.summary?.items} items
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '0.95rem',
                                            color: '#d1d5db',
                                            lineHeight: '1.7',
                                            fontStyle: 'italic',
                                            maxHeight: '250px',
                                            overflowY: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            scrollbarWidth: 'thin'
                                        }}>
                                            💭 {thinkingData.reasoning}
                                        </div>
                                    </div>
                                )}

                                {thinkingHistory.length > 1 && (
                                    <details style={{ marginTop: '0.5rem' }}>
                                        <summary style={{ cursor: 'pointer', color: '#a78bfa', fontSize: '0.9rem', userSelect: 'none' }}>
                                            📜 Ver historial completo ({thinkingHistory.length - 1} anteriores)
                                        </summary>
                                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '0.5rem', scrollbarWidth: 'thin' }}>
                                            {thinkingHistory.slice(0, -1).reverse().map((t, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(0,0,0,0.2)',
                                                    borderRadius: '6px',
                                                    padding: '0.7rem',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.88rem',
                                                    color: '#9ca3af'
                                                }}>
                                                    <strong style={{ color: '#c084fc' }}>📄 {t.filename}</strong>
                                                    <span style={{ marginLeft: '8px', color: t.summary?.tipo === 'Bill' ? '#fde68a' : '#bbf7d0' }}>{t.summary?.tipo}</span>
                                                    {t.timestamp && <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '0.78rem' }}>{new Date(t.timestamp).toLocaleString()}</span>}
                                                    <div style={{ marginTop: '4px', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{t.reasoning}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}
                    </section>
                )}

                <section className="terminal-container">
                    <div className="terminal-header">
                        <span>Conexión Segura con Gemini</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span style={{fontFamily: 'monospace', fontSize: '1.1rem', color: '#00d2ff', fontWeight: 'bold', letterSpacing: '2px'}}>
                                ⏱ {formatTime(elapsedSeconds)}
                            </span>
                            <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span>
                        </div>
                    </div>
                    <div className="terminal-body">
                        {streamLogs.map((log, index) => (
                            <div key={index} className="terminal-line">{log}</div>
                        ))}
                        <div ref={terminalEndRef} />
                        {!streamLogs.length && <div className="terminal-line">Iniciando interfaz de transferencia...</div>}
                        <div className="terminal-line">
                            <span style={{ color: 'transparent' }}>_</span>
                            <span className="terminal-cursor"></span>
                        </div>
                    </div>
                </section>
                </>
            )}

            {/* ===== BOTÓN DE INICIAR IA ===== */}
            {files.length > 0 && !isUploading && (
                <section className="actions-bar" style={{ justifyContent: 'center' }}>
                    <button className="btn" onClick={evalFilesForDuplicates} disabled={!officialClient || !officialDol}>
                        {(!officialClient || !officialDol) ? 'Llena Cliente y DOL para desbloquear' : '⚡ Iniciar Evaluación IA de Todos los Documentos'}
                    </button>
                </section>
            )}

            {/* ===== ZONA DE ALERTAS / PENDIENTES ===== */}
            {pendientes.length > 0 && (
                <section className="conflict-manager">
                    <h3>⚠️ Documentos Pendientes de Revisión ({pendientes.length})</h3>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Pendientes del lote seleccionado. Asígnalos o elimínalos.
                    </p>
                    <div className="table-wrapper">
                        <table style={{tableLayout: 'fixed', width: '100%'}}>
                            <colgroup>
                                <col style={{width: '18%'}} />
                                <col style={{width: '12%'}} />
                                <col style={{width: '8%'}} />
                                <col style={{width: '10%'}} />
                                <col style={{width: '24%'}} />
                                <col style={{width: '12%'}} />
                                <col style={{width: '16%'}} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    <th>Cliente</th>
                                    <th>DOL</th>
                                    <th>Tipo</th>
                                    <th>Motivo</th>
                                    <th>Lote</th>
                                    <th style={{textAlign: 'center'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendientes.map((doc, idx) => {
                                    const hasQC = doc._qc && doc._qc.discrepancies && doc._qc.discrepancies.length > 0;
                                    const diffFields = hasQC ? doc._qc.discrepancies.map(d => d.field) : [];
                                    const isDiff = (field) => diffFields.some(f => f === field || f.startsWith(field));

                                    if (hasQC) {
                                        // ═══ QC DUAL ROW ═══
                                        const r1 = doc._qc.run1;
                                        const r2 = doc._qc.run2;
                                        const diffStyle = { background: 'rgba(255,0,68,0.15)', color: '#ff6b6b', fontWeight: 'bold' };
                                        const normalStyle = {};

                                        return [
                                            <tr key={`${idx}-r1`} style={{borderBottom: 'none', background: 'rgba(0,200,83,0.04)'}}>
                                                <td rowSpan={2} style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle'}} title={doc.archivoOrigen}>
                                                    <small style={{cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline'}} onClick={() => openDocumentLocal(doc.archivoOrigen)}>
                                                        {doc.archivoOrigen}
                                                    </small>
                                                    <div style={{marginTop: '4px'}}>
                                                        <span style={{fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(138,43,226,0.3)', color: '#cba6f7'}}>
                                                            🔍 QC: {doc._qc.discrepancies.length} discrepancia(s)
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{...(isDiff('nombreCliente') ? diffStyle : normalStyle), fontSize: '0.8rem'}}>
                                                    <span style={{color: '#00c853', fontSize: '0.6rem', fontWeight: 'bold'}}>R1 </span>
                                                    {r1.nombreCliente || '—'}
                                                </td>
                                                <td style={{...(isDiff('dol') ? diffStyle : normalStyle), fontSize: '0.8rem'}}>
                                                    {r1.dol || '—'}
                                                </td>
                                                <td style={{...(isDiff('tipoDocumento') ? diffStyle : normalStyle)}}>
                                                    <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,200,83,0.2)', color: '#00c853'}}>
                                                        {r1.tipoDocumento === 'Medical Record' ? 'Record' : 'Bill'}
                                                    </span>
                                                </td>
                                                <td rowSpan={2} style={{color: '#ff3333', fontSize: '0.7rem', wordBreak: 'break-word', whiteSpace: 'normal', verticalAlign: 'middle'}}>
                                                    {doc._qc.discrepancies.map((d, di) => (
                                                        <div key={di} style={{marginBottom: '3px', padding: '2px 4px', background: 'rgba(255,0,0,0.08)', borderRadius: '3px'}}>
                                                            <strong style={{color: '#ff9800'}}>{d.label}:</strong>
                                                            <br />
                                                            <span style={{color: '#00c853'}}>R1: {d.run1}</span>
                                                            {' vs '}
                                                            <span style={{color: '#00d2ff'}}>R2: {d.run2}</span>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td rowSpan={2} style={{fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle'}} title={doc._loteKey}>
                                                    {doc._loteKey || '—'}
                                                </td>
                                                <td rowSpan={2} style={{textAlign: 'center', verticalAlign: 'middle'}}>
                                                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch'}}>
                                                        <button className="btn-sm btn-open" onClick={() => openDocumentLocal(doc.archivoOrigen)} style={{fontSize: '0.7rem', padding: '3px 6px'}}>
                                                            👁️ Ver Doc
                                                        </button>
                                                        <button
                                                            className="btn-sm"
                                                            onClick={() => handleAssignPendiente(idx, 'run1')}
                                                            disabled={!selectedLote}
                                                            style={{fontSize: '0.7rem', padding: '3px 6px', background: 'rgba(0,200,83,0.3)', color: '#00c853', border: '1px solid rgba(0,200,83,0.4)', borderRadius: '4px', cursor: 'pointer'}}
                                                        >
                                                            ✅ Aprobar R1
                                                        </button>
                                                        <button
                                                            className="btn-sm"
                                                            onClick={() => handleAssignPendiente(idx, 'run2')}
                                                            disabled={!selectedLote}
                                                            style={{fontSize: '0.7rem', padding: '3px 6px', background: 'rgba(0,210,255,0.3)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)', borderRadius: '4px', cursor: 'pointer'}}
                                                        >
                                                            ✅ Aprobar R2
                                                        </button>
                                                        <button className="btn-sm btn-reject" onClick={() => handleDeletePendiente(idx)} style={{fontSize: '0.7rem', padding: '3px 6px'}}>
                                                            🗑️ Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>,
                                            <tr key={`${idx}-r2`} style={{borderTop: '1px dashed rgba(0,210,255,0.3)', background: 'rgba(0,210,255,0.04)'}}>
                                                <td style={{...(isDiff('nombreCliente') ? diffStyle : normalStyle), fontSize: '0.8rem'}}>
                                                    <span style={{color: '#00d2ff', fontSize: '0.6rem', fontWeight: 'bold'}}>R2 </span>
                                                    {r2.nombreCliente || '—'}
                                                </td>
                                                <td style={{...(isDiff('dol') ? diffStyle : normalStyle), fontSize: '0.8rem'}}>
                                                    {r2.dol || '—'}
                                                </td>
                                                <td style={{...(isDiff('tipoDocumento') ? diffStyle : normalStyle)}}>
                                                    <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,210,255,0.2)', color: '#00d2ff'}}>
                                                        {r2.tipoDocumento === 'Medical Record' ? 'Record' : 'Bill'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ];
                                    }

                                    // ═══ NORMAL ROW (sin QC) ═══
                                    return (
                                        <tr key={idx} className="conflict-row">
                                            <td style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={doc.archivoOrigen}>
                                                <small style={{cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline'}} onClick={() => openDocumentLocal(doc.archivoOrigen)}>
                                                    {doc.archivoOrigen}
                                                </small>
                                            </td>
                                            <td style={{color: '#ff9800', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={doc.nombreCliente || '—'}>{doc.nombreCliente || '—'}</td>
                                            <td style={{fontSize: '0.8rem'}}>{doc.dol || '—'}</td>
                                            <td>
                                                {(() => {
                                                    const tipo = (doc.tipoDocumento || '').toLowerCase();
                                                    const isMedical = tipo.includes('medical');
                                                    const isBill = tipo.includes('bill');
                                                    return (
                                                        <span style={{
                                                            fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                                            background: isMedical ? 'rgba(138,43,226,0.3)' : isBill ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.1)',
                                                            color: isMedical ? '#cba6f7' : isBill ? '#00d2ff' : '#888'
                                                        }}>
                                                            {isMedical ? 'Record' : isBill ? 'Bill' : '?'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td style={{color: '#ff3333', fontSize: '0.75rem', wordBreak: 'break-word', whiteSpace: 'normal'}}>{doc._pendienteMotivo}</td>
                                            <td style={{fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={doc._loteKey}>{doc._loteKey || '—'}</td>
                                            <td style={{textAlign: 'center'}}>
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'stretch'}}>
                                                    <button className="btn-sm btn-open" onClick={() => openDocumentLocal(doc.archivoOrigen)} style={{fontSize: '0.7rem', padding: '3px 6px'}}>
                                                        👁️ Ver
                                                    </button>
                                                    <button 
                                                        className="btn-sm btn-approve" 
                                                        onClick={() => handleAssignPendiente(idx)}
                                                        disabled={!selectedLote}
                                                        title={selectedLote ? `Asignar a ${JSON.parse(selectedLote.value).nombre}` : 'Selecciona un lote'}
                                                        style={{fontSize: '0.7rem', padding: '3px 6px'}}
                                                    >
                                                        🔗 Asignar
                                                    </button>
                                                    <button className="btn-sm btn-reject" onClick={() => handleDeletePendiente(idx)} style={{fontSize: '0.7rem', padding: '3px 6px'}}>
                                                        🗑️ Eliminar
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
            )}

            {/* ===== DOCUMENTOS DEL LOTE SELECCIONADO ===== */}
            {selectedLote && loteDocuments.length > 0 && (
                <div>
                    <div className="date-group-container">
                        <h2 className="date-header">
                            📦 Lote: {JSON.parse(selectedLote.value).nombre} | DOL: {JSON.parse(selectedLote.value).dol} — {loteDocuments.length} documentos
                        </h2>
                        <section className="results-split">
                            {/* MEDICAL RECORDS */}
                            <div className="results-half">
                                <h2 style={{ borderBottom: 'none' }}>
                                    Medical Records <span className="badge-count">{groupedByType.medical.length}</span>
                                </h2>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Client / Doc</th>
                                                <th>Score</th>
                                                <th>Paciente</th>
                                                <th>Servicios / Dr</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedByType.medical.map((doc, dIdx) =>
                                                (doc.lineItems || []).map((item, idx) => (
                                                    <tr key={`m-${dIdx}-${idx}`}>
                                                        {idx === 0 && (
                                                            <td rowSpan={doc.lineItems.length}>
                                                                <strong style={{ color: 'var(--accent)' }}>{doc.nombreCliente || '-'}</strong>
                                                                <br />
                                                                <small style={{cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline'}} onClick={() => openDocumentLocal(doc.archivoOrigen)}>
                                                                    {doc.archivoOrigen}
                                                                </small>
                                                                {doc._dolMissing && (
                                                                    <div style={{marginTop: '4px'}}>
                                                                        <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,152,0,0.25)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.4)'}}>📋 DOL no encontrado</span>
                                                                    </div>
                                                                )}
                                                                {doc._validationFlags && doc._validationFlags.length > 0 && (
                                                                    <div style={{marginTop: '4px'}} title={doc._validationFlags.join('\n')}>
                                                                        <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#aaa', cursor: 'help'}}>🔍 {doc._validationFlags.length} flag(s)</span>
                                                                    </div>
                                                                )}
                                                                <br />
                                                                <button className="btn-sm btn-reject" onClick={() => handleDeleteRecord(doc.archivoOrigen)} style={{marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem'}}>
                                                                    🗑️ Eliminar
                                                                </button>
                                                                <button className="btn-sm" onClick={() => handleRescanDoc(doc.archivoOrigen)} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(0,210,255,0.3)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)', borderRadius: '4px', cursor: rescanningFile ? 'wait' : 'pointer'}}>
                                                                    {rescanningFile === doc.archivoOrigen ? '⏳ Escaneando...' : '🔄 Re-scan IA'}
                                                                </button>
                                                                <button className="btn-sm" onClick={() => { setPageRescanTarget(pageRescanTarget === doc.archivoOrigen ? null : doc.archivoOrigen); setPageRescanInput(''); }} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(138,43,226,0.3)', color: '#cba6f7', border: '1px solid rgba(138,43,226,0.4)', borderRadius: '4px', cursor: 'pointer'}}>
                                                                    📄 Págs
                                                                </button>
                                                                {pageRescanTarget === doc.archivoOrigen && (
                                                                    <div style={{marginTop: '4px', display: 'flex', gap: '3px', alignItems: 'center'}}>
                                                                        <input
                                                                            type="text"
                                                                            value={pageRescanInput}
                                                                            onChange={e => setPageRescanInput(e.target.value)}
                                                                            onKeyDown={e => { if (e.key === 'Enter' && pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }}
                                                                            placeholder="1-5, 3, 8"
                                                                            autoFocus
                                                                            style={{width: '70px', padding: '3px 5px', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(138,43,226,0.5)', outline: 'none'}}
                                                                        />
                                                                        <button onClick={() => { if (pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} disabled={!pageRescanInput.trim()} style={{padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(138,43,226,0.5)', color: 'white', border: 'none', cursor: 'pointer'}}>
                                                                            ▶
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        {idx === 0 && (
                                                            <td rowSpan={doc.lineItems.length} style={{textAlign: 'center'}}>
                                                                {doc._nameMatchScore != null ? (
                                                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                                                                        <span style={{
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 'bold',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            background: doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.2)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.2)' : 'rgba(255,0,68,0.2)',
                                                                            color: doc._nameMatchScore >= 70 ? '#00c853' : doc._nameMatchScore >= 40 ? '#ff9800' : '#ff0044',
                                                                            border: `1px solid ${doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.4)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.4)' : 'rgba(255,0,68,0.4)'}`,
                                                                        }}>
                                                                            {doc._nameMatchScore}%
                                                                        </span>
                                                                        <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>
                                                                            {doc._nameMatchScore >= 70 ? '✅ Match' : doc._nameMatchScore >= 40 ? '⚠️ Revisar' : '🚨 Posible intruso'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        {idx === 0 && (
                                                            <td rowSpan={doc.lineItems.length}>{doc.nombrePaciente || '-'}</td>
                                                        )}
                                                        <td>
                                                            {item.fecha || '-'}: <strong>{item.nombreDoctor || '-'}</strong>
                                                            <br />
                                                            <small style={{ color: 'var(--text-muted)' }}>{item.procedimientoEjecutado || '-'}</small>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                            {groupedByType.medical.length === 0 && (
                                                <tr><td colSpan="4" style={{textAlign: 'center'}}>Vacío</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* FINANCIAL BILLS */}
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
                                                <th>Fecha & Dr.</th>
                                                <th>Monto</th>
                                                <th>Total Doctor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedByType.bills.map((doc, dIdx) =>
                                                (doc.lineItems || []).map((item, idx) => (
                                                    <tr key={`b-${dIdx}-${idx}`}>
                                                        {idx === 0 && (
                                                            <td rowSpan={doc.lineItems.length}>
                                                                <strong style={{ color: 'var(--accent)' }}>{doc.nombreCliente || '-'}</strong>
                                                                <br />
                                                                <strong style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>({doc.quienEnvia || '-'})</strong>
                                                                <br />
                                                                <small style={{cursor: 'pointer', color: '#00d2ff', textDecoration: 'underline'}} onClick={() => openDocumentLocal(doc.archivoOrigen)}>
                                                                    {doc.archivoOrigen}
                                                                </small>
                                                                {doc._dolMissing && (
                                                                    <div style={{marginTop: '4px'}}>
                                                                        <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,152,0,0.25)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.4)'}}>📋 DOL no encontrado</span>
                                                                    </div>
                                                                )}
                                                                {doc._validationFlags && doc._validationFlags.length > 0 && (
                                                                    <div style={{marginTop: '4px'}} title={doc._validationFlags.join('\n')}>
                                                                        <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#aaa', cursor: 'help'}}>🔍 {doc._validationFlags.length} flag(s)</span>
                                                                    </div>
                                                                )}
                                                                <br />
                                                                <button className="btn-sm btn-reject" onClick={() => handleDeleteRecord(doc.archivoOrigen)} style={{marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem'}}>
                                                                    🗑️ Eliminar
                                                                </button>
                                                                <button className="btn-sm" onClick={() => handleRescanDoc(doc.archivoOrigen)} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(0,210,255,0.3)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)', borderRadius: '4px', cursor: rescanningFile ? 'wait' : 'pointer'}}>
                                                                    {rescanningFile === doc.archivoOrigen ? '⏳ Escaneando...' : '🔄 Re-scan IA'}
                                                                </button>
                                                                <button className="btn-sm" onClick={() => { setPageRescanTarget(pageRescanTarget === doc.archivoOrigen ? null : doc.archivoOrigen); setPageRescanInput(''); }} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(138,43,226,0.3)', color: '#cba6f7', border: '1px solid rgba(138,43,226,0.4)', borderRadius: '4px', cursor: 'pointer'}}>
                                                                    📄 Págs
                                                                </button>
                                                                {pageRescanTarget === doc.archivoOrigen && (
                                                                    <div style={{marginTop: '4px', display: 'flex', gap: '3px', alignItems: 'center'}}>
                                                                        <input
                                                                            type="text"
                                                                            value={pageRescanInput}
                                                                            onChange={e => setPageRescanInput(e.target.value)}
                                                                            onKeyDown={e => { if (e.key === 'Enter' && pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }}
                                                                            placeholder="1-5, 3, 8"
                                                                            autoFocus
                                                                            style={{width: '70px', padding: '3px 5px', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(138,43,226,0.5)', outline: 'none'}}
                                                                        />
                                                                        <button onClick={() => { if (pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} disabled={!pageRescanInput.trim()} style={{padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(138,43,226,0.5)', color: 'white', border: 'none', cursor: 'pointer'}}>
                                                                            ▶
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        )}
                                                        {idx === 0 && (
                                                            <td rowSpan={doc.lineItems.length} style={{textAlign: 'center'}}>
                                                                {doc._nameMatchScore != null ? (
                                                                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                                                                        <span style={{
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 'bold',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '8px',
                                                                            background: doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.2)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.2)' : 'rgba(255,0,68,0.2)',
                                                                            color: doc._nameMatchScore >= 70 ? '#00c853' : doc._nameMatchScore >= 40 ? '#ff9800' : '#ff0044',
                                                                            border: `1px solid ${doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.4)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.4)' : 'rgba(255,0,68,0.4)'}`,
                                                                        }}>
                                                                            {doc._nameMatchScore}%
                                                                        </span>
                                                                        <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>
                                                                            {doc._nameMatchScore >= 70 ? '✅ Match' : doc._nameMatchScore >= 40 ? '⚠️ Revisar' : '🚨 Posible intruso'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>—</span>
                                                                )}
                                                            </td>
                                                        )}
                                                        <td>
                                                            {item.fecha || '-'}
                                                            <br />
                                                            <strong>{item.nombreDoctor || '-'}</strong>
                                                        </td>
                                                        <td style={{ color: '#00d2ff', fontWeight: 'bold' }}>{item.monto != null ? `$${Number(item.monto).toLocaleString('en-US', {minimumFractionDigits: 2})}` : '-'}</td>
                                                        <td style={{ color: '#ff9800', fontWeight: 'bold' }}>{item.totalDoctor || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                            {groupedByType.bills.length === 0 && (
                                                <tr><td colSpan="5" style={{textAlign: 'center'}}>Vacío</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* Sin lote seleccionado pero hay lotes */}
            {!selectedLote && loteOptions.length > 0 && (
                <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
                    <h3>👆 Selecciona un lote del dropdown para ver sus documentos</h3>
                    <p>{loteOptions.length} lote(s) disponibles en la base de datos.</p>
                </div>
            )}

            {/* ===== PAPELERA ===== */}
            {trashData.length > 0 && (
                <section style={{maxWidth: '1200px', margin: '2rem auto', border: '2px dashed #ff3333', padding: '1rem', borderRadius: '8px', background: 'rgba(255,0,0,0.05)'}}>
                    <h2 style={{color: '#ff3333', marginBottom: '1rem'}}>🗑️ Papelera de Reciclaje</h2>
                    <ul style={{listStyle: 'none', padding: 0}}>
                        {trashData.map((t, idx) => (
                            <li key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '10px', marginBottom: '8px', borderRadius: '4px'}}>
                                <div>
                                    <strong style={{color: 'white'}}>{t.archivoOrigen}</strong>
                                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                                        Eliminado: {new Date(t.deletedAt).toLocaleString()}
                                        {t.doc._fromLote && ` | Lote: ${t.doc._fromLote}`}
                                    </div>
                                </div>
                                <button className="btn-sm" style={{background: '#00d2ff', color: 'black'}} onClick={() => handleRestoreRecord(idx)}>
                                    ♻️ Restaurar
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
