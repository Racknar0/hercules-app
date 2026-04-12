import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'output');
export const TEMP_DOCS_DIR = path.join(OUTPUT_DIR, 'temp_docs');

let cleanupIntervalRef = null;

export function ensureRuntimeDirectories() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (!fs.existsSync(TEMP_DOCS_DIR)) fs.mkdirSync(TEMP_DOCS_DIR, { recursive: true });
}

export function getCaseTempDir(nombre, dol) {
    const safeName = (nombre || 'UNKNOWN').replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 60);
    const safeDol = (dol || 'NO-DOL').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const dir = path.join(TEMP_DOCS_DIR, `${safeName}__${safeDol}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.pdf': return 'application/pdf';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        default: return null;
    }
}

export function startTempDocsCleanupCron() {
    if (cleanupIntervalRef) return cleanupIntervalRef;

    cleanupIntervalRef = setInterval(() => {
        try {
            const now = Date.now();
            if (!fs.existsSync(TEMP_DOCS_DIR)) return;

            const caseDirs = fs.readdirSync(TEMP_DOCS_DIR);
            caseDirs.forEach((caseDir) => {
                const casePath = path.join(TEMP_DOCS_DIR, caseDir);
                if (!fs.existsSync(casePath) || !fs.statSync(casePath).isDirectory()) return;

                const files = fs.readdirSync(casePath);
                files.forEach((file) => {
                    const fp = path.join(casePath, file);
                    const diffH = (now - fs.statSync(fp).mtimeMs) / (1000 * 60 * 60);
                    if (diffH > 72) {
                        fs.unlinkSync(fp);
                        console.log(`[Limpieza] Caducado: ${caseDir}/${file}`);
                    }
                });

                if (fs.readdirSync(casePath).length === 0) {
                    fs.rmdirSync(casePath);
                    console.log(`[Limpieza] Carpeta vacia eliminada: ${caseDir}`);
                }
            });
        } catch (error) {
            console.error('[SYS Limpieza] Error en Cron', error);
        }
    }, 1000 * 60 * 60 * 12);

    return cleanupIntervalRef;
}
