import fs from 'fs';
import path from 'path';
import { GeminiService } from '../../infrastructure/ai/gemini.service.js';
import { MasterService } from '../records/services/master.service.js';
import { getCaseTempDir, getMimeType } from '../../infrastructure/storage/temp-docs.runtime.js';
import { isCancelRequested, resetCancel } from '../system/services/cancel.service.js';

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

export async function getQaData(req, res) {
    try {
        let allDocs = await MasterService.getAllDocumentsFlat();
        const { nombre, dol } = req.query;

        if (nombre && dol) {
            allDocs = allDocs.filter((d) => d._loteNombre === nombre && d._loteDol === dol);
        }

        const medicalRecords = [];
        const bills = [];
        const allInputs = [];

        allDocs.forEach((doc, idx) => {
            const isMedical = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical');
            const entry = {
                index: idx,
                archivo: doc.archivoOrigen,
                tipoDocumento: doc.tipoDocumento || 'Unknown',
                provider: doc.quienEnvia || 'Unknown Provider',
                nombreCliente: doc.nombreCliente,
                _loteNombre: doc._loteNombre,
                _loteDol: doc._loteDol,
                hasQA: !!(doc.qa && typeof doc.qa === 'object'),
                isMedical,
            };

            allInputs.push(entry);
            if (isMedical) medicalRecords.push({ ...entry, qa: doc.qa });
            else bills.push(entry);
        });

        const sampleIndices = getSampleIndices(medicalRecords.length);
        const sampledRecords = medicalRecords.map((rec, i) => ({
            ...rec,
            sampled: sampleIndices.includes(i),
            sampleOrder: sampleIndices.includes(i) ? sampleIndices.indexOf(i) + 1 : 0,
        }));

        const sampledOnly = sampledRecords.filter((r) => r.sampled);
        const groupedByProvider = {};
        sampledOnly.forEach((rec) => {
            const key = rec.provider;
            if (!groupedByProvider[key]) groupedByProvider[key] = [];
            groupedByProvider[key].push(rec);
        });

        const sampledFileNames = new Set(sampledOnly.map((r) => r.archivo));
        const inputsTable = allInputs.map((entry) => ({
            ...entry,
            status: !entry.isMedical ? 'excluded_bill' : (sampledFileNames.has(entry.archivo) ? 'sampled' : 'not_sampled'),
        }));

        res.json({
            success: true,
            inputsTable,
            totalMedical: medicalRecords.length,
            totalBills: bills.length,
            sampleIndices,
            sampledCount: sampledOnly.length,
            groupedByProvider,
            providerNames: Object.keys(groupedByProvider),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function checkFiles(req, res) {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) {
            return res.json({ available: 0, unavailable: 0, medicalCount: 0, totalMedical: 0 });
        }

        const docs = await MasterService.getLoteDocuments(nombre, dol);
        let available = 0;
        let unavailable = 0;
        let medicalCount = 0;
        const caseTempDir = getCaseTempDir(nombre, dol);

        docs.forEach((doc) => {
            const isMedical = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical');
            if (isMedical) medicalCount++;

            const inCase = fs.existsSync(path.join(caseTempDir, doc.archivoOrigen));
            if (inCase) available++;
            else unavailable++;
        });

        res.json({ available, unavailable, medicalCount, totalMedical: medicalCount, totalDocs: docs.length });
    } catch (error) {
        res.json({ available: 0, unavailable: 0, medicalCount: 0, error: true });
    }
}

export async function qaStatus(req, res) {
    try {
        const { nombre, dol } = req.query;
        let allDocs = await MasterService.getAllDocumentsFlat();
        if (nombre && dol) {
            allDocs = allDocs.filter((d) => d._loteNombre === nombre && d._loteDol === dol);
        }

        const medicalWithQA = allDocs.filter((doc) => doc.qa && typeof doc.qa === 'object' && doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('medical')).length;
        const pendientesCount = (nombre && dol)
            ? await MasterService.getPendientesCount(nombre, dol)
            : await MasterService.getAllPendientesCount();

        res.json({ hasData: medicalWithQA > 0, count: medicalWithQA, pendientesCount });
    } catch (error) {
        res.json({ hasData: false, count: 0, pendientesCount: 0 });
    }
}

export async function runQa(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    const sendProgress = (msg) => {
        console.log(`[QA] ${msg}`);
        res.write(JSON.stringify({ type: 'progress', msg }) + '\n');
    };

    try {
        const { aiModel, nombre, dol } = req.body;
        const targetModel = aiModel || 'gemini-3-flash-preview';

        if (!nombre || !dol) {
            res.write(JSON.stringify({ type: 'result', data: { error: 'Selecciona un batch/lote primero.' } }) + '\n');
            return res.end();
        }

        const pendientesCount = await MasterService.getPendientesCount(nombre, dol);
        if (pendientesCount > 0) {
            res.write(JSON.stringify({ type: 'result', data: { error: `Hay ${pendientesCount} pendiente(s) en este lote. Resuelve todos primero.` } }) + '\n');
            return res.end();
        }

        const loteDocs = await MasterService.getLoteDocuments(nombre, dol);
        const medRecords = loteDocs.filter((d) => d.tipoDocumento && d.tipoDocumento.toLowerCase().includes('medical'));
        if (medRecords.length === 0) {
            res.write(JSON.stringify({ type: 'result', data: { error: `No hay Medical Records en el lote ${nombre}.` } }) + '\n');
            return res.end();
        }

        const sampleIndices = getSampleIndices(medRecords.length);
        const toProcess = sampleIndices.map((i) => medRecords[i]).filter(Boolean);
        resetCancel();

        sendProgress(`Lote: ${nombre} | ${medRecords.length} Medical Records. Muestreo: ${toProcess.length} con [${targetModel}]`);

        let ok = 0;
        let fail = 0;
        for (let i = 0; i < toProcess.length; i++) {
            if (isCancelRequested()) {
                sendProgress('⛔ CANCELADO');
                res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado' } }) + '\n');
                return res.end();
            }

            const doc = toProcess[i];
            const filename = doc.archivoOrigen;
            const caseTempDir = getCaseTempDir(nombre, dol);
            const filePath = path.join(caseTempDir, filename);

            if (!fs.existsSync(filePath)) {
                sendProgress(`⚠️ No en cache: ${filename}`);
                fail++;
                continue;
            }

            sendProgress(`Analizando [${i + 1}/${toProcess.length}]: ${filename}...`);
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = getMimeType(filename) || 'application/pdf';
            const qaResult = await GeminiService.extractQAFromDocument(
                fileBuffer,
                mimeType,
                filename,
                targetModel,
                (attempt) => sendProgress(`[RETRY] Intento ${attempt} para ${filename}`),
            );

            if (qaResult) {
                await MasterService.attachQAToDocument(nombre, dol, filename, qaResult);
                ok++;
                sendProgress(`✅ [${i + 1}/${toProcess.length}]: ${filename}`);
            } else {
                fail++;
                sendProgress(`❌ Fallo: ${filename}`);
            }
        }

        sendProgress(`🏁 Completado: ${ok} ok, ${fail} fail de ${toProcess.length}`);
        res.write(JSON.stringify({ type: 'result', data: { success: true, processed: ok, failed: fail, total: toProcess.length } }) + '\n');
        res.end();
    } catch (error) {
        console.error('QA err:', error);
        res.write(JSON.stringify({ type: 'result', data: { error: 'Error interno' } }) + '\n');
        res.end();
    }
}
