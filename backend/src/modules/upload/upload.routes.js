import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GeminiService } from '../../services/gemini.service.js';
import { ValidationService } from '../../services/validation.service.js';
import { MasterService } from '../../services/master.service.js';
import {
    getCaseTempDir,
    getMimeType,
} from '../../shared/runtime/files.js';
import {
    isCancelRequested,
    resetCancel,
} from '../../shared/runtime/process.control.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/upload', upload.array('files'), async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const sendProgress = (msg) => {
        console.log(`[Stream] ${msg}`);
        res.write(JSON.stringify({ type: 'progress', msg }) + '\n');
    };

    const sendResultError = (errorMessage) => {
        res.write(JSON.stringify({ type: 'result', data: { error: errorMessage } }) + '\n');
        res.end();
    };

    try {
        if (!req.files || req.files.length === 0) {
            return sendResultError('No se recibieron archivos validos de la plataforma.');
        }

        const { officialClientName, officialDol, aiModel, enableQC } = req.body;
        const targetModel = aiModel || 'gemini-3-flash-preview';
        const qcEnabled = enableQC === 'true' || enableQC === true;

        const extractedList = [];
        resetCancel();

        sendProgress(`[SYS] Detectados ${req.files.length} archivo(s), Lote: ${officialClientName} (${officialDol}). Modelo: [${targetModel}]${qcEnabled ? ' | QC ACTIVO (doble revision)' : ''}`);

        for (let i = 0; i < req.files.length; i++) {
            if (isCancelRequested()) {
                sendProgress('[SYS] Proceso CANCELADO por el usuario.');
                res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado por usuario' } }) + '\n');
                return res.end();
            }

            const file = req.files[i];
            const mimeType = getMimeType(file.originalname);
            if (!mimeType) {
                sendProgress(`[SYS] Omitiendo archivo no soportado [${i + 1}/${req.files.length}]: ${file.originalname}`);
                continue;
            }

            const caseTempDir = getCaseTempDir(officialClientName, officialDol);
            const savePath = path.join(caseTempDir, file.originalname);
            fs.writeFileSync(savePath, file.buffer);

            sendProgress(`[IA] ${qcEnabled ? 'R1 - ' : ''}Analizando [${i + 1}/${req.files.length}]: ${file.originalname} ...`);
            const rawData1 = await GeminiService.extractDataFromDocument(
                file.buffer,
                mimeType,
                file.originalname,
                targetModel,
                officialClientName,
                officialDol,
                (retry) => sendProgress(`[NETWORK] Reintento ${retry} [${i + 1}/${req.files.length}] para ${file.originalname}...`),
            );

            if (!rawData1) {
                const abortMsg = `[SISTEMA ABORTADO] Fallo definitivo: ${file.originalname} (Limite de reintentos). Lote rechazado.`;
                console.error(abortMsg);
                return sendResultError(abortMsg);
            }

            if (rawData1._reasoning) {
                const thinkingEntry = {
                    filename: file.originalname,
                    reasoning: rawData1._reasoning,
                    summary: {
                        tipo: rawData1.tipoDocumento || '?',
                        cliente: rawData1.nombreCliente || '?',
                        dol: rawData1.dol || '?',
                        provider: rawData1.quienEnvia || '?',
                        intruso: rawData1.alertaIntruso || false,
                        items: (rawData1.lineItems || []).length,
                    },
                };
                res.write(JSON.stringify({ type: 'thinking', ...thinkingEntry }) + '\n');

                const loteNombre = (officialClientName || '').toUpperCase().trim();
                const loteDol = (officialDol || '').trim();
                if (loteNombre && loteDol) {
                    await MasterService.addThinking(loteNombre, loteDol, thinkingEntry);
                }
            }

            const validated1 = ValidationService.validate(rawData1, officialClientName, officialDol);
            if (validated1._validationError) {
                sendProgress(`[VALIDACION] R1 invalido para ${file.originalname}: ${validated1._validationError}`);
                continue;
            }

            if (qcEnabled) {
                if (isCancelRequested()) {
                    sendProgress('[SYS] CANCELADO');
                    res.write(JSON.stringify({ type: 'result', data: { error: 'Cancelado' } }) + '\n');
                    return res.end();
                }

                sendProgress(`[IA] R2 - Segunda revision [${i + 1}/${req.files.length}]: ${file.originalname} ...`);
                const rawData2 = await GeminiService.extractDataFromDocument(
                    file.buffer,
                    mimeType,
                    file.originalname,
                    targetModel,
                    officialClientName,
                    officialDol,
                    (retry) => sendProgress(`[NETWORK] R2 Reintento ${retry} para ${file.originalname}...`),
                );

                if (rawData2) {
                    const validated2 = ValidationService.validate(rawData2, officialClientName, officialDol);

                    if (!validated2._validationError) {
                        const comparison = ValidationService.compareExtractions(validated1, validated2);

                        if (comparison.isConsistent) {
                            sendProgress(`[QC] Consistente [${i + 1}/${req.files.length}]: ${file.originalname} - ambos runs coinciden`);
                            validated1.archivoOrigen = file.originalname;
                            validated1.dol = (validated1.dol || '').trim();
                            validated1._qcConsistent = true;
                            extractedList.push(validated1);
                        } else {
                            sendProgress(`[QC] ${comparison.discrepancies.length} discrepancia(s) [${i + 1}/${req.files.length}]: ${file.originalname}`);
                            comparison.discrepancies.forEach((d) => {
                                sendProgress(`   > ${d.label}: R1="${d.run1}" vs R2="${d.run2}"`);
                            });

                            validated1.archivoOrigen = file.originalname;
                            validated1.dol = (validated1.dol || '').trim();
                            validated1._qc = {
                                run1: { ...validated1, _qc: undefined },
                                run2: {
                                    ...validated2,
                                    archivoOrigen: file.originalname,
                                    dol: (validated2.dol || '').trim(),
                                },
                                discrepancies: comparison.discrepancies,
                            };
                            extractedList.push(validated1);
                        }
                        continue;
                    }
                }

                sendProgress(`[QC] R2 fallo para ${file.originalname}, usando R1 solamente`);
            }

            if (validated1._validationFlags && validated1._validationFlags.length > 0) {
                validated1._validationFlags.forEach((flag) => sendProgress(`[VALIDACION] ${flag} - ${file.originalname}`));
            }

            validated1.archivoOrigen = file.originalname;
            validated1.dol = (validated1.dol || '').trim();
            extractedList.push(validated1);
            sendProgress(`[IA] Extraccion validada [${i + 1}/${req.files.length}]: ${file.originalname} (Score: ${validated1._nameMatchScore || 'N/A'}%)`);
        }

        if (extractedList.length === 0) {
            res.write(JSON.stringify({ type: 'result', data: { success: true, clean: [], pendientes: [] } }) + '\n');
            return res.end();
        }

        sendProgress('[MASTER] Clasificando documentos del lote...');

        const clean = [];
        const pendientesNew = [];

        const loteNombre = (officialClientName || '').toUpperCase().trim();
        const loteDol = (officialDol || '').trim();

        const existingDocs = loteNombre && loteDol
            ? await MasterService.getLoteDocuments(loteNombre, loteDol)
            : [];

        extractedList.forEach((doc) => {
            let motivo = null;

            if (doc._qc && doc._qc.discrepancies && doc._qc.discrepancies.length > 0) {
                motivo = `QC: ${doc._qc.discrepancies.length} discrepancia(s) entre R1 y R2 - revisar manualmente`;
            }

            if (doc.alertaIntruso) {
                motivo = motivo || `IA detecto intruso: ${doc.motivoIntruso || 'Documento no corresponde al lote'}`;
            }

            if (!doc.dol || doc.dol === '' || doc.dol === 'Sin Fecha') {
                motivo = motivo || 'Sin Date of Loss encontrado en el documento';
            }

            const isDuplicate = existingDocs.some(
                (existing) => existing.archivoOrigen && existing.archivoOrigen.trim() === (doc.archivoOrigen || '').trim(),
            );
            if (isDuplicate) {
                motivo = `Posible duplicado: ${doc.archivoOrigen} ya existe en el lote`;
            }

            if (motivo) {
                pendientesNew.push({
                    ...doc,
                    _pendienteMotivo: motivo,
                    _loteKey: `${loteNombre}|${loteDol}`,
                });
            } else {
                clean.push(doc);
            }
        });

        sendProgress(`[MASTER] ${clean.length} limpios, ${pendientesNew.length} requieren revision.`);

        if (clean.length > 0 && loteNombre && loteDol) {
            await MasterService.saveToLote(loteNombre, loteDol, clean);
            sendProgress(`[MASTER] ${clean.length} documentos guardados en lote: ${loteNombre} | ${loteDol}`);
        }

        if (pendientesNew.length > 0) {
            await MasterService.addPendientes(loteNombre, loteDol, pendientesNew);
            sendProgress(`[MASTER] ${pendientesNew.length} documentos enviados a zona de alertas del lote.`);
        }

        res.write(JSON.stringify({ type: 'result', data: { success: true, savedCount: clean.length, pendientesCount: pendientesNew.length } }) + '\n');
        res.end();
    } catch (error) {
        console.error('Upload error:', error);
        sendResultError('Error generico de streaming interno.');
    }
});

export default router;
