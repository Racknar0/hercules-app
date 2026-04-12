import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { PDFDocument } from 'pdf-lib';
import { GeminiService } from '../../infrastructure/ai/gemini.service.js';
import { ValidationService } from '../../shared/validators/validation.service.js';
import { MasterService } from './services/master.service.js';
import { ExcelService } from '../../infrastructure/export/excel.service.js';
import { TEMP_DOCS_DIR, getCaseTempDir, getMimeType } from '../../shared/runtime/files.js';

const router = Router();

router.get('/api/profiles', async (req, res) => {
    try {
        const profiles = await MasterService.getUniqueProfiles();
        res.json({ profiles });
    } catch (error) {
        console.error('Error perfiles:', error);
        res.status(500).json({ error: 'Server err' });
    }
});

router.get('/api/lote-documents', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.status(400).json({ error: 'Falta nombre o dol' });
        const docs = await MasterService.getLoteDocuments(nombre, dol);
        res.json({ success: true, data: docs });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching lote docs' });
    }
});

router.get('/api/document-file', async (req, res) => {
    try {
        const { nombre, dol, archivoOrigen } = req.query;
        if (!nombre || !dol || !archivoOrigen) {
            return res.status(400).json({ error: 'Missing nombre, dol or archivoOrigen' });
        }

        const caseTempDir = getCaseTempDir(nombre, dol);
        const filePath = path.join(caseTempDir, archivoOrigen);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Document file is not available in temporary storage.' });
        }

        const mimeType = getMimeType(archivoOrigen) || 'application/octet-stream';
        res.type(mimeType);
        return res.sendFile(filePath);
    } catch (error) {
        return res.status(500).json({ error: 'Error opening document file' });
    }
});

router.get('/api/all-records', async (req, res) => {
    try {
        const records = await MasterService.getAllDocumentsFlat();
        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Error all records:', error);
        res.status(500).json({ error: 'Server err fetching records' });
    }
});

router.get('/api/pendientes', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.json({ success: true, data: [] });
        const pendientes = await MasterService.getPendientes(nombre, dol);
        res.json({ success: true, data: pendientes });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching pendientes' });
    }
});

router.post('/api/assign-pendiente', async (req, res) => {
    try {
        const { pendienteIndex, nombre, dol, selectedRun } = req.body;
        if (pendienteIndex === undefined || !nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }

        if (selectedRun) {
            const pendientes = await MasterService.getPendientes(nombre, dol);
            const doc = pendientes[pendienteIndex];
            if (doc && doc._qc) {
                const chosen = doc._qc[selectedRun];
                if (chosen) {
                    const cleanDoc = { ...chosen };
                    delete cleanDoc._qc;
                    cleanDoc.archivoOrigen = doc.archivoOrigen;
                    cleanDoc._qcSelectedRun = selectedRun;
                    Object.keys(doc).forEach((k) => { if (k !== '_qc') delete doc[k]; });
                    Object.assign(doc, cleanDoc);
                    delete doc._qc;
                }
            }
        }

        const success = await MasterService.assignPendienteToLote(nombre, dol, pendienteIndex);
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: 'Error asignando pendiente' });
    }
});

router.delete('/api/pendiente', async (req, res) => {
    try {
        const idx = parseInt(req.query.index, 10);
        const { nombre, dol } = req.query;
        if (Number.isNaN(idx) || !nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros (index, nombre, dol)' });
        }
        const removed = await MasterService.deletePendiente(nombre, dol, idx);
        res.json({ success: !!removed });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando pendiente' });
    }
});

router.get('/api/thinking', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.json({ success: true, data: [] });
        const history = await MasterService.getThinking(nombre, dol);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching thinking history' });
    }
});

router.post('/api/rescan-document', async (req, res) => {
    try {
        const { archivoOrigen, nombre, dol, aiModel, pages } = req.body;
        if (!archivoOrigen || !nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }

        const caseTempDir = getCaseTempDir(nombre, dol);
        const filePath = path.join(caseTempDir, archivoOrigen);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no disponible en cache (expiro despues de 72h). Re-sube el documento.' });
        }

        const targetModel = aiModel || 'gemini-3-flash-preview';
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(archivoOrigen);
        if (!mimeType) return res.status(400).json({ error: 'Tipo de archivo no soportado' });

        const rawData = await GeminiService.extractDataFromDocument(
            fileBuffer,
            mimeType,
            archivoOrigen,
            targetModel,
            nombre,
            dol,
            null,
            pages || null,
        );

        if (!rawData) {
            return res.status(500).json({ error: 'La IA no pudo re-analizar el documento despues de multiples intentos.' });
        }

        const newData = ValidationService.validate(rawData, nombre, dol);
        if (newData._validationError) {
            return res.status(500).json({ error: `Validacion fallo: ${newData._validationError}` });
        }

        newData.archivoOrigen = archivoOrigen;
        const updated = await MasterService.updateDocumentInLote(nombre, dol, archivoOrigen, newData);
        if (!updated) {
            return res.status(404).json({ error: 'Documento no encontrado en el lote.' });
        }

        res.json({ success: true, newData });
    } catch (error) {
        console.error('[RESCAN] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/update-document-field', async (req, res) => {
    try {
        const { nombre, dol, archivoOrigen, field, value } = req.body;
        const allowedFields = ['nombreCliente', 'nombrePaciente', 'quienEnvia'];

        if (!nombre || !dol || !archivoOrigen || !field) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: `Campo no permitido: ${field}` });
        }

        const success = await MasterService.updateDocumentField(
            nombre,
            dol,
            archivoOrigen,
            field,
            String(value ?? '').trim(),
        );

        if (!success) return res.status(404).json({ error: 'Documento no encontrado' });
        return res.json({ success: true });
    } catch (error) {
        console.error('Inline update document field error:', error);
        return res.status(500).json({ error: 'Error actualizando documento' });
    }
});

router.post('/api/update-lineitem-field', async (req, res) => {
    try {
        const { nombre, dol, archivoOrigen, lineItemIndex, field, value } = req.body;
        const allowedFields = ['fecha', 'nombreDoctor', 'procedimientoEjecutado', 'monto'];

        if (!nombre || !dol || !archivoOrigen || lineItemIndex === undefined || !field) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ error: `Campo no permitido: ${field}` });
        }

        const idx = Number(lineItemIndex);
        if (!Number.isInteger(idx) || idx < 0) {
            return res.status(400).json({ error: 'lineItemIndex invalido' });
        }

        let normalizedValue = value;
        if (field === 'monto') {
            const asNumber = Number(value);
            normalizedValue = Number.isFinite(asNumber) ? asNumber : null;
        } else {
            normalizedValue = String(value ?? '').trim();
        }

        const success = await MasterService.updateLineItemField(
            nombre,
            dol,
            archivoOrigen,
            idx,
            field,
            normalizedValue,
        );

        if (!success) return res.status(404).json({ error: 'Line item no encontrado' });
        return res.json({ success: true });
    } catch (error) {
        console.error('Inline update line item error:', error);
        return res.status(500).json({ error: 'Error actualizando line item' });
    }
});

router.post('/api/update-sender-group', async (req, res) => {
    try {
        const { nombre, dol, oldSender, newSender } = req.body;
        if (!nombre || !dol || oldSender === undefined || newSender === undefined) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }

        const cleanNewSender = String(newSender ?? '').trim();
        if (!cleanNewSender) {
            return res.status(400).json({ error: 'El remitente no puede estar vacio' });
        }

        const updatedCount = await MasterService.updateSenderForLote(
            nombre,
            dol,
            String(oldSender ?? ''),
            cleanNewSender,
        );

        if (updatedCount <= 0) {
            return res.status(404).json({ error: 'No se encontraron documentos para ese remitente' });
        }

        return res.json({ success: true, updatedCount });
    } catch (error) {
        console.error('Inline update sender group error:', error);
        return res.status(500).json({ error: 'Error actualizando remitente' });
    }
});

router.post('/api/save-records', async (req, res) => {
    try {
        const { nombre, dol, recordsToSave } = req.body;
        if (!nombre || !dol || !recordsToSave || recordsToSave.length === 0) {
            return res.json({ success: true, count: 0 });
        }
        const total = await MasterService.saveToLote(nombre, dol, recordsToSave);
        res.json({ success: true, count: total });
    } catch (error) {
        console.error('Error guardando:', error);
        res.status(500).json({ error: 'Failed to persist records' });
    }
});

router.delete('/api/records', async (req, res) => {
    try {
        const { archivoOrigen, nombre, dol } = req.query;
        if (!archivoOrigen || !nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }

        const removed = await MasterService.deleteDocFromLote(nombre, dol, archivoOrigen);
        if (!removed) {
            return res.status(404).json({ error: 'Documento no encontrado en lote' });
        }

        await MasterService.sendToTrash(archivoOrigen, { ...removed, _fromLote: nombre, _fromDol: dol });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: 'Server err deleting record' });
    }
});

router.get('/api/deleted-records', async (req, res) => {
    try {
        const trash = await MasterService.getTrash();
        res.json({ success: true, list: trash });
    } catch (error) {
        res.status(500).json({ error: 'Error leyendo papelera' });
    }
});

router.post('/api/restore-record', async (req, res) => {
    try {
        const { trashIndex, nombre, dol } = req.body;
        if (trashIndex === undefined || !nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros' });
        }

        const success = await MasterService.restoreFromTrash(trashIndex, nombre, dol);
        res.json({ success });
    } catch (error) {
        res.status(500).json({ error: 'Error en restauracion' });
    }
});

router.get('/api/download', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        let documents;

        if (nombre && dol) {
            documents = await MasterService.getLoteDocuments(nombre, dol);
        } else {
            documents = await MasterService.getAllDocumentsFlat();
        }

        const finalBuffer = await ExcelService.generateExcelFromData(documents);
        const safeNombre = nombre
            ? String(nombre).replace(/[^a-zA-Z0-9 _.-]/g, '_').substring(0, 50)
            : '';
        const filename = `Master-Med-Records${safeNombre ? `-${safeNombre}` : ''}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(finalBuffer);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Server download err' });
    }
});

router.get('/api/download-normalized', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) return res.status(400).json({ error: 'Faltan nombre y dol' });

        const docs = await MasterService.getLoteDocuments(nombre, dol);
        if (!docs || docs.length === 0) {
            return res.status(404).json({ error: 'No hay documentos en este lote' });
        }

        const caseTempDir = getCaseTempDir(nombre, dol);
        const safeName = (nombre || 'Case').replace(/[^a-zA-Z0-9 _.-]/g, '_').substring(0, 50);
        const safeDol = (dol || 'NO-DOL').replace(/\//g, '-');
        const zipFilename = `${safeName} - ${safeDol}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => { throw err; });
        archive.pipe(res);

        const usedNames = new Set();
        for (const doc of docs) {
            const filePath = path.join(caseTempDir, doc.archivoOrigen);
            if (!fs.existsSync(filePath)) continue;

            const firstDate = (doc.lineItems && doc.lineItems.length > 0) ? doc.lineItems[0].fecha : 'Sin-Fecha';
            const provider = doc.quienEnvia || doc.lineItems?.[0]?.nombreDoctor || 'Unknown Provider';
            const safeProvider = provider.replace(/[^a-zA-Z0-9 _.,()-]/g, '_').substring(0, 60);

            let normalizedName = '';
            const isBill = doc.tipoDocumento && doc.tipoDocumento.toLowerCase().includes('bill');
            if (isBill) {
                let totalAmount = 0;
                (doc.lineItems || []).forEach((li) => { if (li.monto) totalAmount += li.monto; });
                const amountStr = totalAmount > 0 ? ` - $${totalAmount.toFixed(2)}` : '';
                normalizedName = `${firstDate} - ${safeProvider}${amountStr}.pdf`;
            } else {
                normalizedName = `${firstDate} - ${safeProvider}.pdf`;
            }

            let finalName = normalizedName;
            let counter = 2;
            while (usedNames.has(finalName.toLowerCase())) {
                const ext = '.pdf';
                const base = normalizedName.replace(ext, '');
                finalName = `${base} (${counter})${ext}`;
                counter++;
            }
            usedNames.add(finalName.toLowerCase());

            const ext = path.extname(doc.archivoOrigen).toLowerCase();
            const imageExts = ['.png', '.jpg', '.jpeg', '.webp'];
            if (imageExts.includes(ext)) {
                const imgBuffer = fs.readFileSync(filePath);
                const mimeMap = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
                const mime = mimeMap[ext] || 'image/jpeg';
                const pdfBytes = await createMinimalImagePDF(imgBuffer, mime);
                archive.append(Buffer.from(pdfBytes), { name: finalName });
            } else {
                archive.file(filePath, { name: finalName });
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error('Error generando normalized pack:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Error generando pack' });
    }
});

router.delete('/api/lote', async (req, res) => {
    try {
        const { nombre, dol } = req.query;
        if (!nombre || !dol) {
            return res.status(400).json({ error: 'Faltan parametros (nombre, dol)' });
        }

        const result = await MasterService.deleteLote(nombre, dol);
        if (!result.success) {
            return res.status(404).json({ error: result.reason });
        }

        let tempFilesRemoved = 0;
        const caseTempDir = getCaseTempDir(nombre, dol);
        if (fs.existsSync(caseTempDir)) {
            const files = fs.readdirSync(caseTempDir);
            files.forEach((f) => fs.unlinkSync(path.join(caseTempDir, f)));
            tempFilesRemoved = files.length;
            fs.rmdirSync(caseTempDir);
        }

        res.json({ success: true, ...result, tempFilesRemoved });
    } catch (error) {
        console.error('Error eliminando caso:', error);
        res.status(500).json({ error: 'Fallo eliminando caso' });
    }
});

router.delete('/api/reset-db', async (req, res) => {
    try {
        await MasterService.resetAll();
        if (fs.existsSync(TEMP_DOCS_DIR)) {
            fs.rmSync(TEMP_DOCS_DIR, { recursive: true, force: true });
            fs.mkdirSync(TEMP_DOCS_DIR, { recursive: true });
        }
        res.json({ success: true, message: 'DB y temporales reseteados' });
    } catch (error) {
        console.error('Error fatal borrando DB:', error);
        res.status(500).json({ error: 'Fallo borrando DB' });
    }
});

async function createMinimalImagePDF(imgBuffer, mime) {
    const pdfDoc = await PDFDocument.create();
    let img;

    if (mime.includes('jpeg') || mime.includes('jpg')) {
        img = await pdfDoc.embedJpg(imgBuffer);
    } else if (mime.includes('png')) {
        img = await pdfDoc.embedPng(imgBuffer);
    } else {
        return imgBuffer;
    }

    const maxW = 612;
    const maxH = 792;
    let w = img.width;
    let h = img.height;
    const scale = Math.min(maxW / w, maxH / h, 1);
    w *= scale;
    h *= scale;

    const page = pdfDoc.addPage([w, h]);
    page.drawImage(img, { x: 0, y: 0, width: w, height: h });
    return pdfDoc.save();
}

export default router;
