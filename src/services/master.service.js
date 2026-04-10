import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ESTRUCTURA DEL JSON MAESTRO:
 * {
 *   lotes: [
 *     {
 *       nombre: "PEPE MARTINEZ",    // KEY - nombre oficial del form
 *       dol: "04-16-2026",          // KEY - fecha oficial del form
 *       documents: [                // documentos CRUDOS sin tocar
 *         { nombreCliente: "juan pelaez", archivoOrigen: "...", ... },
 *         { nombreCliente: "juan pelaez p", archivoOrigen: "...", ... }
 *       ]
 *     }
 *   ],
 *   pendientes: [
 *     { nombreCliente: "julian narvaez", motivo: "Nombre distinto al lote", loteKey: "PEPE MARTINEZ|04-16-2026", ... }
 *   ]
 * }
 */
export class MasterService {
    static dbPath = path.join(__dirname, '..', '..', 'output', 'Master-Med-Records.json');

    // ===========================
    // LECTURA / ESCRITURA BASE
    // ===========================
    static _readDB() {
        if (!fs.existsSync(this.dbPath)) return { lotes: [], pendientes: [] };
        try {
            const raw = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            // Migración: si es un array viejo, convertir
            if (Array.isArray(raw)) {
                return { lotes: [], pendientes: [] };
            }
            return { lotes: raw.lotes || [], pendientes: raw.pendientes || [] };
        } catch (e) {
            console.error("Error reading JSON DB", e);
            return { lotes: [], pendientes: [] };
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
            documentCount: l.documents.length
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
    // PENDIENTES (ALERTAS)
    // ===========================

    /** Obtener todos los pendientes */
    static getPendientes() {
        const db = this._readDB();
        return db.pendientes;
    }

    /** Agregar documentos a pendientes */
    static addPendientes(docs) {
        const db = this._readDB();
        db.pendientes.push(...docs);
        this._writeDB(db);
    }

    /** Asignar un pendiente a un lote existente (moverlo de pendientes → lote) */
    static assignPendienteToLote(pendienteIndex, nombre, dol) {
        const db = this._readDB();
        if (pendienteIndex < 0 || pendienteIndex >= db.pendientes.length) return false;

        const [doc] = db.pendientes.splice(pendienteIndex, 1);
        // Limpiar metadatos de pendiente
        delete doc.motivo;
        delete doc.loteKey;
        delete doc._pendienteMotivo;
        delete doc._loteKey;
        delete doc.alertaIntruso;
        delete doc.motivoIntruso;

        // ESTAMPAR el DOL oficial del lote al documento
        doc.dol = dol;

        let lote = db.lotes.find(l => l.nombre === nombre && l.dol === dol);
        if (!lote) {
            lote = { nombre, dol, documents: [] };
            db.lotes.push(lote);
        }
        lote.documents.push(doc);

        this._writeDB(db);
        return true;
    }

    /** Eliminar un pendiente permanentemente */
    static deletePendiente(pendienteIndex) {
        const db = this._readDB();
        if (pendienteIndex < 0 || pendienteIndex >= db.pendientes.length) return null;
        const [removed] = db.pendientes.splice(pendienteIndex, 1);
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
            key: `${l.nombre}|${l.dol}`
        }));
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
