"use client";

import React, { useState, useRef, useEffect } from 'react';
import Select from 'react-select';
import { ArrowRight, CheckCircle2, Eye, FileText, PlayCircle, RotateCcw, Trash2, XCircle } from 'lucide-react';
import HttpService from '@/services/HttpService';
import { DATE_FORMAT_HINT, formatDateMMDDYYYY } from '@/helpers/dateFormat';
import { useOrganizerPageStore } from '@/store/useOrganizerPageStore';
import OrganizerHeader from './OrganizerHeader/OrganizerHeader';
import OrganizerUploadSection from './OrganizerUploadSection/OrganizerUploadSection';
import OrganizerProcessingSection from './OrganizerProcessingSection/OrganizerProcessingSection';
import OrganizerStartAction from './OrganizerStartAction/OrganizerStartAction';
import PendingConflictsSection from './PendingConflictsSection/PendingConflictsSection';
import LoteDocumentsSection from './LoteDocumentsSection/LoteDocumentsSection';
import EditablePencil from '../../shared/components/EditablePencil/EditablePencil';
import PostProcessingSection from './PostProcessingSection/PostProcessingSection';
import NoLoteSelectedState from './NoLoteSelectedState/NoLoteSelectedState';
import TrashSection from './TrashSection/TrashSection';

// API Base: en dev/prod usa NEXT_PUBLIC_API_URL; fallback local al backend Express
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const httpService = new HttpService();

function createQueuedFileKey(file, index) {
 return `${file.name}__${file.size}__${file.lastModified}__${index}`;
}

function normalizeFilename(value) {
 return String(value || '').trim().toLowerCase();
}

function parseSelectedLoteValue(selectedLote) {
 if (!selectedLote) return null;
 try {
 return JSON.parse(selectedLote.value);
 } catch {
 return null;
 }
}

const customSelectStyles = {
 control: (base, state) =>({
 ...base,
 background: 'rgba(255, 255, 255, 0.04)',
 borderColor: state.isFocused ? 'var(--h-primary)' : 'rgba(255, 255, 255, 0.1)',
 boxShadow: state.isFocused ? '0 0 0 1px var(--h-primary)' : 'none',
 color: 'white',
 borderRadius: '8px',
 padding: '4px',
 }),
 menu: (base) =>({
 ...base,
 background: '#111118',
 border: '1px solid rgba(255, 255, 255, 0.08)',
 borderRadius: '8px',
 }),
 option: (base, state) =>({
 ...base,
 background: state.isFocused ? 'rgba(var(--h-primary-rgb), 0.15)' : 'transparent',
 color: 'white',
 cursor: 'pointer',
 }),
 multiValue: (base) =>({
 ...base,
 background: 'rgba(var(--h-primary-rgb), 0.4)',
 borderRadius: '6px',
 }),
 multiValueLabel: (base) =>({ ...base, color: 'white' }),
 singleValue: (base) =>({ ...base, color: 'white' }),
 input: (base) =>({ ...base, color: 'white' }),
 placeholder: (base) =>({ ...base, color: '#6B7280' }),
};

export default function MedicalOrganizer() {
 const {
 files,
 isUploading,
 streamLogs,
 thinkingData,
 thinkingHistory,
 thinkingOpen,
 loteOptions,
 selectedLote,
 loteDocuments,
 pendientes,
 trashData,
 officialClient,
 officialDol,
 aiModel,
 enableQC,
 setFiles,
 setIsUploading,
 setStreamLogs,
 setThinkingData,
 setThinkingHistory,
 setThinkingOpen,
 setLoteOptions,
 setSelectedLote,
 setLoteDocuments,
 setPendientes,
 setTrashData,
 setOfficialClient,
 setOfficialDol,
 setAiModel,
 setEnableQC,
 } = useOrganizerPageStore();
 const [isDragging, setIsDragging] = useState(false);
 const [approvedDuplicateKeys, setApprovedDuplicateKeys] = useState({});

 // Terminal
 const terminalEndRef = useRef(null);

 // IA Thinking (razonamiento en tiempo real)
 // IA Thinking, lotes, documentos y campos del formulario se gestionan en store por feature

 // Timer de proceso
 const [elapsedSeconds, setElapsedSeconds] = useState(0);
 const timerRef = useRef(null);

 const fileInputRef = useRef(null);

 const queuedFileEntries = files.map((file, index) =>({
 key: createQueuedFileKey(file, index),
 file,
 fileName: file.name,
 normalizedName: normalizeFilename(file.name),
 }));

 const existingFileNames = new Set(
 [
 ...loteDocuments.map((doc) =>doc.archivoOrigen),
 ...pendientes.map((doc) =>doc.archivoOrigen),
 ]
 .map((name) =>normalizeFilename(name))
 .filter(Boolean),
 );

 const queuedSeenNames = new Set();
 const queueReview = queuedFileEntries.map((entry) =>{
 let duplicateReason = null;

 if (existingFileNames.has(entry.normalizedName)) {
 duplicateReason = 'Ya existe en este lote';
 } else if (queuedSeenNames.has(entry.normalizedName)) {
 duplicateReason = 'Duplicado dentro de la cola actual';
 }

 if (!queuedSeenNames.has(entry.normalizedName)) {
 queuedSeenNames.add(entry.normalizedName);
 }

 return {
 ...entry,
 isDuplicateCandidate: Boolean(duplicateReason),
 duplicateReason,
 };
 });

 const newQueueItems = queueReview.filter((entry) =>!entry.isDuplicateCandidate);
 const duplicateQueueItems = queueReview.filter((entry) =>entry.isDuplicateCandidate);
 const approvedDuplicateItems = duplicateQueueItems.filter((entry) =>approvedDuplicateKeys[entry.key]);
 const selectedQueueItems = [...newQueueItems, ...approvedDuplicateItems];

 useEffect(() =>{
 setApprovedDuplicateKeys((previous) =>{
 const validKeys = new Set(duplicateQueueItems.map((entry) =>entry.key));
 const next = Object.fromEntries(
 Object.entries(previous).filter(([key, value]) =>validKeys.has(key) && value),
 );

 const previousKeys = Object.keys(previous).filter((key) =>previous[key]).sort();
 const nextKeys = Object.keys(next).sort();
 const sameKeys = previousKeys.length === nextKeys.length
 && previousKeys.every((key, index) =>key === nextKeys[index]);
 if (sameKeys) {
 return previous;
 }

 return next;
 });
 }, [files, loteDocuments, pendientes]);

 // Timer: iniciar/parar cuando isUploading cambia
 useEffect(() =>{
 if (isUploading) {
 setElapsedSeconds(0);
 timerRef.current = setInterval(() =>{
 setElapsedSeconds((prev) =>prev + 1);
 }, 1000);
 } else {
 if (timerRef.current) {
 clearInterval(timerRef.current);
 timerRef.current = null;
 }
 }
 return () =>{
 if (timerRef.current) clearInterval(timerRef.current);
 };
 }, [isUploading]);

 const formatTime = (totalSeconds) =>{
 const mins = Math.floor(totalSeconds / 60);
 const secs = totalSeconds % 60;
 return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
 };

 // ===========================
 // FETCH DATA
 // ===========================
 const fetchProfiles = () =>{
 httpService
 .getData('/api/profiles')
 .then((res) =>{
 const data = res.data;
 if (data.profiles) {
 const opts = data.profiles.map((p) =>({
 value: JSON.stringify({
 nombre: p.labelCliente,
 dol: p.dol,
 }),
 label: ` ${p.labelCliente} | DOL: ${formatDateMMDDYYYY(p.dol)} (${p.documentCount} docs${p.pendientesCount >0 ? ` · ${p.pendientesCount} pend.` : ''})`,
 }));
 setLoteOptions(opts);
 }
 })
 .catch(console.error);
 };

 const fetchPendientes = (nombre, dol) =>{
 if (!nombre || !dol) {
 setPendientes([]);
 return;
 }
 httpService
 .getData(
 `/api/pendientes?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`,
 )
 .then((res) =>{
 const data = res.data;
 if (data.success) setPendientes(data.data);
 })
 .catch(console.error);
 };

 const fetchTrash = () =>{
 httpService
 .getData('/api/deleted-records')
 .then((res) =>{
 const data = res.data;
 if (data.success) setTrashData(data.list);
 })
 .catch(console.error);
 };

 const fetchLoteDocuments = (nombre, dol) =>{
 httpService
 .getData(
 `/api/lote-documents?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`,
 )
 .then((res) =>{
 const data = res.data;
 if (data.success) setLoteDocuments(data.data);
 })
 .catch(console.error);
 };

 const fetchThinkingHistory = (nombre, dol) =>{
 if (!nombre || !dol) {
 setThinkingHistory([]);
 setThinkingData(null);
 return;
 }

 httpService
 .getData(
 `/api/thinking?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`,
 )
 .then((res) =>{
 const data = res.data;
 if (data.success && data.data.length >0) {
 setThinkingHistory(data.data);
 setThinkingData(data.data[data.data.length - 1]);
 } else {
 setThinkingHistory([]);
 setThinkingData(null);
 }
 })
 .catch(console.error);
 };

 const fetchAll = () =>{
 fetchProfiles();
 fetchTrash();
 if (selectedLote) {
 const parsed = parseSelectedLoteValue(selectedLote);
 if (!parsed) return;
 fetchPendientes(parsed.nombre, parsed.dol);
 fetchLoteDocuments(parsed.nombre, parsed.dol);
 fetchThinkingHistory(parsed.nombre, parsed.dol);
 } else {
 setPendientes([]);
 }
 };

 useEffect(() =>{
 fetchProfiles();
 fetchTrash();
 }, []);

 useEffect(() =>{
 if (selectedLote) {
 const parsed = parseSelectedLoteValue(selectedLote);
 if (!parsed) return;
 setOfficialClient(parsed.nombre);
 setOfficialDol(parsed.dol);
 fetchLoteDocuments(parsed.nombre, parsed.dol);
 fetchPendientes(parsed.nombre, parsed.dol);
 fetchThinkingHistory(parsed.nombre, parsed.dol);
 } else {
 setLoteDocuments([]);
 setPendientes([]);
 setOfficialClient('');
 setOfficialDol('');
 setThinkingHistory([]);
 setThinkingData(null);
 }
 }, [selectedLote]);

 // ===========================
 // DRAG & DROP
 // ===========================
 const handleDragOver = (e) =>{
 e.preventDefault();
 setIsDragging(true);
 };
 const handleDragLeave = (e) =>{
 e.preventDefault();
 setIsDragging(false);
 };

 const traverseFileTree = (item, path = '') =>{
 return new Promise((resolve) =>{
 if (item.isFile) {
 item.file((file) =>resolve([file]));
 } else if (item.isDirectory) {
 const dirReader = item.createReader();
 dirReader.readEntries(async (entries) =>{
 let folderFiles = [];
 for (let i = 0; i < entries.length; i++) {
 folderFiles = folderFiles.concat(
 await traverseFileTree(
 entries[i],
 path + item.name + '/',
 ),
 );
 }
 resolve(folderFiles);
 });
 }
 });
 };

 const handleDrop = async (e) =>{
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
 if (newFiles.length >0) setFiles((prev) =>[...prev, ...newFiles]);
 };

 const handleFileSelect = (e) =>{
 if (e.target.files && e.target.files.length >0) {
 setFiles((prev) =>[...prev, ...Array.from(e.target.files)]);
 }
 };

 // Autoscroll terminal (inside the container only, not the page)
 useEffect(() =>{
 if (terminalEndRef.current) {
 const container = terminalEndRef.current.parentElement;
 if (container) container.scrollTop = container.scrollHeight;
 }
 }, [streamLogs]);

 // ===========================
 // UPLOAD IA
 // ===========================
 const evalFilesForDuplicates = async () =>{
 if (files.length === 0) return;

 const parsedSelectedLote = parseSelectedLoteValue(selectedLote);
 const resolvedOfficialClient = parsedSelectedLote?.nombre || officialClient;
 const resolvedOfficialDol = parsedSelectedLote?.dol || officialDol;

 if (!resolvedOfficialClient || !resolvedOfficialDol) {
 alert('Define el cliente y DOL del lote antes de procesar archivos.');
 return;
 }

 if (selectedQueueItems.length === 0) {
 alert('No hay archivos aprobados para procesar. Marca los posibles duplicados que quieres reescanear o agrega archivos nuevos.');
 return;
 }

 const processedKeySet = new Set(selectedQueueItems.map((entry) =>entry.key));
 const filesToUpload = selectedQueueItems.map((entry) =>entry.file);
 const waitingDuplicateCount = duplicateQueueItems.length - approvedDuplicateItems.length;
 let uploadSucceeded = false;

 setIsUploading(true);
 setStreamLogs(
 [
 `[SYS] ${newQueueItems.length} archivo(s) nuevos listos para procesar.`,
 approvedDuplicateItems.length >0
 ? `[SYS] ${approvedDuplicateItems.length} posible(s) duplicado(s) aprobados para re-scan manual.`
 : null,
 waitingDuplicateCount >0
 ? `[SYS] ${waitingDuplicateCount} posible(s) duplicado(s) quedan en espera de tu aprobacion en la cola.`
 : null,
 ].filter(Boolean),
 );

 const formData = new FormData();
 filesToUpload.forEach((file) =>formData.append('files', file));
 formData.append('officialClientName', resolvedOfficialClient);
 formData.append('officialDol', resolvedOfficialDol);
 formData.append('aiModel', aiModel);
 formData.append('enableQC', enableQC);

 try {
 const response = await fetch(`${API_BASE}/api/upload`, {
 method: 'POST',
 body: formData,
 });
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
 setStreamLogs((prev) =>[...prev, event.msg]);
 } else if (event.type === 'thinking') {
 setThinkingData(event);
 setThinkingHistory((prev) =>[...prev, event]);
 } else if (event.type === 'result') {
 if (event.data.error) {
 alert('Error: ' + event.data.error);
 } else {
 uploadSucceeded = true;
 setStreamLogs((prev) =>[
 ...prev,
 ` Batch processed: ${event.data.savedCount} saved, ${event.data.pendientesCount} flagged.`,
 ]);
 fetchAll();
 }
 }
 } catch (ex) {
 /* skip */
 }
 }
 }
 if (done) break;
 }
 } catch (error) {
 alert('Streaming error: ' + error.message);
 } finally {
 setIsUploading(false);
 if (uploadSucceeded) {
 setFiles((previousFiles) =>previousFiles.filter((file, index) =>!processedKeySet.has(createQueuedFileKey(file, index))));
 setApprovedDuplicateKeys((previous) =>{
 const next = { ...previous };
 processedKeySet.forEach((key) =>delete next[key]);
 return next;
 });
 }
 if (parsedSelectedLote) {
 fetchThinkingHistory(parsedSelectedLote.nombre, parsedSelectedLote.dol);
 }
 }
 };

 // ===========================
 // CANCELAR PROCESO
 // ===========================
 const cancelProcess = async () =>{
 try {
 await httpService.postData('/api/cancel', {});
 setStreamLogs((prev) =>[
 ...prev,
 '[SYS] Cancellation request sent...',
 ]);
 } catch (e) {}
 };

 // ===========================
 // NEW PROCESS (clear selected batch)
 // ===========================
 const handleNewProcess = () =>{
 if (
 !window.confirm(
 'Start a new process? This will only clear the selected batch so you can scan another case.',
 )
 )
 return;
 setSelectedLote(null);
 setStreamLogs([]);
 };

 // ===========================
 // ACCIONES PENDIENTES
 // ===========================
 const handleAssignPendiente = async (idx, selectedRun) =>{
 if (!selectedLote) {
 return alert(
 'Select a batch from the dropdown to assign this document.',
 );
 }
 const parsed = JSON.parse(selectedLote.value);
 try {
 const res = await httpService.postData('/api/assign-pendiente', {
 pendienteIndex: idx,
 nombre: parsed.nombre,
 dol: parsed.dol,
 selectedRun,
 });
 const data = res.data;
 if (data.success) fetchAll();
 } catch (e) {
 alert('Failed to assign');
 }
 };

 const handleDeletePendiente = async (idx) =>{
 if (!selectedLote) return alert('Select a batch first.');
 if (!window.confirm('Delete this document permanently?'))
 return;
 const parsed = JSON.parse(selectedLote.value);
 try {
 const res = await httpService.deleteData(
 `/api/pendiente?index=${idx}&nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`,
 );
 const data = res.data;
 if (data.success) fetchAll();
 } catch (e) {
 alert('Delete failed');
 }
 };

 // ===========================
 // ACCIONES DOCUMENTOS DE LOTE
 // ===========================
 const handleDeleteRecord = async (archivoOrigen) =>{
 if (!selectedLote) return;
 if (!window.confirm(`Delete ${archivoOrigen} from the batch?`)) return;
 const parsed = JSON.parse(selectedLote.value);
 try {
 const res = await httpService.deleteData(
 `/api/records?archivoOrigen=${encodeURIComponent(archivoOrigen)}&nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`,
 );
 const data = res.data;
 if (data.success) fetchAll();
 } catch (e) {
 alert('Delete failed');
 }
 };

 // ===========================
 // RESCAN DOCUMENTO CON IA
 // ===========================
 const [rescanningFile, setRescanningFile] = useState(null);
 const [pageRescanTarget, setPageRescanTarget] = useState(null); // archivoOrigen del doc con input abierto
 const [pageRescanInput, setPageRescanInput] = useState('');

 const handleRescanDoc = async (archivoOrigen, pages) =>{
 if (!selectedLote) return;
 if (
 !pages &&
 !window.confirm(
 `Re-scan "${archivoOrigen}" with AI? This will re-evaluate extraction.`,
 )
 )
 return;
 const parsed = JSON.parse(selectedLote.value);
 setRescanningFile(archivoOrigen);
 try {
 const body = {
 archivoOrigen,
 nombre: parsed.nombre,
 dol: parsed.dol,
 };
 if (pages) body.pages = pages;
 const res = await httpService.postData('/api/rescan-document', body);
 const data = res.data;
 if (data.success) {
 alert(
 ` Re-scan completed for ${archivoOrigen}${pages ? ` (Pages: ${pages})` : ''}. Data updated.`,
 );
 fetchAll();
 } else {
 alert(` Error: ${data.error}`);
 }
 } catch (e) {
 alert('Re-scan error: ' + e.message);
 } finally {
 setRescanningFile(null);
 setPageRescanTarget(null);
 setPageRescanInput('');
 }
 };

 // ===========================
 // RESTORE FROM TRASH
 // ===========================
 const handleRestoreRecord = async (trashIndex) =>{
 const entry = trashData[trashIndex];
 if (!entry) return;
 const targetNombre =
 entry.doc._fromLote ||
 (selectedLote ? JSON.parse(selectedLote.value).nombre : null);
 const targetDol =
 entry.doc._fromDol ||
 (selectedLote ? JSON.parse(selectedLote.value).dol : null);
 if (!targetNombre || !targetDol)
 return alert('Select a target batch.');
 try {
 const res = await httpService.postData('/api/restore-record', {
 trashIndex,
 nombre: targetNombre,
 dol: targetDol,
 });
 const data = res.data;
 if (data.success) fetchAll();
 } catch (e) {
 alert('Restore failed');
 }
 };

 // ===========================
 // PDF VIEWER
 // ===========================
 const openDocumentLocal = async (filename, loteOverride = null) =>{
 const lote = loteOverride || getCurrentLoteParams();

 if (lote?.nombre && lote?.dol) {
 try {
 const encodedNombre = encodeURIComponent(lote.nombre);
 const encodedDol = encodeURIComponent(lote.dol);
 const encodedArchivo = encodeURIComponent(filename);
 const previewUrl = `${API_BASE}/api/document-file?nombre=${encodedNombre}&dol=${encodedDol}&archivoOrigen=${encodedArchivo}`;
 const response = await fetch(previewUrl, { method: 'HEAD' });

 if (!response.ok) {
 alert('The document file is not available in temporary storage anymore.');
 return;
 }

 window.open(previewUrl, '_blank');
 return;
 } catch (error) {
 alert(`Could not open the document: ${error.message}`);
 return;
 }
 }

 window.open(`${API_BASE}/api/documents/${filename}`, '_blank');
 };

 const getFilenameFromDisposition = (contentDisposition) =>{
 if (!contentDisposition) return null;

 const utf8Match = contentDisposition.match(
 /filename\*=UTF-8''([^;]+)/i,
 );
 if (utf8Match?.[1]) {
 try {
 return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
 } catch {
 // fallback below
 }
 }

 const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
 return basicMatch?.[1] ?? null;
 };

 const triggerFileDownload = async (url, defaultFilename) =>{
 try {
 const response = await fetch(url);

 if (!response.ok) {
 let message = `Download error (HTTP ${response.status})`;
 const contentType = response.headers.get('content-type') || '';
 if (contentType.includes('application/json')) {
 const errorBody = await response.json();
 message = errorBody.error || message;
 }
 throw new Error(message);
 }

 const blob = await response.blob();
 const disposition = response.headers.get('content-disposition');
 const resolvedName =
 getFilenameFromDisposition(disposition) || defaultFilename;

 const objectUrl = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = objectUrl;
 link.download = resolvedName;
 document.body.appendChild(link);
 link.click();
 link.remove();
 URL.revokeObjectURL(objectUrl);
 } catch (error) {
 alert(`Could not download: ${error.message}`);
 }
 };

 // ===========================
 // DOWNLOAD EXCEL
 // ===========================
 const downloadFilteredExcel = async () =>{
 if (selectedLote && pendientes.length >0) {
 return alert(
 ` You cannot download the Excel while there are ${pendientes.length} pending document(s) for review in this batch. Assign or delete them first.`,
 );
 }
 let url = `${API_BASE}/api/download`;
 if (selectedLote) {
 const parsed = JSON.parse(selectedLote.value);
 url += `?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`;
 }

 await triggerFileDownload(
 url,
 selectedLote
 ? 'Master-Med-Records-Lote.xlsx'
 : 'Master-Med-Records.xlsx',
 );
 };

 const downloadNormalizedPack = async () =>{
 if (!selectedLote) return;

 const parsed = JSON.parse(selectedLote.value);
 const url = `${API_BASE}/api/download-normalized?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`;
 const safeNombre = (parsed.nombre || 'Case').replace(/[^a-zA-Z0-9_.-]+/g, '_');
 const safeDol = (parsed.dol || 'NO-DOL').replace(/[^a-zA-Z0-9_.-]+/g, '-');

 await triggerFileDownload(url, `${safeNombre}-${safeDol}.zip`);
 };

 // ===========================
 // RESET DB
 // ===========================
 const handleResetDB = async () =>{
 if (!window.confirm('DELETE the entire database permanently?'))
 return;
 try {
 await httpService.deleteData('/api/reset-db');
 setLoteDocuments([]);
 setLoteOptions([]);
 setSelectedLote(null);
 setPendientes([]);
 setTrashData([]);
 } catch (e) {
 console.error(e);
 }
 };

 const handleDeleteLote = async () =>{
 if (!selectedLote) return alert('Select a case first.');
 const parsed = JSON.parse(selectedLote.value);
 if (
 !window.confirm(
 `BORRAR el caso completo?\n\n ${parsed.nombre}\n DOL: ${parsed.dol}\n\nEsto eliminara TODO lo relacionado: documentos, pendientes, historial de thinking/auditoria, jobs IA, papelera y temporales.`,
 )
 )
 return;
 try {
 const url = `/api/lote?nombre=${encodeURIComponent(parsed.nombre)}&dol=${encodeURIComponent(parsed.dol)}`;
 const res = await httpService.deleteData(url);
 const data = res.data;
 if (data.success) {
 alert(
 ` Caso borrado: ${data.docsRemoved} docs, ${data.pendRemoved} pendientes, ${data.auditLogsRemoved || 0} logs, ${data.aiJobsRemoved || 0} jobs IA, ${data.trashRemoved} papelera, ${data.tempFilesRemoved || 0} temporales.`,
 );
 setSelectedLote(null);
 setStreamLogs([]);
 setLoteDocuments([]);
 setPendientes([]);
 fetchProfiles();
 fetchTrash();
 } else {
 alert('Error: ' + (data.error || 'Unknown'));
 }
 } catch (e) {
 alert('Error deleting case: ' + e.message);
 }
 };

 const getCurrentLoteParams = () =>{
 if (!selectedLote) return null;
 try {
 return JSON.parse(selectedLote.value);
 } catch {
 return null;
 }
 };

 const refreshCurrentLote = () =>{
 const lote = getCurrentLoteParams();
 if (!lote) return;
 fetchLoteDocuments(lote.nombre, lote.dol);
 fetchProfiles();
 };

 const updateDocumentField = async (archivoOrigen, field, value) =>{
 const lote = getCurrentLoteParams();
 if (!lote) return false;

 try {
 const res = await httpService.postData('/api/update-document-field', {
 nombre: lote.nombre,
 dol: lote.dol,
 archivoOrigen,
 field,
 value,
 });
 const data = res.data;
 if (!data.success) {
 alert(data.error || 'Could not update the field.');
 return false;
 }
 refreshCurrentLote();
 return true;
 } catch (e) {
 alert(`Error updating field: ${e.message}`);
 return false;
 }
 };

 const updateLineItemField = async (
 archivoOrigen,
 lineItemIndex,
 field,
 value,
 ) =>{
 const lote = getCurrentLoteParams();
 if (!lote) return false;

 try {
 const res = await httpService.postData('/api/update-lineitem-field', {
 nombre: lote.nombre,
 dol: lote.dol,
 archivoOrigen,
 lineItemIndex,
 field,
 value,
 });
 const data = res.data;
 if (!data.success) {
 alert(data.error || 'Could not update the line item.');
 return false;
 }
 refreshCurrentLote();
 return true;
 } catch (e) {
 alert(`Error updating line item: ${e.message}`);
 return false;
 }
 };

 const updateSenderGroup = async (oldSender, newSender) =>{
 const lote = getCurrentLoteParams();
 if (!lote) return false;

 try {
 const res = await httpService.postData('/api/update-sender-group', {
 nombre: lote.nombre,
 dol: lote.dol,
 oldSender,
 newSender,
 });
 const data = res.data;
 if (!data.success) {
 alert(data.error || 'Could not update the sender.');
 return false;
 }
 refreshCurrentLote();
 return true;
 } catch (e) {
 alert(`Error updating sender: ${e.message}`);
 return false;
 }
 };

 // ===========================
 // AGRUPAR DOCS DEL LOTE POR TIPO
 // ===========================
 const groupedByType = loteDocuments.reduce(
 (acc, doc) =>{
 const isMed =
 doc.tipoDocumento &&
 doc.tipoDocumento.toLowerCase().includes('medical');
 if (isMed) acc.medical.push(doc);
 else acc.bills.push(doc);
 return acc;
 },
 { medical: [], bills: [] },
 );

 // ===========================
 // AGRUPAR POR REMITENTE (SENDER)
 // ===========================
 const groupBySender = (docs) =>{
 const senderMap = {};
 docs.forEach((doc) =>{
 (doc.lineItems || []).forEach((item, lineItemIndex) =>{
 const sender = (doc.quienEnvia || 'Unknown Sender').trim() || 'Unknown Sender';
 if (!senderMap[sender]) {
 senderMap[sender] = { items: [], totalCost: 0 };
 }
 senderMap[sender].items.push({
 ...item,
 _parentDoc: doc,
 _lineItemIndex: lineItemIndex,
 });
 if (item.monto != null && !isNaN(Number(item.monto))) {
 senderMap[sender].totalCost += Number(item.monto);
 }
 });
 });
 // Sort items within each sender by document and then chronologically.
 // Esto evita desfases visuales cuando usamos rowSpan en tablas.
 Object.values(senderMap).forEach((group) =>{
 group.items.sort((a, b) =>{
 const docA = a._parentDoc?.archivoOrigen || '';
 const docB = b._parentDoc?.archivoOrigen || '';
 if (docA !== docB) return docA.localeCompare(docB);

 const da = a.fecha ? new Date(a.fecha) : new Date(0);
 const db = b.fecha ? new Date(b.fecha) : new Date(0);
 return da - db;
 });
 });
 // Sort senders alphabetically.
 const sorted = Object.entries(senderMap).sort(([a], [b]) =>a.localeCompare(b));
 return sorted; // [[senderName, {items, totalCost}], ...]
 };

 const medicalBySender = groupBySender(groupedByType.medical);
 const billsBySender = groupBySender(groupedByType.bills);

 // ===========================
 // RENDER
 // ===========================
 return (
 <div className="app-container">
 <header>
 <h1>Hercules IA</h1>
 <p>
 Master Historical Manager with duplicate review controls and local preview.
 </p>
 </header>

 <section
 className="actions-bar"
 style={{ flexWrap: 'wrap', gap: '0.5rem' }}
 >
 <div className="select-container">
 <Select
 instanceId="organizer-lote-select"
 inputId="organizer-lote-select-input"
 isClearable
 options={loteOptions}
 value={selectedLote}
 onChange={setSelectedLote}
 placeholder=" Select Batch (Client + DOL)..."
 styles={customSelectStyles}
 noOptionsMessage={() =>'No batches in Master DB'}
 />
 </div>
 <div
 style={{
 display: 'flex',
 gap: '0.4rem',
 flexWrap: 'wrap',
 alignItems: 'center',
 }}
 >
 <button
 className="btn"
 style={{
 background:
 'linear-gradient(135deg, #ff9800, #ff5722)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleNewProcess}
 title="Clear current selection to start another scan"
 >
 <PlayCircle size={14} />
 New Process
 </button>
 {selectedLote && (
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 100, 0, 0.8)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleDeleteLote}
 title="Borrar caso seleccionado"
 >
 <Trash2 size={14} />
 Borrar caso
 </button>
 )}
 <button
 className="btn btn-discard"
 style={{
 background: 'rgba(255, 0, 0, 0.7)',
 padding: '8px 14px',
 fontSize: '0.85rem',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={handleResetDB}
 title="Delete entire DB"
 >
 <RotateCcw size={14} />
 Reset DB
 </button>
 {isUploading && (
 <button
 className="btn"
 style={{
 background: '#ff0044',
 padding: '8px 14px',
 fontSize: '0.85rem',
 animation: 'pulseBadge 1s infinite',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 onClick={cancelProcess}
 >
 <XCircle size={14} />
 Cancel
 </button>
 )}
 </div>
 </section>

 {/* ===== FORMULARIO DE LOTE & DROPZONE ===== */}
 {!isUploading ? (
 <>
 {files.length >0 && (
 <section
 className="lote-formulario"
 style={{
 background: 'rgba(var(--h-primary-rgb), 0.05)',
 padding: '20px',
 borderRadius: '12px',
 marginBottom: '20px',
 border: '1px solid var(--h-primary)',
 }}
 >
 <h3
 style={{
 marginBottom: '15px',
 color: 'var(--h-primary)',
 }}
 >
 Official Folder Profiling
 </h3>
 <div
 style={{
 display: 'flex',
 gap: '15px',
 flexWrap: 'wrap',
 }}
 >
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label
 style={{
 display: 'block',
 marginBottom: '5px',
 }}
 >
 Client Name (Fixed):
 </label>
 <input
 type="text"
 value={officialClient}
 onChange={(e) =>
 setOfficialClient(e.target.value)
 }
 placeholder="Ej: CAMILO TORRES"
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 />
 </div>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label
 style={{
 display: 'block',
 marginBottom: '5px',
 }}
 >
 Date of Loss (Fixed) <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>({DATE_FORMAT_HINT})</span>:
 </label>
 <input
 type="text"
 value={officialDol}
 onChange={(e) =>
 setOfficialDol(e.target.value)
 }
 placeholder={DATE_FORMAT_HINT}
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 />
 </div>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <label
 style={{
 display: 'block',
 marginBottom: '5px',
 }}
 >
 AI Model:
 </label>
 <select
 value={aiModel}
 onChange={(e) =>
 setAiModel(e.target.value)
 }
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: '6px',
 background: 'rgba(255,255,255,0.1)',
 color: 'white',
 border: '1px solid rgba(255,255,255,0.2)',
 }}
 >
 <option
 value="gemini-3-flash-preview"
 style={{ color: 'black' }}
 >
 Flash Preview (Recommended)
 </option>
 <option
 value="gemini-3.1-flash-lite-preview"
 style={{ color: 'black' }}
 >
 Flash Lite 3.1 (Ultra Fast)
 </option>
 <option
 value="gemini-3.1-pro-preview"
 style={{ color: 'black' }}
 >
 Pro Preview (Intelligent)
 </option>
 </select>
 </div>
 </div>
 {/* QC Toggle */}
 <div
 style={{
 marginTop: '12px',
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 }}
 >
 <label
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '8px',
 cursor: 'pointer',
 userSelect: 'none',
 }}
 >
 <input
 type="checkbox"
 checked={enableQC}
 onChange={(e) =>
 setEnableQC(e.target.checked)
 }
 style={{
 width: '18px',
 height: '18px',
 accentColor: 'var(--h-primary)',
 cursor: 'pointer',
 }}
 />
 <span
 style={{
 color: enableQC
 ? 'var(--h-primary)'
 : '#6B7280',
 fontWeight: enableQC
 ? 'bold'
 : 'normal',
 transition: 'color 0.2s',
 }}
 >
 Quality Control (Double AI Review)
 </span>
 </label>
 {enableQC && (
 <span
 style={{
 fontSize: '0.75rem',
 color: '#ff9800',
 background: 'rgba(255,152,0,0.15)',
 padding: '3px 8px',
 borderRadius: '6px',
 }}
 >
 Doubles processing time
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
 onClick={() =>fileInputRef.current.click()}
 >
 <input
 type="file"
 multiple
 webkitdirectory="true"
 ref={fileInputRef}
 onChange={handleFileSelect}
 accept=".png,.jpg,.jpeg,.pdf,.webp"
 />
 <div className="drop-icon"></div>
 {files.length >0 ? (
 <div>
 <h3>
 {files.length} files captured in
 memory
 </h3>
 <p
 style={{
 marginTop: '10px',
 color: 'var(--accent)',
 fontStyle: 'italic',
 }}
 >
 {files
 .slice(0, 4)
 .map((f) =>f.name)
 .join(', ')}{' '}
 {files.length >4
 ? `and ${files.length - 4} more...`
 : ''}
 </p>
 </div>
 ) : (
 <div>
 <h3>
 Drop full folders or PDFs / images
 here
 </h3>
 <p>
 Our recursive logic will search for compatible
 documents inside the folder.
 </p>
 </div>
 )}
 </section>

 {files.length >0 && !isUploading && (
 <section
 style={{
 background: 'linear-gradient(135deg, rgba(var(--h-primary-rgb), 0.06), rgba(255,255,255,0.02))',
 border: '1px solid rgba(var(--h-primary-rgb), 0.18)',
 borderRadius: '12px',
 padding: '1rem 1.1rem',
 marginBottom: '1rem',
 }}
 >
 <div
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 gap: '0.8rem',
 flexWrap: 'wrap',
 marginBottom: duplicateQueueItems.length >0 ? '0.8rem' : 0,
 }}
 >
 <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
 <span
 style={{
 background: 'rgba(34,197,94,0.18)',
 color: '#bbf7d0',
 border: '1px solid rgba(34,197,94,0.35)',
 borderRadius: '999px',
 padding: '0.3rem 0.7rem',
 fontSize: '0.82rem',
 fontWeight: 700,
 }}
 >
 {newQueueItems.length} new file(s)
 </span>
 <span
 style={{
 background: 'rgba(251,191,36,0.18)',
 color: '#fde68a',
 border: '1px solid rgba(251,191,36,0.35)',
 borderRadius: '999px',
 padding: '0.3rem 0.7rem',
 fontSize: '0.82rem',
 fontWeight: 700,
 }}
 >
 {duplicateQueueItems.length} possible duplicate(s)
 </span>
 <span
 style={{
 background: 'rgba(var(--h-primary-rgb), 0.18)',
 color: 'var(--h-primary)',
 border: '1px solid rgba(var(--h-primary-rgb), 0.3)',
 borderRadius: '999px',
 padding: '0.3rem 0.7rem',
 fontSize: '0.82rem',
 fontWeight: 700,
 }}
 >
 {selectedQueueItems.length} ready to process
 </span>
 </div>
 <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
 Duplicate candidates are skipped unless you approve them below for re-scan.
 </span>
 </div>

 {duplicateQueueItems.length >0 && (
 <div
 style={{
 background: 'rgba(15, 23, 42, 0.45)',
 border: '1px solid rgba(251,191,36,0.2)',
 borderRadius: '10px',
 padding: '0.8rem',
 }}
 >
 <div style={{ color: '#fde68a', fontWeight: 700, marginBottom: '0.5rem' }}>
 Possible duplicates to review
 </div>
 <div style={{ display: 'grid', gap: '0.5rem' }}>
 {duplicateQueueItems.map((entry) =>(
 <label
 key={entry.key}
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 gap: '0.7rem',
 padding: '0.55rem 0.65rem',
 borderRadius: '8px',
 background: approvedDuplicateKeys[entry.key]
 ? 'rgba(251,191,36,0.14)'
 : 'rgba(255,255,255,0.03)',
 border: approvedDuplicateKeys[entry.key]
 ? '1px solid rgba(251,191,36,0.35)'
 : '1px solid rgba(255,255,255,0.06)',
 cursor: 'pointer',
 }}
 >
 <input
 type="checkbox"
 checked={Boolean(approvedDuplicateKeys[entry.key])}
 onChange={(event) =>{
 const { checked } = event.target;
 setApprovedDuplicateKeys((previous) =>({
 ...previous,
 [entry.key]: checked,
 }));
 }}
 style={{ marginTop: '0.15rem', accentColor: 'var(--h-primary)' }}
 />
 <div style={{ display: 'grid', gap: '0.18rem' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
 <span style={{ color: 'white', fontWeight: 600 }}>{entry.fileName}</span>
 {selectedLote && (
 <button
 type="button"
 onClick={(event) =>{
 event.preventDefault();
 event.stopPropagation();
 const lote = parseSelectedLoteValue(selectedLote);
 openDocumentLocal(entry.fileName, lote);
 }}
 style={{
 border: '1px solid rgba(var(--h-primary-rgb), 0.35)',
 background: 'rgba(var(--h-primary-rgb), 0.12)',
 color: 'var(--h-primary)',
 borderRadius: '999px',
 padding: '0.18rem 0.55rem',
 fontSize: '0.74rem',
 cursor: 'pointer',
 }}
 >
 Open existing file
 </button>
 )}
 </div>
 <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
 {entry.duplicateReason === 'Ya existe en este lote'
 ? 'Already exists in this batch'
 : 'Duplicate inside the current queue'}
 </span>
 <span style={{ color: approvedDuplicateKeys[entry.key] ? '#fde68a' : '#94a3b8', fontSize: '0.76rem' }}>
 {approvedDuplicateKeys[entry.key]
 ? 'Approved for re-scan in this run.'
 : 'Waiting for your approval.'}
 </span>
 </div>
 </label>
 ))}
 </div>
 </div>
 )}
 </section>
 )}
 </>
 ) : (
 <>
 {/* ===== BLOQUE DE PENSAMIENTO IA ===== */}
 {(thinkingData || thinkingHistory.length >0) && (
 <section
 style={{
 background:
 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(15, 23, 42, 0.6))',
 border: '1px solid rgba(168, 85, 247, 0.4)',
 borderRadius: '12px',
 padding: thinkingOpen
 ? '1.2rem'
 : '0.6rem 1.2rem',
 marginBottom: '1rem',
 position: 'relative',
 overflow: 'hidden',
 transition: 'padding 0.3s ease',
 }}
 >
 <div
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 height: '3px',
 background: isUploading
 ? 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)'
 : 'linear-gradient(90deg, #22c55e, #10b981)',
 backgroundSize: '200% 100%',
 animation: isUploading
 ? 'shimmer 2s ease-in-out infinite'
 : 'none',
 }}
 />
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 cursor: 'pointer',
 userSelect: 'none',
 }}
 onClick={() =>setThinkingOpen((prev) =>!prev)}
 >
 <span style={{ fontSize: '1.3rem' }}></span>
 <span
 style={{
 color: '#c084fc',
 fontWeight: '700',
 fontSize: '1.1rem',
 letterSpacing: '1px',
 }}
 >
 AI REASONING
 </span>
 <span
 style={{
 color: 'var(--text-muted)',
 fontSize: '0.9rem',
 marginLeft: 'auto',
 }}
 >
 {thinkingHistory.length} doc{thinkingHistory.length !== 1 ? 's' : ''}
 </span>
 <span
 style={{
 fontSize: '1.2rem',
 color: '#a78bfa',
 transition: 'transform 0.3s',
 transform: thinkingOpen
 ? 'rotate(180deg)'
 : 'rotate(0deg)',
 }}
 >
 ▼
 </span>
 </div>

 {thinkingOpen && (
 <div style={{ marginTop: '0.8rem' }}>
 {thinkingData && (
 <div
 style={{
 background: 'rgba(0,0,0,0.35)',
 borderRadius: '8px',
 padding: '1rem',
 marginBottom:
 thinkingHistory.length >1
 ? '0.8rem'
 : 0,
 }}
 >
 <div
 style={{
 display: 'flex',
 gap: '0.6rem',
 flexWrap: 'wrap',
 marginBottom: '0.7rem',
 }}
 >
 <span
 style={{
 background:
 'rgba(168,85,247,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#e9d5ff',
 }}
 >
 {thinkingData.filename}
 </span>
 <span
 style={{
 background:
 thinkingData.summary
 ?.tipo ===
 'Bill'
 ? 'rgba(251,191,36,0.3)'
 : 'rgba(34,197,94,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color:
 thinkingData.summary
 ?.tipo ===
 'Bill'
 ? '#fde68a'
 : '#bbf7d0',
 }}
 >
 {thinkingData.summary
 ?.tipo === 'Bill'
 ? ''
 : ''}{' '}
 {thinkingData.summary?.tipo}
 </span>
 <span
 style={{
 background:
 'rgba(6,182,212,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#a5f3fc',
 }}
 >
 {' '}
 {
 thinkingData.summary
 ?.cliente
 }
 </span>
 {thinkingData.summary
 ?.intruso && (
 <span
 style={{
 background:
 'rgba(239,68,68,0.4)',
 padding: '4px 12px',
 borderRadius:
 '20px',
 fontSize: '0.88rem',
 color: '#fca5a5',
 }}
 >
 INTRUSO
 </span>
 )}
 <span
 style={{
 background:
 'rgba(59,130,246,0.3)',
 padding: '4px 12px',
 borderRadius: '20px',
 fontSize: '0.88rem',
 color: '#bfdbfe',
 }}
 >
 {' '}
 {
 thinkingData.summary
 ?.items
 }{' '}
 items
 </span>
 </div>
 <div
 style={{
 fontSize: '0.95rem',
 color: '#d1d5db',
 lineHeight: '1.7',
 fontStyle: 'italic',
 maxHeight: '250px',
 overflowY: 'auto',
 whiteSpace: 'pre-wrap',
 scrollbarWidth: 'thin',
 }}
 >
 {thinkingData.reasoning}
 </div>
 </div>
 )}

 {thinkingHistory.length >1 && (
 <details
 style={{ marginTop: '0.5rem' }}
 >
 <summary
 style={{
 cursor: 'pointer',
 color: '#a78bfa',
 fontSize: '0.9rem',
 userSelect: 'none',
 }}
 >
 Ver historial completo (
 {thinkingHistory.length - 1}{' '}
 anteriores)
 </summary>
 <div
 style={{
 maxHeight: '400px',
 overflowY: 'auto',
 marginTop: '0.5rem',
 scrollbarWidth: 'thin',
 }}
 >
 {thinkingHistory
 .slice(0, -1)
 .reverse()
 .map((t, i) =>(
 <div
 key={i}
 style={{
 background:
 'rgba(0,0,0,0.2)',
 borderRadius:
 '6px',
 padding:
 '0.7rem',
 marginBottom:
 '0.5rem',
 fontSize:
 '0.88rem',
 color: '#9ca3af',
 }}
 >
 <strong
 style={{
 color: '#c084fc',
 }}
 >
 {t.filename}
 </strong>
 <span
 style={{
 marginLeft:
 '8px',
 color:
 t
 .summary
 ?.tipo ===
 'Bill'
 ? '#fde68a'
 : '#bbf7d0',
 }}
 >
 {
 t.summary
 ?.tipo
 }
 </span>
 {t.timestamp && (
 <span
 style={{
 marginLeft:
 '8px',
 color: '#6b7280',
 fontSize:
 '0.78rem',
 }}
 >
 {formatDateMMDDYYYY(t.timestamp)}
 </span>
 )}
 <div
 style={{
 marginTop:
 '4px',
 fontStyle:
 'italic',
 lineHeight:
 '1.5',
 whiteSpace:
 'pre-wrap',
 }}
 >
 {t.reasoning}
 </div>
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
 <span>Processing with Artificial Intelligence</span>
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '10px',
 }}
 >
 <span
 style={{
 fontFamily: 'monospace',
 fontSize: '1.1rem',
 color: 'var(--h-primary)',
 fontWeight: 'bold',
 letterSpacing: '2px',
 }}
 >
 {formatTime(elapsedSeconds)}
 </span>
 <span
 className="spinner"
 style={{
 width: '12px',
 height: '12px',
 borderWidth: '2px',
 }}
 ></span>
 </div>
 </div>
 <div className="terminal-body">
 {streamLogs.map((log, index) =>(
 <div key={index} className="terminal-line">
 {log}
 </div>
 ))}
 <div ref={terminalEndRef} />
 {!streamLogs.length && (
 <div className="terminal-line">
 Starting transfer interface...
 </div>
 )}
 <div className="terminal-line">
 <span style={{ color: 'transparent' }}>_</span>
 <span className="terminal-cursor"></span>
 </div>
 </div>
 </section>
 </>
 )}

 {/* ===== BOTN DE INICIAR IA ===== */}
 {files.length >0 && !isUploading && (
 <section
 className="actions-bar"
 style={{ justifyContent: 'center' }}
 >
 <button
 className="btn"
 onClick={evalFilesForDuplicates}
 disabled={!officialClient || !officialDol || selectedQueueItems.length === 0}
 style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
 >
 <PlayCircle size={16} />
 {!officialClient || !officialDol
 ? 'Fill in Client and DOL to unlock'
 : selectedQueueItems.length === 0
 ? 'Approve duplicate re-scans or add new files'
 : `Start AI Evaluation (${selectedQueueItems.length})`}
 </button>
 </section>
 )}

 {/* ===== ZONA DE ALERTAS / PENDIENTES ===== */}
 {pendientes.length >0 && (
 <section className="conflict-manager">
 <h3>
 Pending Documents for Review (
 {pendientes.length})
 </h3>
 <p
 style={{
 marginBottom: '1rem',
 color: 'var(--text-muted)',
 fontSize: '0.85rem',
 }}
 >
 Pending items from the selected batch. Assign or
 delete them.
 </p>
 <div className="table-wrapper">
 <table style={{ tableLayout: 'fixed', width: '100%' }}>
 <colgroup>
 <col style={{ width: '18%' }} />
 <col style={{ width: '12%' }} />
 <col style={{ width: '8%' }} />
 <col style={{ width: '10%' }} />
 <col style={{ width: '24%' }} />
 <col style={{ width: '12%' }} />
 <col style={{ width: '16%' }} />
 </colgroup>
 <thead>
 <tr>
 <th>Document</th>
 <th>Client</th>
 <th>DOL</th>
 <th>Type</th>
 <th>Reason</th>
 <th>Batch</th>
 <th style={{ textAlign: 'center' }}>
 Actions
 </th>
 </tr>
 </thead>
 <tbody>
 {pendientes.map((doc, idx) =>{
 const hasQC =
 doc._qc &&
 doc._qc.discrepancies &&
 doc._qc.discrepancies.length >0;
 const diffFields = hasQC
 ? doc._qc.discrepancies.map(
 (d) =>d.field,
 )
 : [];
 const isDiff = (field) =>
 diffFields.some(
 (f) =>
 f === field ||
 f.startsWith(field),
 );

 if (hasQC) {
 // QC DUAL ROW 
 const r1 = doc._qc.run1;
 const r2 = doc._qc.run2;
 const diffStyle = {
 background: 'rgba(248,113,113,0.12)',
 color: '#fecaca',
 fontWeight: 'bold',
 };
 const normalStyle = {};

 return [
 <tr
 key={`${idx}-r1`}
 style={{
 borderBottom: 'none',
 background:
 'rgba(0,200,83,0.04)',
 }}
 >
 <td
 rowSpan={2}
 style={{
 overflow: 'hidden',
 textOverflow:
 'ellipsis',
 whiteSpace: 'nowrap',
 verticalAlign: 'middle',
 }}
 title={doc.archivoOrigen}
 >
 <small
 className="doc-link"
 onClick={() =>
 openDocumentLocal(
 doc.archivoOrigen,
 )
 }
 >
 {doc.archivoOrigen}
 </small>
 <div
 style={{
 marginTop: '4px',
 }}
 >
 <span
 style={{
 fontSize:
 '0.6rem',
 padding:
 '2px 6px',
 borderRadius:
 '4px',
 background:
 'rgba(var(--h-primary-rgb),0.3)',
 color: '#cba6f7',
 }}
 >
 QC:{' '}
 {
 doc._qc
 .discrepancies
 .length
 }{' '}
 discrepancia(s)
 </span>
 </div>
 </td>
 <td
 style={{
 ...(isDiff(
 'nombreCliente',
 )
 ? diffStyle
 : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 <span
 style={{
 color: '#00c853',
 fontSize: '0.6rem',
 fontWeight: 'bold',
 }}
 >
 R1{' '}
 </span>
 {r1.nombreCliente || ''}
 </td>
 <td
 style={{
 ...(isDiff('dol')
 ? diffStyle
 : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 {formatDateMMDDYYYY(r1.dol) || ''}
 </td>
 <td
 style={{
 ...(isDiff(
 'tipoDocumento',
 )
 ? diffStyle
 : normalStyle),
 }}
 >
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background:
 'rgba(0,200,83,0.2)',
 color: '#00c853',
 }}
 >
 {r1.tipoDocumento ===
 'Medical Record'
 ? 'Record'
 : 'Bill'}
 </span>
 </td>
 <td
 rowSpan={2}
 style={{
 color: '#d1d5db',
 fontSize: '0.7rem',
 wordBreak: 'break-word',
 whiteSpace: 'normal',
 verticalAlign: 'middle',
 }}
 >
 {doc._qc.discrepancies.map(
 (d, di) =>(
 <div
 key={di}
 style={{
 marginBottom:
 '3px',
 padding:
 '2px 4px',
 background:
 'rgba(148,163,184,0.10)',
 border: '1px solid rgba(148,163,184,0.18)',
 borderRadius:
 '3px',
 }}
 >
 <strong
 style={{
 color: '#ff9800',
 }}
 >
 {d.label}:
 </strong>
 <br />
 <span
 style={{
 color: '#00c853',
 }}
 >
 R1: {d.run1}
 </span>
 {' vs '}
 <span
 style={{
 color: 'var(--h-primary)',
 }}
 >
 R2: {d.run2}
 </span>
 </div>
 ),
 )}
 </td>
 <td
 rowSpan={2}
 style={{
 fontSize: '0.7rem',
 color: 'var(--text-muted)',
 overflow: 'hidden',
 textOverflow:
 'ellipsis',
 whiteSpace: 'nowrap',
 verticalAlign: 'middle',
 }}
 title={doc._loteKey}
 >
 {doc._loteKey || ''}
 </td>
 <td
 rowSpan={2}
 style={{
 textAlign: 'center',
 verticalAlign: 'middle',
 }}
 >
 <div
 style={{
 display: 'flex',
 flexDirection:
 'column',
 gap: '4px',
 alignItems:
 'stretch',
 }}
 >
 <button
 className="btn-sm btn-open"
 onClick={() =>
 openDocumentLocal(
 doc.archivoOrigen,
 )
 }
 style={{
 fontSize:
 '0.7rem',
 padding:
 '3px 6px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <Eye size={12} />
 Ver Doc
 </button>
 <button
 className="btn-sm"
 onClick={() =>
 handleAssignPendiente(
 idx,
 'run1',
 )
 }
 disabled={
 !selectedLote
 }
 style={{
 fontSize:
 '0.7rem',
 padding:
 '3px 6px',
 background:
 'rgba(0,200,83,0.3)',
 color: '#00c853',
 border: '1px solid rgba(0,200,83,0.4)',
 borderRadius:
 '4px',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <CheckCircle2 size={12} />
 Approve R1
 </button>
 <button
 className="btn-sm"
 onClick={() =>
 handleAssignPendiente(
 idx,
 'run2',
 )
 }
 disabled={
 !selectedLote
 }
 style={{
 fontSize:
 '0.7rem',
 padding:
 '3px 6px',
 background:
 'rgba(var(--h-primary-rgb),0.3)',
 color: 'var(--h-primary)',
 border: '1px solid rgba(var(--h-primary-rgb),0.4)',
 borderRadius:
 '4px',
 cursor: 'pointer',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <CheckCircle2 size={12} />
 Approve R2
 </button>
 <button
 className="btn-sm btn-reject"
 onClick={() =>
 handleDeletePendiente(
 idx,
 )
 }
 style={{
 fontSize:
 '0.7rem',
 padding:
 '3px 6px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <Trash2 size={12} />
 Delete
 </button>
 </div>
 </td>
 </tr>,
 <tr
 key={`${idx}-r2`}
 style={{
 borderTop:
 '1px dashed rgba(var(--h-primary-rgb),0.3)',
 background:
 'rgba(var(--h-primary-rgb),0.04)',
 }}
 >
 <td
 style={{
 ...(isDiff(
 'nombreCliente',
 )
 ? diffStyle
 : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 <span
 style={{
 color: 'var(--h-primary)',
 fontSize: '0.6rem',
 fontWeight: 'bold',
 }}
 >
 R2{' '}
 </span>
 {r2.nombreCliente || ''}
 </td>
 <td
 style={{
 ...(isDiff('dol')
 ? diffStyle
 : normalStyle),
 fontSize: '0.8rem',
 }}
 >
 {formatDateMMDDYYYY(r2.dol) || ''}
 </td>
 <td
 style={{
 ...(isDiff(
 'tipoDocumento',
 )
 ? diffStyle
 : normalStyle),
 }}
 >
 <span
 style={{
 fontSize: '0.65rem',
 padding: '2px 6px',
 borderRadius: '4px',
 background:
 'rgba(var(--h-primary-rgb),0.2)',
 color: 'var(--h-primary)',
 }}
 >
 {r2.tipoDocumento ===
 'Medical Record'
 ? 'Record'
 : 'Bill'}
 </span>
 </td>
 </tr>,
 ];
 }

 // NORMAL ROW (sin QC) 
 return (
 <tr key={idx} className="conflict-row">
 <td
 style={{
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc.archivoOrigen}
 >
 <small
 className="doc-link"
 onClick={() =>
 openDocumentLocal(
 doc.archivoOrigen,
 )
 }
 >
 {doc.archivoOrigen}
 </small>
 </td>
 <td
 style={{
 color: '#ff9800',
 fontWeight: 'bold',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc.nombreCliente || ''}
 >
 {doc.nombreCliente || ''}
 </td>
 <td style={{ fontSize: '0.8rem' }}>
 {formatDateMMDDYYYY(doc.dol) || ''}
 </td>
 <td>
 {(() =>{
 const tipo = (
 doc.tipoDocumento || ''
 ).toLowerCase();
 const isMedical =
 tipo.includes(
 'medical',
 );
 const isBill =
 tipo.includes('bill');
 return (
 <span
 style={{
 fontSize:
 '0.65rem',
 padding:
 '2px 6px',
 borderRadius:
 '4px',
 background:
 isMedical
 ? 'rgba(var(--h-primary-rgb),0.3)'
 : isBill
 ? 'rgba(var(--h-primary-rgb),0.2)'
 : 'rgba(255,255,255,0.1)',
 color: isMedical
 ? '#cba6f7'
 : isBill
 ? 'var(--h-primary)'
 : '#888',
 }}
 >
 {isMedical
 ? 'Record'
 : isBill
 ? 'Bill'
 : '?'}
 </span>
 );
 })()}
 </td>
 <td
 style={{
 color: '#d1d5db',
 fontSize: '0.75rem',
 wordBreak: 'break-word',
 whiteSpace: 'normal',
 }}
 >
 <div className="reason-chip" style={{ marginBottom: 0 }}>{doc._pendienteMotivo}</div>
 </td>
 <td
 style={{
 fontSize: '0.7rem',
 color: 'var(--text-muted)',
 overflow: 'hidden',
 textOverflow: 'ellipsis',
 whiteSpace: 'nowrap',
 }}
 title={doc._loteKey}
 >
 {doc._loteKey || ''}
 </td>
 <td style={{ textAlign: 'center' }}>
 <div
 style={{
 display: 'flex',
 flexDirection: 'column',
 gap: '4px',
 alignItems: 'stretch',
 }}
 >
 <button
 className="btn-sm btn-open"
 onClick={() =>
 openDocumentLocal(
 doc.archivoOrigen,
 )
 }
 style={{
 fontSize: '0.7rem',
 padding: '3px 6px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <Eye size={12} />
 View
 </button>
 <button
 className="btn-sm btn-approve"
 onClick={() =>
 handleAssignPendiente(
 idx,
 )
 }
 disabled={!selectedLote}
 title={
 selectedLote
 ? `Assign to ${JSON.parse(selectedLote.value).nombre}`
 : 'Select a batch'
 }
 style={{
 fontSize: '0.7rem',
 padding: '3px 6px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <CheckCircle2 size={12} />
 Asignar
 </button>
 <button
 className="btn-sm btn-reject"
 onClick={() =>
 handleDeletePendiente(
 idx,
 )
 }
 style={{
 fontSize: '0.7rem',
 padding: '3px 6px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: '4px',
 }}
 >
 <Trash2 size={12} />
 Eliminar
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
 {selectedLote && loteDocuments.length >0 && (
 <div>
 <div className="date-group-container">
 <h2 className="date-header">
 Batch: {JSON.parse(selectedLote.value).nombre} |
 DOL: {formatDateMMDDYYYY(JSON.parse(selectedLote.value).dol)} {' '}
 {loteDocuments.length} documents
 </h2>
 <section className="results-split">
 {/* MEDICAL RECORDS - GROUPED BY SENDER */}
 <div className="results-half">
 <h2 style={{ borderBottom: 'none' }}>
 Medical Records{' '}
 <span className="badge-count">
 {groupedByType.medical.length}
 </span>
 </h2>
 <div className="table-wrapper">
 <table>
 <thead>
 <tr>
 <th>Client / Document</th>
 <th>Score</th>
 <th>Service Date <span style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 500 }}>({DATE_FORMAT_HINT})</span></th>
 <th>Doctor</th>
 <th>Procedure</th>
 </tr>
 </thead>
 <tbody>
 {medicalBySender.length === 0 && (
 <tr><td colSpan="5" style={{textAlign: 'center'}}>Empty</td></tr>
 )}
 {medicalBySender.map(([senderName, group]) =>{
 const seenDocs = new Set();
 return (
 <React.Fragment key={`mp-${senderName}`}>
 {/* Sender separator row */}
 <tr style={{
 background: 'linear-gradient(90deg, rgba(var(--h-primary-rgb),0.25), rgba(var(--h-primary-rgb),0.1))',
 borderLeft: '4px solid var(--h-primary)',
 }}>
 <td colSpan="5" style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '0.95rem',
 letterSpacing: '0.5px',
 }}>
 <span style={{color: '#cba6f7'}}>
 {' '}
 <EditablePencil
 value={senderName}
 onSave={(nextValue) =>
 updateSenderGroup(
 senderName,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </span>
 <span style={{
 marginLeft: '12px',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 }}>
 ({group.items.length} visit{group.items.length !== 1 ? 's' : ''})
 </span>
 </td>
 </tr>
 {group.items.map((item, iIdx) =>{
 const doc = item._parentDoc;
 const isFirstForDoc = !seenDocs.has(doc.archivoOrigen);
 if (isFirstForDoc) seenDocs.add(doc.archivoOrigen);
 const docItemsInGroup = group.items.filter(i =>i._parentDoc.archivoOrigen === doc.archivoOrigen);
 const docRowSpan = docItemsInGroup.length;
 const editableNameField = doc.nombrePaciente?.trim()
 ? 'nombrePaciente'
 : 'nombreCliente';
 const displayPersonName =
 doc.nombrePaciente?.trim() ||
 doc.nombreCliente ||
 '--';

 return (
 <tr key={`mp-${senderName}-${iIdx}`}>
 {isFirstForDoc && (
 <td rowSpan={docRowSpan}>
 <strong style={{ color: 'var(--accent)' }}>
 <EditablePencil
 value={displayPersonName}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 editableNameField,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </strong>
 <br />
 <small className="doc-link" onClick={() =>openDocumentLocal(doc.archivoOrigen)}>
 {doc.archivoOrigen}
 </small>
 {doc._dolMissing && (
 <div style={{marginTop: '4px'}}>
 <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,152,0,0.25)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.4)'}}>DOL not found</span>
 </div>
 )}
 <br />
 <button className="btn-sm btn-reject" onClick={() =>handleDeleteRecord(doc.archivoOrigen)} style={{marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px'}}><Trash2 size={12} />Delete</button>
 <button className="btn-sm" onClick={() =>handleRescanDoc(doc.archivoOrigen)} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(var(--h-primary-rgb),0.3)', color: 'var(--h-primary)', border: '1px solid rgba(var(--h-primary-rgb),0.4)', borderRadius: '4px', cursor: rescanningFile ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
 <RotateCcw size={12} />
 {rescanningFile === doc.archivoOrigen ? ' Scanning...' : ' AI Re-scan'}
 </button>
 <button className="btn-sm" onClick={() =>{ setPageRescanTarget(pageRescanTarget === doc.archivoOrigen ? null : doc.archivoOrigen); setPageRescanInput(''); }} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(var(--h-primary-rgb),0.3)', color: '#cba6f7', border: '1px solid rgba(var(--h-primary-rgb),0.4)', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
 <FileText size={12} />
 Pages
 </button>
 {pageRescanTarget === doc.archivoOrigen && (
 <div style={{marginTop: '4px', display: 'flex', gap: '3px', alignItems: 'center'}}>
 <input type="text" value={pageRescanInput} onChange={(e) =>setPageRescanInput(e.target.value)} onKeyDown={(e) =>{ if (e.key === 'Enter' && pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} placeholder="1-5, 3, 8" autoFocus style={{width: '70px', padding: '3px 5px', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(var(--h-primary-rgb),0.5)', outline: 'none'}} />
 <button onClick={() =>{ if (pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} disabled={!pageRescanInput.trim()} style={{padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(var(--h-primary-rgb),0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}><ArrowRight size={12} /></button>
 </div>
 )}
 </td>
 )}
 {isFirstForDoc && (
 <td rowSpan={docRowSpan} style={{textAlign: 'center'}}>
 {doc._nameMatchScore != null ? (
 <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
 <span style={{
 fontSize: '0.85rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px',
 background: doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.2)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.2)' : 'rgba(255,0,68,0.2)',
 color: doc._nameMatchScore >= 70 ? '#00c853' : doc._nameMatchScore >= 40 ? '#ff9800' : '#ff0044',
 border: `1px solid ${doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.4)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.4)' : 'rgba(255,0,68,0.4)'}`,
 }}>
 {doc._nameMatchScore}%
 </span>
 <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>
 {doc._nameMatchScore >= 70 ? ' Match' : doc._nameMatchScore >= 40 ? ' Review' : ' Possible intruder'}
 </span>
 </div>
 ) : (
 <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}></span>
 )}
 </td>
 )}
 <td>
 <EditablePencil
 value={item.fecha || ''}
 isDateField
 displayValue={item.fecha ? formatDateMMDDYYYY(item.fecha) : undefined}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'fecha',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="160px"
 />
 </td>
 <td>
 <EditablePencil
 value={item.nombreDoctor?.trim() || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'nombreDoctor',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="190px"
 />
 </td>
 <td>
 <small style={{ color: 'var(--text-muted)' }}>
 <EditablePencil
 value={item.procedimientoEjecutado || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'procedimientoEjecutado',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="260px"
 />
 </small>
 </td>
 </tr>
 );
 })}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* FINANCIAL BILLS - GROUPED BY SENDER */}
 <div className="results-half">
 <h2 style={{ borderBottom: 'none' }}>
 Financial Bills{' '}
 <span className="badge-count">
 {groupedByType.bills.length}
 </span>
 </h2>
 <div className="table-wrapper">
 <table>
 <thead>
 <tr>
 <th>Client Doc / Sender</th>
 <th>Score</th>
 <th>Date <span style={{ color: '#9ca3af', fontSize: '0.68rem', fontWeight: 500 }}>({DATE_FORMAT_HINT})</span></th>
 <th>Doctor</th>
 <th>Amount</th>
 </tr>
 </thead>
 <tbody>
 {billsBySender.length === 0 && (
 <tr><td colSpan="5" style={{textAlign: 'center'}}>Empty</td></tr>
 )}
 {billsBySender.map(([senderName, group]) =>{
 const seenDocs = new Set();
 return (
 <React.Fragment key={`bp-${senderName}`}>
 {/* Sender separator row */}
 <tr style={{
 background: 'linear-gradient(90deg, rgba(var(--h-primary-rgb),0.2), rgba(59,130,246,0.1))',
 borderLeft: '4px solid var(--h-primary)',
 }}>
 <td colSpan="4" style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '0.95rem',
 letterSpacing: '0.5px',
 }}>
 <span style={{color: 'var(--h-primary)'}}>
 {' '}
 <EditablePencil
 value={senderName}
 onSave={(nextValue) =>
 updateSenderGroup(
 senderName,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </span>
 <span style={{
 marginLeft: '12px',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 }}>
 ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
 </span>
 </td>
 <td style={{
 padding: '10px 14px',
 fontWeight: '700',
 fontSize: '1rem',
 color: '#f59e0b',
 textAlign: 'right',
 }}>
 {group.totalCost >0 ? `$${group.totalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}` : ''}
 </td>
 </tr>
 {group.items.map((item, iIdx) =>{
 const doc = item._parentDoc;
 const isFirstForDoc = !seenDocs.has(doc.archivoOrigen);
 if (isFirstForDoc) seenDocs.add(doc.archivoOrigen);
 const docItemsInGroup = group.items.filter(i =>i._parentDoc.archivoOrigen === doc.archivoOrigen);
 const docRowSpan = docItemsInGroup.length;
 const editableNameField = doc.nombrePaciente?.trim()
 ? 'nombrePaciente'
 : 'nombreCliente';
 const displayPersonName =
 doc.nombrePaciente?.trim() ||
 doc.nombreCliente ||
 '--';

 return (
 <tr key={`bp-${senderName}-${iIdx}`}>
 {isFirstForDoc && (
 <td rowSpan={docRowSpan}>
 <strong style={{ color: 'var(--accent)' }}>
 <EditablePencil
 value={displayPersonName}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 editableNameField,
 nextValue,
 )
 }
 inputWidth="220px"
 />
 </strong>
 <br />
 <strong style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
 (
 <EditablePencil
 value={doc.quienEnvia || ''}
 onSave={(nextValue) =>
 updateDocumentField(
 doc.archivoOrigen,
 'quienEnvia',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="220px"
 />
 )
 </strong>
 <br />
 <small className="doc-link" onClick={() =>openDocumentLocal(doc.archivoOrigen)}>
 {doc.archivoOrigen}
 </small>
 {doc._dolMissing && (
 <div style={{marginTop: '4px'}}>
 <span style={{fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,152,0,0.25)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.4)'}}>DOL not found</span>
 </div>
 )}
 <br />
 <button className="btn-sm btn-reject" onClick={() =>handleDeleteRecord(doc.archivoOrigen)} style={{marginTop: '5px', padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px'}}><Trash2 size={12} />Delete</button>
 <button className="btn-sm" onClick={() =>handleRescanDoc(doc.archivoOrigen)} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(var(--h-primary-rgb),0.3)', color: 'var(--h-primary)', border: '1px solid rgba(var(--h-primary-rgb),0.4)', borderRadius: '4px', cursor: rescanningFile ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
 <RotateCcw size={12} />
 {rescanningFile === doc.archivoOrigen ? ' Scanning...' : ' AI Re-scan'}
 </button>
 <button className="btn-sm" onClick={() =>{ setPageRescanTarget(pageRescanTarget === doc.archivoOrigen ? null : doc.archivoOrigen); setPageRescanInput(''); }} disabled={!!rescanningFile} style={{marginTop: '3px', padding: '2px 8px', fontSize: '0.7rem', background: 'rgba(var(--h-primary-rgb),0.3)', color: '#cba6f7', border: '1px solid rgba(var(--h-primary-rgb),0.4)', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
 <FileText size={12} />
 Pages
 </button>
 {pageRescanTarget === doc.archivoOrigen && (
 <div style={{marginTop: '4px', display: 'flex', gap: '3px', alignItems: 'center'}}>
 <input type="text" value={pageRescanInput} onChange={(e) =>setPageRescanInput(e.target.value)} onKeyDown={(e) =>{ if (e.key === 'Enter' && pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} placeholder="1-5, 3, 8" autoFocus style={{width: '70px', padding: '3px 5px', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(var(--h-primary-rgb),0.5)', outline: 'none'}} />
 <button onClick={() =>{ if (pageRescanInput.trim()) handleRescanDoc(doc.archivoOrigen, pageRescanInput.trim()); }} disabled={!pageRescanInput.trim()} style={{padding: '3px 6px', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(var(--h-primary-rgb),0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}><ArrowRight size={12} /></button>
 </div>
 )}
 </td>
 )}
 {isFirstForDoc && (
 <td rowSpan={docRowSpan} style={{textAlign: 'center'}}>
 {doc._nameMatchScore != null ? (
 <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
 <span style={{
 fontSize: '0.85rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px',
 background: doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.2)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.2)' : 'rgba(255,0,68,0.2)',
 color: doc._nameMatchScore >= 70 ? '#00c853' : doc._nameMatchScore >= 40 ? '#ff9800' : '#ff0044',
 border: `1px solid ${doc._nameMatchScore >= 70 ? 'rgba(0,200,83,0.4)' : doc._nameMatchScore >= 40 ? 'rgba(255,152,0,0.4)' : 'rgba(255,0,68,0.4)'}`,
 }}>
 {doc._nameMatchScore}%
 </span>
 <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>
 {doc._nameMatchScore >= 70 ? ' Match' : doc._nameMatchScore >= 40 ? ' Review' : ' Possible intruder'}
 </span>
 </div>
 ) : (
 <span style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}></span>
 )}
 </td>
 )}
 <td>
 <EditablePencil
 value={item.fecha || ''}
 isDateField
 displayValue={item.fecha ? formatDateMMDDYYYY(item.fecha) : undefined}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'fecha',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="160px"
 />
 </td>
 <td>
 <EditablePencil
 value={item.nombreDoctor?.trim() || ''}
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'nombreDoctor',
 nextValue,
 )
 }
 placeholder="--"
 inputWidth="190px"
 />
 </td>
 <td style={{ color: 'var(--h-primary)', fontWeight: 'bold' }}>
 <EditablePencil
 value={item.monto ?? ''}
 displayValue={
 item.monto != null
 ? `$${Number(item.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
 : '--'
 }
 type="number"
 onSave={(nextValue) =>
 updateLineItemField(
 doc.archivoOrigen,
 item._lineItemIndex,
 'monto',
 nextValue,
 )
 }
 inputWidth="130px"
 />
 </td>
 </tr>
 );
 })}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </section>

 </div>
 </div>
 )}

 {/* ===== POST PROCESSING ===== */}
 {selectedLote && loteDocuments.length >0 && (
 <section
 style={{
 background:
 'linear-gradient(135deg, rgba(var(--h-primary-rgb), 0.08), rgba(59, 130, 246, 0.08))',
 border: '1px solid rgba(var(--h-primary-rgb), 0.3)',
 borderRadius: '12px',
 padding: '1.5rem',
 marginTop: '1.5rem',
 }}
 >
 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.6rem',
 marginBottom: '1rem',
 }}
 >
 <span style={{ fontSize: '1.4rem' }}>{''}</span>
 <span
 style={{
 color: 'var(--h-primary)',
 fontWeight: '700',
 fontSize: '1.15rem',
 letterSpacing: '1px',
 }}
 >
 POST PROCESSING
 </span>
 <span
 style={{
 color: 'var(--text-muted)',
 fontSize: '0.85rem',
 marginLeft: 'auto',
 }}
 >
 {loteDocuments.length} approved docs
 </span>
 </div>
 <div
 style={{
 display: 'flex',
 gap: '1rem',
 flexWrap: 'wrap',
 }}
 >
 <button
 className="btn"
 style={{
 background:
 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
 padding: '10px 20px',
 fontSize: '0.9rem',
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 }}
 onClick={downloadFilteredExcel}
 >
 {''} Download File (Excel)
 </button>
 <button
 className="btn"
 style={{
 background:
 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
 padding: '10px 20px',
 fontSize: '0.9rem',
 borderRadius: '8px',
 display: 'flex',
 alignItems: 'center',
 gap: '0.5rem',
 }}
 onClick={downloadNormalizedPack}
 >
 {''} Download Normalized Pack
 </button>
 </div>
 <div
 style={{
 marginTop: '0.8rem',
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 lineHeight: '1.5',
 }}
 >
 <strong>Normalized Pack:</strong>Rename files to{' '}
 <code style={{ color: '#a78bfa' }}>
 [MM-DD-AAAA] - [Provider] - [$Amount].pdf
 </code>
 , convert images to PDF, and package everything into a ZIP.
 </div>
 </section>
 )}

 {/* No selected batch but batches are available */}
 {!selectedLote && loteOptions.length >0 && (
 <div
 style={{
 textAlign: 'center',
 padding: '3rem',
 color: 'var(--text-muted)',
 }}
 >
 <h3>
 Select a batch from the dropdown to view its
 documents
 </h3>
 <p>
 {loteOptions.length} batch(es) available in the
 database.
 </p>
 </div>
 )}

 {/* ===== TRASH ===== */}
 {trashData.length >0 && (
 <section
 style={{
 maxWidth: '1200px',
 margin: '2rem auto',
 border: '2px dashed #ff3333',
 padding: '1rem',
 borderRadius: '8px',
 background: 'rgba(255,0,0,0.05)',
 }}
 >
 <h2 style={{ color: '#ff3333', marginBottom: '1rem' }}>
 Recycle Bin
 </h2>
 <ul style={{ listStyle: 'none', padding: 0 }}>
 {trashData.map((t, idx) =>(
 <li
 key={idx}
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 background: 'rgba(0,0,0,0.5)',
 padding: '10px',
 marginBottom: '8px',
 borderRadius: '4px',
 }}
 >
 <div>
 <strong style={{ color: 'white' }}>
 {t.archivoOrigen}
 </strong>
 <div
 style={{
 fontSize: '0.8rem',
 color: 'var(--text-muted)',
 }}
 >
 Deleted:{' '}
 {formatDateMMDDYYYY(t.deletedAt)}
 {t.doc._fromLote &&
 ` | Batch: ${t.doc._fromLote}`}
 </div>
 </div>
 <button
 className="btn-sm"
 style={{
 background: 'var(--h-primary)',
 color: 'black',
 }}
 onClick={() =>handleRestoreRecord(idx)}
 >
 Restore
 </button>
 </li>
 ))}
 </ul>
 </section>
 )}
 </div>
 );
}



