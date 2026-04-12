import fs from 'fs';
import { MasterService } from '../records/services/master.service.js';
import { TEMP_DOCS_DIR } from '../../infrastructure/storage/temp-docs.runtime.js';
import { requestCancel } from './services/cancel.service.js';

export async function health(req, res) {
    try {
        const mem = process.memoryUsage();
        const tempDocsExists = fs.existsSync(TEMP_DOCS_DIR);
        const tempDocsCount = tempDocsExists ? fs.readdirSync(TEMP_DOCS_DIR).length : 0;
        const stats = await MasterService.getStats();

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(process.uptime())}s`,
            node: process.version,
            platform: process.platform,
            memory: {
                rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
                heap: `${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
            },
            env: {
                GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
                NODE_ENV: process.env.NODE_ENV || 'not set',
            },
            data: {
                tempDocs: tempDocsCount,
                db: {
                    cases: stats.cases,
                    documents: stats.documents,
                    pendientes: stats.pendientes,
                },
            },
            cors: 'enabled',
            requestOrigin: req.headers.origin || req.headers.referer || 'direct',
        });
    } catch (error) {
        console.error('Health error:', error);
        res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
}

export function cancel(req, res) {
    requestCancel();
    console.log('[SYS] Cancelacion solicitada por usuario.');
    res.json({ success: true, msg: 'Cancelacion senalada.' });
}

export async function clearQa(req, res) {
    try {
        const { nombre, dol } = req.body;
        if (nombre && dol) {
            await MasterService.clearQAForLote(nombre, dol);
        } else {
            await MasterService.clearAllQA();
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
