import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ESTRUCTURA DEL JSON MAESTRO (v2 — pendientes por lote):
 * {
 *   lotes: [
 *     {
 *       nombre: "PEPE MARTINEZ",    // KEY - nombre oficial del form
 *       dol: "04-16-2026",          // KEY - fecha oficial del form
 *       documents: [                // documentos CRUDOS sin tocar
 *         { nombreCliente: "juan pelaez", archivoOrigen: "...", ... },
 *         { nombreCliente: "juan pelaez p", archivoOrigen: "...", ... }
 *       ],
 *       pendientes: [               // pendientes SOLO de este caso
 *         { nombreCliente: "julian narvaez", _pendienteMotivo: "...", ... }
 *       ]
 *     }
 *   ]
 * }
 */
export class MasterService {
    static dbPath = path.join(__dirname, '..', '..', 'output', 'Master-Med-Records.json');

    // ===========================
    // LECTURA / ESCRITURA BASE
    // ===========================
    static _readDB() {
        if (!fs.existsSync(this.dbPath)) return { lotes: [] };
        try {
            const raw = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            // Migración: si es un array viejo, convertir
            if (Array.isArray(raw)) {
                return { lotes: [] };
            }
            const db = { lotes: raw.lotes || [] };

            // Asegurar que cada lote tenga su array de pendientes
            db.lotes.forEach(l => { if (!l.pendientes) l.pendientes = []; });

            // ═══ MIGRACIÓN v1→v2: mover pendientes globales a sus lotes ═══
            if (raw.pendientes && raw.pendientes.length > 0) {
                console.log(`[MIGRACIÓN] Migrando ${raw.pendientes.length} pendientes globales a sus lotes...`);
                raw.pendientes.forEach(pend => {
                    // Extraer nombre y dol del _loteKey (formato "NOMBRE|DOL")
                    let targetNombre = null;
                    let targetDol = null;
                    if (pend._loteKey) {
                        const parts = pend._loteKey.split('|');
                        targetNombre = parts[0] || null;
                        targetDol = parts[1] || null;
                    }
                    if (!targetNombre || !targetDol) {
                        // Si no tiene loteKey, intentar usar los datos del pendiente
                        targetNombre = (pend.nombreCliente || 'SIN_NOMBRE').toUpperCase().trim();
                        targetDol = (pend.dol || 'SIN_DOL').trim();
                    }
                    // Buscar o crear lote destino
                    let lote = db.lotes.find(l => l.nombre === targetNombre && l.dol === targetDol);
                    if (!lote) {
                        lote = { nombre: targetNombre, dol: targetDol, documents: [], pendientes: [] };
                        db.lotes.push(lote);
                    }
                    lote.pendientes.push(pend);
                });
                // Guardar la DB migrada (sin pendientes globales)
                this._writeDB(db);
                console.log(`[MIGRACIÓN] ✅ Pendientes migrados a sus lotes.`);
            }

            return db;
        } catch (e) {
            console.error("Error reading JSON DB", e);
            return { lotes: [] };
        }
    }

    static _writeDB(db) {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2));
    }

    // ===========================
    // LOTES
    // ===========================

    /** Obtener todos los lotes (para el select) */
    static getLotes() {
        const db = this._readDB();
        return db.lotes.map(l => ({
            nombre: l.nombre,
            dol: l.dol,
            documentCount: l.documents.length,
            pendientesCount: (l.pendientes || []).length
        }));
    }

    /** Obtener documentos de un lote específico */
    static getLoteDocuments(nombre, dol) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        return lote ? lote.documents : [];
    }

    /** Obtener TODOS los documentos aplanados (para exportar excel o vista histórica) */
    static getAllDocumentsFlat() {
        const db = this._readDB();
        const flat = [];
        db.lotes.forEach(l => {
            l.documents.forEach(doc => {
                flat.push({ ...doc, _loteNombre: l.nombre, _loteDol: l.dol });
            });
        });
        return flat;
    }

    /** Guardar documentos limpios en un lote (crear lote si no existe) */
    static saveToLote(nombre, dol, documents) {
        const db = this._readDB();
        let lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) {
            lote = { nombre, dol, documents: [] };
            db.lotes.push(lote);
        }
        lote.documents.push(...documents);
        this._writeDB(db);
        return lote.documents.length;
    }

    /** Eliminar un documento de un lote (devuelve el doc eliminado o null) */
    static deleteDocFromLote(nombre, dol, archivoOrigen) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) return null;

        const idx = lote.documents.findIndex(d => d.archivoOrigen === archivoOrigen);
        if (idx === -1) return null;

        const [removed] = lote.documents.splice(idx, 1);

        // Si el lote quedó vacío, eliminarlo
        if (lote.documents.length === 0) {
            db.lotes = db.lotes.filter(l => !(l.nombre === nombre && l.dol === dol));
        }

        this._writeDB(db);
        return removed;
    }

    // ===========================
    // PENDIENTES (ALERTAS) — POR LOTE
    // ===========================

    /** Obtener pendientes de un lote específico */
    static getPendientes(nombre, dol) {
        const db = this._readDB();
        if (!nombre || !dol) return [];
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        return lote ? (lote.pendientes || []) : [];
    }

    /** Contar pendientes de un lote específico */
    static getPendientesCount(nombre, dol) {
        return this.getPendientes(nombre, dol).length;
    }

    /** Contar total de pendientes en TODOS los lotes */
    static getAllPendientesCount() {
        const db = this._readDB();
        return db.lotes.reduce((sum, l) => sum + (l.pendientes || []).length, 0);
    }

    /** Agregar documentos a pendientes de un lote específico */
    static addPendientes(nombre, dol, docs) {
        const db = this._readDB();
        let lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) {
            lote = { nombre, dol, documents: [], pendientes: [] };
            db.lotes.push(lote);
        }
        if (!lote.pendientes) lote.pendientes = [];
        lote.pendientes.push(...docs);
        this._writeDB(db);
    }

    /** Asignar un pendiente a los documentos limpios del mismo lote */
    static assignPendienteToLote(nombre, dol, pendienteIndex) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote || !lote.pendientes) return false;
        if (pendienteIndex < 0 || pendienteIndex >= lote.pendientes.length) return false;

        const [doc] = lote.pendientes.splice(pendienteIndex, 1);
        // Limpiar metadatos de pendiente
        delete doc.motivo;
        delete doc.loteKey;
        delete doc._pendienteMotivo;
        delete doc._loteKey;
        delete doc.alertaIntruso;
        delete doc.motivoIntruso;

        // ESTAMPAR el DOL oficial del lote al documento
        doc.dol = dol;

        lote.documents.push(doc);

        this._writeDB(db);
        return true;
    }

    /** Eliminar un pendiente permanentemente de un lote */
    static deletePendiente(nombre, dol, pendienteIndex) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote || !lote.pendientes) return null;
        if (pendienteIndex < 0 || pendienteIndex >= lote.pendientes.length) return null;
        const [removed] = lote.pendientes.splice(pendienteIndex, 1);
        // Si el lote quedó sin documentos ni pendientes, eliminarlo
        if (lote.documents.length === 0 && lote.pendientes.length === 0) {
            db.lotes = db.lotes.filter(l => !(l.nombre === nombre && l.dol === dol));
        }
        this._writeDB(db);
        return removed;
    }

    // ===========================
    // PAPELERA
    // ===========================
    static trashPath = path.join(__dirname, '..', '..', 'output', 'deleted_records.json');

    static _readTrash() {
        if (!fs.existsSync(this.trashPath)) return [];
        try { return JSON.parse(fs.readFileSync(this.trashPath, 'utf8')); } 
        catch { return []; }
    }

    static _writeTrash(data) {
        fs.writeFileSync(this.trashPath, JSON.stringify(data, null, 2));
    }

    static sendToTrash(archivoOrigen, doc) {
        const trash = this._readTrash();
        trash.push({ archivoOrigen, deletedAt: new Date().toISOString(), doc });
        this._writeTrash(trash);
    }

    static getTrash() {
        return this._readTrash();
    }

    static restoreFromTrash(trashIndex, targetLoteNombre, targetLoteDol) {
        const trash = this._readTrash();
        if (trashIndex < 0 || trashIndex >= trash.length) return false;

        const [entry] = trash.splice(trashIndex, 1);
        this._writeTrash(trash);

        // Restaurar al lote
        this.saveToLote(targetLoteNombre, targetLoteDol, [entry.doc]);
        return true;
    }

    // ===========================
    // UTILIDADES
    // ===========================

    /** Para el endpoint de profiles/select: devuelve los lotes como opciones únicas */
    static getUniqueProfiles() {
        const db = this._readDB();
        return db.lotes.map(l => ({
            labelCliente: l.nombre,
            dol: l.dol,
            documentCount: l.documents.length,
            pendientesCount: (l.pendientes || []).length,
            key: `${l.nombre}|${l.dol}`
        }));
    }

    /** Guardar un razonamiento IA en el historial del lote */
    static addThinking(nombre, dol, thinkingEntry) {
        const db = this._readDB();
        let lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) {
            lote = { nombre, dol, documents: [], pendientes: [], thinkingHistory: [] };
            db.lotes.push(lote);
        }
        if (!lote.thinkingHistory) lote.thinkingHistory = [];
        lote.thinkingHistory.push({
            ...thinkingEntry,
            timestamp: new Date().toISOString()
        });
        this._writeDB(db);
    }

    /** Obtener historial de razonamiento de un lote */
    static getThinking(nombre, dol) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        return lote ? (lote.thinkingHistory || []) : [];
    }

    /** Eliminar un caso/lote completo (documentos + pendientes + papelera asociada) */
    static deleteLote(nombre, dol) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) return { success: false, reason: 'Lote no encontrado' };

        const docsRemoved = lote.documents.length;
        const pendRemoved = (lote.pendientes || []).length;

        // Eliminar el lote de la DB
        db.lotes = db.lotes.filter(l => !(l.nombre === nombre && l.dol === dol));
        this._writeDB(db);

        // Limpiar entradas de papelera asociadas a este caso
        const trash = this._readTrash();
        const filteredTrash = trash.filter(t => {
            const fromLote = t.doc && t.doc._fromLote;
            const fromDol = t.doc && t.doc._fromDol;
            return !(fromLote === nombre && fromDol === dol);
        });
        const trashRemoved = trash.length - filteredTrash.length;
        this._writeTrash(filteredTrash);

        return { success: true, docsRemoved, pendRemoved, trashRemoved };
    }

    /** Limpiar toda la DB (modo dev) */
    static resetAll() {
        if (fs.existsSync(this.dbPath)) fs.unlinkSync(this.dbPath);
        if (fs.existsSync(this.trashPath)) fs.unlinkSync(this.trashPath);
    }

    /** Adjuntar data QA a un documento específico dentro de un lote */
    static attachQAToDocument(loteNombre, loteDol, archivoOrigen, qaData) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === loteNombre && l.dol === loteDol);
        if (!lote) return false;
        const doc = lote.documents.find(d => d.archivoOrigen === archivoOrigen);
        if (!doc) return false;
        doc.qa = qaData;
        this._writeDB(db);
        return true;
    }

    /** Actualizar un documento existente en un lote con data nueva del rescan */
    static updateDocumentInLote(nombre, dol, archivoOrigen, newData) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) return false;
        const docIndex = lote.documents.findIndex(d => d.archivoOrigen === archivoOrigen);
        if (docIndex === -1) return false;
        // Preservar metadatos internos
        const oldDoc = lote.documents[docIndex];
        newData._loteNombre = oldDoc._loteNombre;
        newData._loteDol = oldDoc._loteDol;
        newData._loteKey = oldDoc._loteKey;
        // Preservar QA si existía
        if (oldDoc.qa) newData.qa = oldDoc.qa;
        lote.documents[docIndex] = newData;
        this._writeDB(db);
        return true;
    }

    /** Limpiar TODA la data QA de todos los documentos (para re-run) */
    static clearAllQA() {
        const db = this._readDB();
        db.lotes.forEach(lote => {
            lote.documents.forEach(doc => {
                delete doc.qa;
            });
        });
        this._writeDB(db);
    }

    /** Limpiar data QA solo de un lote específico */
    static clearQAForLote(nombre, dol) {
        const db = this._readDB();
        const lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (lote) {
            lote.documents.forEach(doc => { delete doc.qa; });
            this._writeDB(db);
        }
    }
}
