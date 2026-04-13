import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'output');
export const TEMP_DOCS_DIR = path.join(OUTPUT_DIR, 'temp_docs');
export const TEMP_APPROVED_SUBDIR = 'temporalesaprobados';
export const TEMP_PENDING_SUBDIR = 'temporales_sin_aprobar';

let cleanupIntervalRef = null;

function toSafeCaseSegment(value, fallback, maxLength = null) {
    const sanitized = String(value || fallback).replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!maxLength) return sanitized;
    return sanitized.substring(0, maxLength);
}

export function getCaseDirectoryName(nombre, dol) {
    const safeName = toSafeCaseSegment(nombre, 'UNKNOWN', 60);
    const safeDol = toSafeCaseSegment(dol, 'NO-DOL');
    return `${safeName}__${safeDol}`;
}

export function ensureRuntimeDirectories() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (!fs.existsSync(TEMP_DOCS_DIR)) fs.mkdirSync(TEMP_DOCS_DIR, { recursive: true });
}

export function getCaseTempDir(nombre, dol) {
    ensureRuntimeDirectories();

    const dir = path.join(TEMP_DOCS_DIR, getCaseDirectoryName(nombre, dol));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const approvedDir = path.join(dir, TEMP_APPROVED_SUBDIR);
    const pendingDir = path.join(dir, TEMP_PENDING_SUBDIR);

    if (!fs.existsSync(approvedDir)) fs.mkdirSync(approvedDir, { recursive: true });
    if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });

    return dir;
}

export function getCaseApprovedTempDir(nombre, dol) {
    return path.join(getCaseTempDir(nombre, dol), TEMP_APPROVED_SUBDIR);
}

export function getCasePendingTempDir(nombre, dol) {
    return path.join(getCaseTempDir(nombre, dol), TEMP_PENDING_SUBDIR);
}

export function getCaseTempCandidateDirs(
    nombre,
    dol,
    { includeApproved = true, includePending = true, includeLegacy = true } = {},
) {
    const caseDir = getCaseTempDir(nombre, dol);
    const dirs = [];

    if (includeApproved) dirs.push(path.join(caseDir, TEMP_APPROVED_SUBDIR));
    if (includePending) dirs.push(path.join(caseDir, TEMP_PENDING_SUBDIR));
    if (includeLegacy) dirs.push(caseDir);

    return [...new Set(dirs)];
}

export function resolveCaseTempFilePath(nombre, dol, archivoOrigen, options = {}) {
    const fileName = String(archivoOrigen || '').trim();
    if (!fileName) return null;

    const candidateDirs = getCaseTempCandidateDirs(nombre, dol, options);

    for (const dirPath of candidateDirs) {
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue;

        const exactPath = path.join(dirPath, fileName);
        if (fs.existsSync(exactPath)) return exactPath;

        const lowerFileName = fileName.toLowerCase();
        const matched = fs
            .readdirSync(dirPath)
            .find((entry) => String(entry).toLowerCase() === lowerFileName);

        if (matched) {
            return path.join(dirPath, matched);
        }
    }

    return null;
}

function cleanupOldFilesInDirectory(directoryPath, now, caseDir, locationLabel) {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) return;

    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    entries.forEach((entry) => {
        if (!entry.isFile()) return;

        const fp = path.join(directoryPath, entry.name);
        const diffH = (now - fs.statSync(fp).mtimeMs) / (1000 * 60 * 60);
        if (diffH > 72) {
            fs.unlinkSync(fp);
            console.log(`[Limpieza] Caducado: ${caseDir}/${locationLabel}/${entry.name}`);
        }
    });
}

function removeDirectoryIfEmpty(directoryPath, logLabel) {
    if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) return false;
    if (fs.readdirSync(directoryPath).length > 0) return false;

    fs.rmdirSync(directoryPath);
    console.log(`[Limpieza] Carpeta vacia eliminada: ${logLabel}`);
    return true;
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

                const approvedPath = path.join(casePath, TEMP_APPROVED_SUBDIR);
                const pendingPath = path.join(casePath, TEMP_PENDING_SUBDIR);

                cleanupOldFilesInDirectory(approvedPath, now, caseDir, TEMP_APPROVED_SUBDIR);
                cleanupOldFilesInDirectory(pendingPath, now, caseDir, TEMP_PENDING_SUBDIR);
                cleanupOldFilesInDirectory(casePath, now, caseDir, 'legacy');

                removeDirectoryIfEmpty(approvedPath, `${caseDir}/${TEMP_APPROVED_SUBDIR}`);
                removeDirectoryIfEmpty(pendingPath, `${caseDir}/${TEMP_PENDING_SUBDIR}`);
                removeDirectoryIfEmpty(casePath, caseDir);
            });
        } catch (error) {
            console.error('[SYS Limpieza] Error en Cron', error);
        }
    }, 1000 * 60 * 60 * 12);

    return cleanupIntervalRef;
}
