import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GeminiService } from './src/services/gemini.service.js';
import { ValidationService } from './src/services/validation.service.js';
import { MasterService } from './src/services/master.service.js';
import { ExcelService } from './src/services/excel.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DOCS_DIR = path.join(OUTPUT_DIR, 'temp_docs');

// Asegurar existencia de carpetas
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);
if (!fs.existsSync(TEMP_DOCS_DIR)) fs.mkdirSync(TEMP_DOCS_DIR);

/** Genera la ruta del subdirectorio temporal para un caso específico */
function getCaseTempDir(nombre, dol) {
    const safeName = (nombre || 'UNKNOWN').replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 60);
    const safeDol = (dol || 'NO-DOL').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const dir = path.join(TEMP_DOCS_DIR, `${safeName}__${safeDol}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

// Configurar multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MIDDLEWARES
app.use(cors());
app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({extended: true, limit: '200mb'}));

// ========================================
// HEALTH CHECK / DIAGNÓSTICO
// ========================================
app.get('/api/health', (req, res) => {
    const mem = process.memoryUsage();
    const tempDocsExists = fs.existsSync(TEMP_DOCS_DIR);
    const tempDocsCount = tempDocsExists ? fs.readdirSync(TEMP_DOCS_DIR).length : 0;
    const dbPath = path.join(OUTPUT_DIR, 'master_db.json');
    const dbExists = fs.existsSync(dbPath);
    let dbSize = 0;
    let loteCount = 0;
    if (dbExists) {
        dbSize = fs.statSync(dbPath).size;
        try {
            const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            loteCount = db.lotes ? db.lotes.length : 0;
        } catch(e) {}
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        node: process.version,
        platform: process.platform,
        memory: {
            rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
            heap: `${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`
        },
        env: {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
            NODE_ENV: process.env.NODE_ENV || 'not set'
        },
        data: {
            tempDocs: tempDocsCount,
            dbExists,
            dbSizeKB: Math.round(dbSize / 1024),
            lotes: loteCount
        },
        cors: 'enabled',
        requestOrigin: req.headers.origin || req.headers.referer || 'direct'
    });
});

// FLAG GLOBAL DE CANCELACIÓN
let cancelFlag = false;
app.post('/api/cancel', (req, res) => {
    cancelFlag = true;
    console.log('[SYS] ⛔ Cancelación solicitada por usuario.');
    res.json({ success: true, msg: 'Cancelación señalada.' });
});

/** Limpiar QA data (por lote o global) */
app.post('/api/clear-qa', (req, res) => {
    try {
        const { nombre, dol } = req.body;
        if (nombre && dol) {
            MasterService.clearQAForLote(nombre, dol);
        } else {
            MasterService.clearAllQA();
        }
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// Servir PDFs estáticamente (soporta subcarpetas por caso)
app.use('/api/documents', express.static(TEMP_DOCS_DIR));

// Cron: Limpiar PDFs > 72 horas (recorre subcarpetas)
setInterval(() => {
    try {
        const now = Date.now();
        const caseDirs = fs.readdirSync(TEMP_DOCS_DIR);
        caseDirs.forEach(caseDir => {
            const casePath = path.join(TEMP_DOCS_DIR, caseDir);
            if (!fs.statSync(casePath).isDirectory()) {
                // Archivos sueltos legacy
                const diffH = (now - fs.statSync(casePath).mtimeMs) / (1000*60*60);
                if (diffH > 72) { fs.unlinkSync(casePath); console.log(`[Limpieza] Legacy caducado: ${caseDir}`); }
                return;
            }
            const files = fs.readdirSync(casePath);
            files.forEach(file => {
                const fp = path.join(casePath, file);
                const diffH = (now - fs.statSync(fp).mtimeMs) / (1000*60*60);
                if (diffH > 72) { fs.unlinkSync(fp); console.log(`[Limpieza] Caducado: ${caseDir}/${file}`); }
            });
            // Si la carpeta quedó vacía, eliminarla
            if (fs.readdirSync(casePath).length === 0) {
                fs.rmdirSync(casePath);
                console.log(`[Limpieza] Carpeta vacía eliminada: ${caseDir}`);
            }
        });
    } catch (e) {
         console.error("[SYS Limpieza] Error en Cron", e);
    }
}, 1000 * 60 * 60 * 12);

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    default: return null;
  }
}

// ========================================
// ENDPOINTS DE LOTES (SELECT)
// ========================================

/** Obtener los lotes disponibles para el select */
app.get('/api/profiles', (req, res) => {
    try {
        const profiles = MasterService.getUniqueProfiles();
        res.json({ profiles });
    } catch(err) {
        console.error("Error perfiles:", err);
        res.status(500).json({ error: "Server err" });
    }
});

/** Obtener documentos de un lote específico */
app.get('/api/lote-documents', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.status(400).json({ error: "Falta nombre o dol" });
        const docs = MasterService.getLoteDocuments(nombre, dol);
        res.json({ success: true, data: docs });
    } catch(err) {
        res.status(500).json({ error: "Error fetching lote docs" });
    }
});

/** Obtener TODOS los records (aplanados) para vista histórica */
app.get('/api/all-records', (req, res) => {
    try {
        const records = MasterService.getAllDocumentsFlat();
        res.json({ success: true, data: records });
    } catch(err) {
        console.error("Error all records:", err);
        res.status(500).json({ error: "Server err fetching records" });
    }
});

// ========================================
// PENDIENTES (ALERTAS)
// ========================================

/** Obtener pendientes de un lote específico */
app.get('/api/pendientes', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.json({ success: true, data: [] });
        const pendientes = MasterService.getPendientes(nombre, dol);
        res.json({ success: true, data: pendientes });
    } catch(err) {
        res.status(500).json({ error: "Error fetching pendientes" });
    }
});

/** Asignar un pendiente a los documentos limpios de su lote */
app.post('/api/assign-pendiente', (req, res) => {
    try {
        const { pendienteIndex, nombre, dol, selectedRun } = req.body;
        if (pendienteIndex === undefined || !nombre || !dol) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        // Si es un documento QC con run seleccionado, resolver antes de asignar
        if (selectedRun) {
            const pendientes = MasterService.getPendientes(nombre, dol);
            const doc = pendientes[pendienteIndex];
            if (doc && doc._qc) {
                const chosen = doc._qc[selectedRun]; // run1 o run2
                if (chosen) {
                    // Reemplazar el documento con los datos del run elegido
                    const cleanDoc = { ...chosen };
                    delete cleanDoc._qc;
                    cleanDoc.archivoOrigen = doc.archivoOrigen;
                    cleanDoc._qcSelectedRun = selectedRun;
                    // Actualizar el pendiente in-place antes de asignarlo
                    Object.keys(doc).forEach(k => { if (k !== '_qc') delete doc[k]; });
                    Object.assign(doc, cleanDoc);
                    delete doc._qc;
                }
            }
        }

        const success = MasterService.assignPendienteToLote(nombre, dol, pendienteIndex);
        res.json({ success });
    } catch(err) {
        res.status(500).json({ error: "Error asignando pendiente" });
    }
});

/** Eliminar un pendiente permanentemente de un lote */
app.delete('/api/pendiente', (req, res) => {
    try {
        const idx = parseInt(req.query.index);
        const { nombre, dol } = req.query;
        if (isNaN(idx) || !nombre || !dol) return res.status(400).json({ error: "Faltan parámetros (index, nombre, dol)" });
        const removed = MasterService.deletePendiente(nombre, dol, idx);
        res.json({ success: !!removed });
    } catch(err) {
        res.status(500).json({ error: "Error eliminando pendiente" });
    }
});

/** Obtener historial de razonamiento IA de un lote */
app.get('/api/thinking', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.json({ success: true, data: [] });
        const history = MasterService.getThinking(nombre, dol);
        res.json({ success: true, data: history });
    } catch(err) {
        res.status(500).json({ error: "Error fetching thinking history" });
    }
});

// ========================================
// RESCAN: Re-evaluar un documento con IA
// ========================================
app.post('/api/rescan-document', async (req, res) => {
    try {
        const { archivoOrigen, nombre, dol, aiModel, pages } = req.body;
        if (!archivoOrigen || !nombre || !dol) return res.status(400).json({ error: 'Faltan parámetros' });

        const caseTempDir = getCaseTempDir(nombre, dol);
        let filePath = path.join(caseTempDir, archivoOrigen);
        // Fallback: buscar en carpeta plana legacy
        if (!fs.existsSync(filePath)) filePath = path.join(TEMP_DOCS_DIR, archivoOrigen);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no disponible en caché (expiró después de 72h). Re-sube el documento.' });
        }

        const targetModel = aiModel || 'gemini-3-flash-preview';
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(archivoOrigen);
        if (!mimeType) return res.status(400).json({ error: 'Tipo de archivo no soportado' });

        const pagesLabel = pages ? ` (Págs: ${pages})` : '';
        console.log(`[RESCAN] Re-analizando ${archivoOrigen}${pagesLabel} con ${targetModel}...`);

        const rawData = await GeminiService.extractDataFromDocument(
            fileBuffer, mimeType, archivoOrigen, targetModel, nombre, dol, null, pages || null
        );

        if (!rawData) {
            return res.status(500).json({ error: 'La IA no pudo re-analizar el documento después de múltiples intentos.' });
        }

        // Post-validación: limpiar, normalizar y verificar la respuesta de IA
        const newData = ValidationService.validate(rawData, nombre, dol);
        
        if (newData._validationError) {
            return res.status(500).json({ error: `Validación falló: ${newData._validationError}` });
        }
        
        if (newData._validationFlags) {
            console.log(`[RESCAN-VALIDACIÓN] Flags para ${archivoOrigen}:`, newData._validationFlags);
        }

        // Actualizar el documento en el lote
        newData.archivoOrigen = archivoOrigen;
        const updated = MasterService.updateDocumentInLote(nombre, dol, archivoOrigen, newData);

        if (updated) {
            console.log(`[RESCAN] ✅ ${archivoOrigen} re-analizado y actualizado.`);
            res.json({ success: true, newData });
        } else {
            res.status(404).json({ error: 'Documento no encontrado en el lote.' });
        }
    } catch(e) {
        console.error('[RESCAN] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// ========================================
// UPLOAD & IA EXTRACTION (SSE)
// ========================================

app.post('/api/upload', upload.array('files'), async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const sendProgress = (msg) => {
        console.log(`[Stream] ${msg}`);
        res.write(JSON.stringify({ type: 'progress', msg }) + '\n');
    };
    
    const sendResultError = (errString) => {
        res.write(JSON.stringify({ type: 'result', data: { error: errString } }) + '\n');
        res.end();
    }

    try {
        if (!req.files || req.files.length === 0) {
            return sendResultError("No se recibieron archivos válidos de la plataforma.");
        }

        const { officialClientName, officialDol, aiModel, enableQC } = req.body;
        const targetModel = aiModel || 'gemini-3-flash-preview';
        const qcEnabled = enableQC === 'true' || enableQC === true;

        const extractedList = [];
        cancelFlag = false; // Reset cancel flag
        sendProgress(`[SYS] Detectados ${req.files.length} archivo(s), Lote: ${officialClientName} (${officialDol}). Modelo: [${targetModel}]${qcEnabled ? ' | 🔍 QC ACTIVO (doble revisión)' : ''}`);

        for (let i = 0; i < req.files.length; i++) {
            // CHECK CANCEL
            if (cancelFlag) {
                sendProgress('[SYS] ⛔ Proceso CANCELADO por el usuario.');
                res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado por usuario' } }) + '\n');
                return res.end();
            }
            const file = req.files[i];
            const mimeType = getMimeType(file.originalname);
            if (!mimeType) {
                 sendProgress(`[SYS] Omitiendo archivo no soportado [${i + 1}/${req.files.length}]: ${file.originalname}`);
                 continue;
            }
            
            // Persistencia temporal (72H) — en subcarpeta del caso
            const caseTempDir = getCaseTempDir(officialClientName, officialDol);
            const savePath = path.join(caseTempDir, file.originalname);
            fs.writeFileSync(savePath, file.buffer);

            // ═══ RUN 1 ═══
            sendProgress(`[IA] ${qcEnabled ? 'R1 — ' : ''}Analizando [${i + 1}/${req.files.length}]: ${file.originalname} ...`);
            const rawData1 = await GeminiService.extractDataFromDocument(
                file.buffer, mimeType, file.originalname, targetModel,
                officialClientName, officialDol,
                (intentoNum) => sendProgress(`[NETWORK] Reintento ${intentoNum} [${i + 1}/${req.files.length}] para ${file.originalname}...`)
            );
            
            if (!rawData1) {
                const abortMsg = `[SISTEMA ABORTADO] 🛑 Fallo definitivo: ${file.originalname} (Límite de reintentos). Lote rechazado.`;
                console.error(abortMsg);
                return sendResultError(abortMsg);
            }

            // Enviar el razonamiento de la IA al frontend y persistirlo
            if (rawData1._reasoning) {
                const thinkingEntry = { filename: file.originalname, reasoning: rawData1._reasoning, summary: {
                    tipo: rawData1.tipoDocumento || '?',
                    cliente: rawData1.nombreCliente || '?',
                    dol: rawData1.dol || '?',
                    provider: rawData1.quienEnvia || '?',
                    intruso: rawData1.alertaIntruso || false,
                    items: (rawData1.lineItems || []).length
                }};
                res.write(JSON.stringify({ type: 'thinking', ...thinkingEntry }) + '\n');
                // Persistir en la DB del lote
                const loteNombre = (officialClientName || '').toUpperCase().trim();
                const loteDol = (officialDol || '').trim();
                if (loteNombre && loteDol) MasterService.addThinking(loteNombre, loteDol, thinkingEntry);
            }

            const validated1 = ValidationService.validate(rawData1, officialClientName, officialDol);
            if (validated1._validationError) {
                sendProgress(`[VALIDACIÓN] ⚠️ R1 inválido para ${file.originalname}: ${validated1._validationError}`);
                continue;
            }

            // ═══ QC: RUN 2 (solo si habilitado) ═══
            if (qcEnabled) {
                if (cancelFlag) { sendProgress('[SYS] ⛔ CANCELADO'); res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado' } }) + '\n'); return res.end(); }

                sendProgress(`[IA] R2 — Segunda revisión [${i + 1}/${req.files.length}]: ${file.originalname} ...`);
                const rawData2 = await GeminiService.extractDataFromDocument(
                    file.buffer, mimeType, file.originalname, targetModel,
                    officialClientName, officialDol,
                    (intentoNum) => sendProgress(`[NETWORK] R2 Reintento ${intentoNum} para ${file.originalname}...`)
                );

                if (rawData2) {
                    const validated2 = ValidationService.validate(rawData2, officialClientName, officialDol);
                    
                    if (!validated2._validationError) {
                        // Comparar ambos runs
                        const comparison = ValidationService.compareExtractions(validated1, validated2);
                        
                        if (comparison.isConsistent) {
                            sendProgress(`[QC] ✅ Consistente [${i + 1}/${req.files.length}]: ${file.originalname} — ambos runs coinciden`);
                            // Usar run1 como resultado final (son iguales)
                            validated1.archivoOrigen = file.originalname;
                            validated1.dol = (validated1.dol || '').trim();
                            validated1._qcConsistent = true;
                            extractedList.push(validated1);
                        } else {
                            sendProgress(`[QC] ⚠️ ${comparison.discrepancies.length} discrepancia(s) [${i + 1}/${req.files.length}]: ${file.originalname}`);
                            comparison.discrepancies.forEach(d => sendProgress(`   ↳ ${d.label}: R1="${d.run1}" vs R2="${d.run2}"`));
                            
                            // Marcar con ambos runs para revisión manual
                            validated1.archivoOrigen = file.originalname;
                            validated1.dol = (validated1.dol || '').trim();
                            validated1._qc = {
                                run1: { ...validated1, _qc: undefined },
                                run2: { ...validated2, archivoOrigen: file.originalname, dol: (validated2.dol || '').trim() },
                                discrepancies: comparison.discrepancies
                            };
                            extractedList.push(validated1);
                        }
                        continue; // Skip the normal flow below
                    }
                }
                // If run2 failed, fall through to use run1 alone
                sendProgress(`[QC] ⚠️ R2 falló para ${file.originalname}, usando R1 solamente`);
            }

            // Flujo normal (sin QC, o QC con R2 fallido)
            if (validated1._validationFlags && validated1._validationFlags.length > 0) {
                validated1._validationFlags.forEach(flag => sendProgress(`[VALIDACIÓN] ${flag} — ${file.originalname}`));
            }
            validated1.archivoOrigen = file.originalname;
            validated1.dol = (validated1.dol || '').trim();
            extractedList.push(validated1);
            sendProgress(`[IA] ✨ Extracción validada [${i + 1}/${req.files.length}]: ${file.originalname} (Score: ${validated1._nameMatchScore || 'N/A'}%)`);
        }

        if (extractedList.length === 0) {
           res.write(JSON.stringify({ type: 'result', data: { success: true, clean: [], pendientes: [] } }) + '\n');
           return res.end();
        }

        // Guardar dummy para modo dev
        fs.writeFileSync(path.join(__dirname, 'output', 'dev-dummy-backup.json'), JSON.stringify(extractedList, null, 2));

        sendProgress(`[MASTER] Clasificando documentos del lote...`);

        // CLASIFICACIÓN: clean (va al lote) vs pendientes (va a alertas)
        const clean = [];
        const pendientesNew = [];

        const loteNombre = (officialClientName || '').toUpperCase().trim();
        const loteDol = (officialDol || '').trim();

        // Obtener documentos existentes en el lote para detectar duplicados
        const existingDocs = loteNombre && loteDol ? MasterService.getLoteDocuments(loteNombre, loteDol) : [];

        extractedList.forEach(doc => {
            let motivo = null;

            // ¿QC con discrepancias?
            if (doc._qc && doc._qc.discrepancies && doc._qc.discrepancies.length > 0) {
                motivo = `🔍 QC: ${doc._qc.discrepancies.length} discrepancia(s) entre R1 y R2 — revisar manualmente`;
            }

            // ¿Intruso detectado por IA?
            if (doc.alertaIntruso) {
                motivo = motivo || `🚨 IA detectó intruso: ${doc.motivoIntruso || 'Documento no corresponde al lote'}`;
            }

            // ¿Sin DOL en el documento?
            if (!doc.dol || doc.dol === '' || doc.dol === 'Sin Fecha') {
                motivo = motivo || '⚠️ Sin Date of Loss encontrado en el documento';
            }

            // ¿Duplicado? (mismo archivo ya existe en el lote)
            const isDuplicate = existingDocs.some(existing => 
                existing.archivoOrigen && existing.archivoOrigen.trim() === (doc.archivoOrigen || '').trim()
            );
            if (isDuplicate) {
                motivo = `🔄 Posible duplicado: ${doc.archivoOrigen} ya existe en el lote`;
            }

            if (motivo) {
                pendientesNew.push({
                    ...doc,
                    _pendienteMotivo: motivo,
                    _loteKey: `${loteNombre}|${loteDol}`
                });
            } else {
                clean.push(doc);
            }
        });

        sendProgress(`[MASTER] ${clean.length} limpios, ${pendientesNew.length} requieren revisión.`);

        // Auto-guardar los limpios en el lote
        if (clean.length > 0 && loteNombre && loteDol) {
            MasterService.saveToLote(loteNombre, loteDol, clean);
            sendProgress(`[MASTER] ✅ ${clean.length} documentos guardados en lote: ${loteNombre} | ${loteDol}`);
        }

        // Guardar pendientes en el lote correspondiente
        if (pendientesNew.length > 0) {
            MasterService.addPendientes(loteNombre, loteDol, pendientesNew);
            sendProgress(`[MASTER] ⚠️ ${pendientesNew.length} documentos enviados a zona de alertas del lote.`);
        }

        res.write(JSON.stringify({ type: 'result', data: { success: true, savedCount: clean.length, pendientesCount: pendientesNew.length } }) + '\n');
        res.end();

    } catch (error) {
        console.error("Upload error:", error);
        sendResultError("Error genérico de streaming interno.");
    }
});

// ========================================
// GUARDAR MANUALMENTE (desde conflictos del front)
// ========================================
app.post('/api/save-records', (req, res) => {
    try {
        const { nombre, dol, recordsToSave } = req.body;
        if (!nombre || !dol || !recordsToSave || recordsToSave.length === 0) {
            return res.json({ success: true, count: 0 });
        }
        const total = MasterService.saveToLote(nombre, dol, recordsToSave);
        res.json({ success: true, count: total });
    } catch(err) {
        console.error("Error guardando:", err);
        res.status(500).json({ error: "Failed to persist records" });
    }
});

// ========================================
// ELIMINAR DOCUMENTO DE LOTE
// ========================================
app.delete('/api/records', (req, res) => {
    try {
        const { archivoOrigen, nombre, dol } = req.query;
        if (!archivoOrigen || !nombre || !dol) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        const removed = MasterService.deleteDocFromLote(nombre, dol, archivoOrigen);
        if (removed) {
            MasterService.sendToTrash(archivoOrigen, { ...removed, _fromLote: nombre, _fromDol: dol });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Documento no encontrado en lote" });
        }
    } catch(err) {
        console.error("Error deleting record:", err);
        res.status(500).json({ error: "Server err deleting record" });
    }
});

// ========================================
// PAPELERA
// ========================================
app.get('/api/deleted-records', (req, res) => {
    try {
        const trash = MasterService.getTrash();
        res.json({ success: true, list: trash });
    } catch(err) {
        res.status(500).json({ error: "Error leyendo papelera" });
    }
});

app.post('/api/restore-record', (req, res) => {
    try {
        const { trashIndex, nombre, dol } = req.body;
        if (trashIndex === undefined || !nombre || !dol) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        const success = MasterService.restoreFromTrash(trashIndex, nombre, dol);
        res.json({ success });
    } catch(err) {
        res.status(500).json({ error: "Error en restauración" });
    }
});

// ========================================
// QA — CORRIDA 2 INDEPENDIENTE
// ========================================

/** Algoritmo de muestreo escalonado */
function getSampleIndices(total) {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i);
    if (total <= 10) {
        const mid = Math.floor(total / 2);
        return [...new Set([0, mid, total - 1])];
    }
    const pattern = [0, 3, 5, 8, 9];
    const indices = new Set();
    const groups = Math.ceil(total / 10);
    for (let g = 0; g < groups; g++) {
        const offset = g * 10;
        for (const pos of pattern) {
            const idx = offset + pos;
            if (idx < total) indices.add(idx);
        }
    }
    indices.add(total - 1);
    return [...indices].sort((a, b) => a - b);
}

app.get('/api/qa-data', (req, res) => {
    try {
        let allDocs = MasterService.getAllDocumentsFlat();
        const { nombre, dol } = req.query;
        if (nombre && dol) {
            allDocs = allDocs.filter(d => d._loteNombre === nombre && d._loteDol === dol);
        }
        const medicalRecords = [];
        const bills = [];
        const allInputs = [];
        allDocs.forEach((doc, idx) => {
            const isMedical = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical');
            const entry = { index: idx, archivo: doc.archivoOrigen, tipoDocumento: doc.tipoDocumento || 'Unknown', provider: doc.quienEnvia || 'Unknown Provider', nombreCliente: doc.nombreCliente, _loteNombre: doc._loteNombre, _loteDol: doc._loteDol, hasQA: !!(doc.qa && typeof doc.qa === 'object'), isMedical };
            allInputs.push(entry);
            if (isMedical) medicalRecords.push({ ...entry, qa: doc.qa });
            else bills.push(entry);
        });
        const sampleIndices = getSampleIndices(medicalRecords.length);
        const sampledRecords = medicalRecords.map((rec, i) => ({ ...rec, sampled: sampleIndices.includes(i), sampleOrder: sampleIndices.includes(i) ? sampleIndices.indexOf(i) + 1 : 0 }));
        const sampledOnly = sampledRecords.filter(r => r.sampled);
        const groupedByProvider = {};
        sampledOnly.forEach(rec => { const key = rec.provider; if (!groupedByProvider[key]) groupedByProvider[key] = []; groupedByProvider[key].push(rec); });
        const sampledFileNames = new Set(sampledOnly.map(r => r.archivo));
        const inputsTable = allInputs.map(entry => ({ ...entry, status: !entry.isMedical ? 'excluded_bill' : (sampledFileNames.has(entry.archivo) ? 'sampled' : 'not_sampled') }));
        res.json({ success: true, inputsTable, totalMedical: medicalRecords.length, totalBills: bills.length, sampleIndices, sampledCount: sampledOnly.length, groupedByProvider, providerNames: Object.keys(groupedByProvider) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

/** Validar archivos disponibles en caché para un lote */
app.get('/api/check-files', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.json({ available: 0, unavailable: 0, medicalCount: 0, totalMedical: 0 });
        const docs = MasterService.getLoteDocuments(nombre, dol);
        let available = 0, unavailable = 0, medicalCount = 0;
        const caseTempDir = getCaseTempDir(nombre, dol);
        docs.forEach(doc => {
            const isMedical = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical');
            if (isMedical) medicalCount++;
            // Buscar primero en carpeta del caso, luego legacy
            const inCase = fs.existsSync(path.join(caseTempDir, doc.archivoOrigen));
            const inLegacy = !inCase && fs.existsSync(path.join(TEMP_DOCS_DIR, doc.archivoOrigen));
            if (inCase || inLegacy) available++;
            else unavailable++;
        });
        res.json({ available, unavailable, medicalCount, totalMedical: medicalCount, totalDocs: docs.length });
    } catch(e) { res.json({ available: 0, unavailable: 0, medicalCount: 0, error: true }); }
});

app.get('/api/qa-status', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        let allDocs = MasterService.getAllDocumentsFlat();
        if (nombre && dol) {
            allDocs = allDocs.filter(d => d._loteNombre === nombre && d._loteDol === dol);
        }
        const medicalWithQA = allDocs.filter(doc => doc.qa && typeof doc.qa === 'object' && doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical')).length;
        const pendientesCount = (nombre && dol) ? MasterService.getPendientesCount(nombre, dol) : MasterService.getAllPendientesCount();
        res.json({ hasData: medicalWithQA > 0, count: medicalWithQA, pendientesCount });
    } catch(err) { res.json({ hasData: false, count: 0, pendientesCount: 0 }); }
});

/** CORRIDA 2: QA sobre Medical Records de un LOTE ESPECÍFICO */
app.post('/api/run-qa', async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    const sendProgress = (msg) => { console.log(`[QA] ${msg}`); res.write(JSON.stringify({ type: 'progress', msg }) + '\n'); };
    try {
        const { aiModel, nombre, dol } = req.body;
        const targetModel = aiModel || 'gemini-3-flash-preview';
        if (!nombre || !dol) { res.write(JSON.stringify({ type: 'result', data: { error: 'Selecciona un batch/lote primero.' } }) + '\n'); return res.end(); }
        const pendientesCount = MasterService.getPendientesCount(nombre, dol);
        if (pendientesCount > 0) { res.write(JSON.stringify({ type: 'result', data: { error: `Hay ${pendientesCount} pendiente(s) en este lote. Resuelve todos primero.` } }) + '\n'); return res.end(); }
        const loteDocs = MasterService.getLoteDocuments(nombre, dol);
        const medRecords = loteDocs.filter(d => d.tipoDocumento && d.tipoDocumento.toLowerCase().includes('medical'));
        if (medRecords.length === 0) { res.write(JSON.stringify({ type: 'result', data: { error: `No hay Medical Records en el lote ${nombre}.` } }) + '\n'); return res.end(); }
        const sampleIndices = getSampleIndices(medRecords.length);
        const toProcess = sampleIndices.map(i => medRecords[i]).filter(Boolean);
        cancelFlag = false;
        sendProgress(`Lote: ${nombre} | ${medRecords.length} Medical Records. Muestreo: ${toProcess.length} con [${targetModel}]`);
        let ok = 0, fail = 0;
        for (let i = 0; i < toProcess.length; i++) {
            if (cancelFlag) { sendProgress('⛔ CANCELADO'); res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado' } }) + '\n'); return res.end(); }
            const doc = toProcess[i];
            const filename = doc.archivoOrigen;
            const caseTempDir = getCaseTempDir(nombre, dol);
            let filePath = path.join(caseTempDir, filename);
            // Fallback legacy
            if (!fs.existsSync(filePath)) filePath = path.join(TEMP_DOCS_DIR, filename);
            if (!fs.existsSync(filePath)) { sendProgress(`⚠️ No en caché: ${filename}`); fail++; continue; }
            sendProgress(`Analizando [${i + 1}/${toProcess.length}]: ${filename}...`);
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(filename).toLowerCase();
            const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
            const qaResult = await GeminiService.extractQAFromDocument(fileBuffer, mimeMap[ext] || 'application/pdf', filename, targetModel, (attempt) => sendProgress(`[RETRY] Intento ${attempt} para ${filename}`));
            if (qaResult) { MasterService.attachQAToDocument(nombre, dol, filename, qaResult); ok++; sendProgress(`✅ [${i + 1}/${toProcess.length}]: ${filename}`); }
            else { fail++; sendProgress(`❌ Falló: ${filename}`); }
        }
        sendProgress(`🏁 Completado: ${ok} ok, ${fail} fail de ${toProcess.length}`);
        res.write(JSON.stringify({ type: 'result', data: { success: true, processed: ok, failed: fail, total: toProcess.length } }) + '\n');
        res.end();
    } catch (error) { console.error("QA err:", error); res.write(JSON.stringify({ type: 'result', data: { error: 'Error interno' } }) + '\n'); res.end(); }
});

// ========================================
// MOCK DEV
// ========================================
app.post('/api/upload-dummy', (req, res) => {
    try {
        const { officialClientName, officialDol } = req.body;
        const dummyPath = path.join(__dirname, 'output', 'dev-dummy-backup.json');
        if (!fs.existsSync(dummyPath)) return res.status(404).json({ error: "Dummy not found" });
        
        const extractedList = JSON.parse(fs.readFileSync(dummyPath));
        const loteNombre = (officialClientName || 'DEV TEST').toUpperCase().trim();
        const loteDol = (officialDol || 'SIN-DOL').trim();

        const clean = [];
        const pendientesNew = [];

        extractedList.forEach(doc => {
            let motivo = null;
            if (doc.alertaIntruso) motivo = `🚨 IA: ${doc.motivoIntruso}`;
            if (!doc.dol || doc.dol === '' || doc.dol === 'Sin Fecha') motivo = motivo || '⚠️ Sin DOL';

            if (motivo) {
                pendientesNew.push({ ...doc, _pendienteMotivo: motivo, _loteKey: `${loteNombre}|${loteDol}` });
            } else {
                clean.push(doc);
            }
        });

        if (clean.length > 0) MasterService.saveToLote(loteNombre, loteDol, clean);
        if (pendientesNew.length > 0) MasterService.addPendientes(loteNombre, loteDol, pendientesNew);
        
        res.json({ success: true, savedCount: clean.length, pendientesCount: pendientesNew.length });
    } catch(err) {
        console.error("Dummy error:", err);
        res.status(500).json({ error: "Dummy fail" });
    }
});

// ========================================
// DESCARGA EXCEL
// ========================================
app.get('/api/download', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        let documents;
        
        if (nombre && dol) {
            // Exportar un lote específico
            documents = MasterService.getLoteDocuments(nombre, dol);
        } else {
            // Exportar todo
            documents = MasterService.getAllDocumentsFlat();
        }

        const finalBuffer = await ExcelService.generateExcelFromData(documents);

        res.setHeader('Content-Disposition', `attachment; filename=Master-Med-Records${nombre ? '-' + nombre : ''}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(finalBuffer);

    } catch(err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Server download err" });
    }
});

// ========================================
// ELIMINAR CASO/LOTE COMPLETO
// ========================================
app.delete('/api/lote', (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) {
            return res.status(400).json({ error: "Faltan parámetros (nombre, dol)" });
        }
        const result = MasterService.deleteLote(nombre, dol);
        if (result.success) {
            // Limpiar archivos temporales de este caso
            let tempFilesRemoved = 0;
            const caseTempDir = getCaseTempDir(nombre, dol);
            if (fs.existsSync(caseTempDir)) {
                const files = fs.readdirSync(caseTempDir);
                files.forEach(f => fs.unlinkSync(path.join(caseTempDir, f)));
                tempFilesRemoved = files.length;
                fs.rmdirSync(caseTempDir);
            }
            console.log(`[SYS] 🗑️ Caso eliminado: ${nombre} | ${dol} — ${result.docsRemoved} docs, ${result.pendRemoved} pend., ${result.trashRemoved} papelera, ${tempFilesRemoved} archivos temp`);
            res.json({ success: true, ...result, tempFilesRemoved });
        } else {
            res.status(404).json({ error: result.reason });
        }
    } catch(err) {
        console.error("Error eliminando caso:", err);
        res.status(500).json({ error: "Fallo eliminando caso" });
    }
});

// ========================================
// RESET DB (dev)
// ========================================
app.delete('/api/reset-db', (req, res) => {
    try {
        MasterService.resetAll();
        // Limpiar TODOS los archivos temporales
        if (fs.existsSync(TEMP_DOCS_DIR)) {
            fs.rmSync(TEMP_DOCS_DIR, { recursive: true, force: true });
            fs.mkdirSync(TEMP_DOCS_DIR);
        }
        console.log('[SYS] DB + temporales eliminados completamente');
        res.json({ success: true, message: "DB y temporales reseteados" });
    } catch(err) {
        console.error("Error fatal borrando DB:", err);
        res.status(500).json({ error: "Fallo borrando DB" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Express corriendo en http://0.0.0.0:${PORT} (accesible externamente)`);
});
