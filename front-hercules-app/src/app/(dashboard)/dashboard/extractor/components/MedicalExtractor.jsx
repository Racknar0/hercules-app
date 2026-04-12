"use client";

import { useEffect, useRef } from 'react';
import HttpService from '@/services/HttpService';
import API_BASE from '@/helpers/apiBase';
import { formatDateMMDDYYYY } from '@/helpers/dateFormat';
import { useExtractorPageStore } from '@/store/useExtractorPageStore';
import BatchSelectorCard from './BatchSelectorCard/BatchSelectorCard';
import NoBatchSelectedState from './NoBatchSelectedState/NoBatchSelectedState';
import QAControlPanel from './QAControlPanel/QAControlPanel';
import QALogsTerminal from './QALogsTerminal/QALogsTerminal';
import NoResultsState from './NoResultsState/NoResultsState';
import QAStatsCards from './QAStatsCards/QAStatsCards';
import InputsTableSection from './InputsTableSection/InputsTableSection';
import ProvidersResultsSection from './ProvidersResultsSection/ProvidersResultsSection';
import ExecutiveSummarySection from './ExecutiveSummarySection/ExecutiveSummarySection';

const httpService = new HttpService();

function parseSelectedLote(selectedLote) {
 if (!selectedLote) return null;
 try {
 return JSON.parse(selectedLote.value);
 } catch {
 return null;
 }
}

export default function MedicalExtractor() {
 const {
 data,
 loading,
 qaStatus,
 isRunning,
 qaLogs,
 loteOptions,
 selectedLote,
 fileCheck,
 setData,
 setLoading,
 setQaStatus: setExtractorQaStatus,
 setIsRunning,
 setQaLogs,
 setLoteOptions,
 setSelectedLote,
 setFileCheck,
 } = useExtractorPageStore();
 const logsEndRef = useRef(null);

 const fetchLotes = async () =>{
 try {
 const res = await httpService.getData('/api/profiles');
 const json = res.data;
 const opts = (json.profiles || []).map(p =>({
 value: JSON.stringify({ nombre: p.labelCliente, dol: p.dol }),
 label: `${p.labelCliente} | DOL: ${formatDateMMDDYYYY(p.dol)} (${p.documentCount} docs${p.pendientesCount >0 ? ` · ${p.pendientesCount} pend.` : ''})`
 }));
 setLoteOptions(opts);
 } catch (e) {
 console.error(e);
 }
 };

 const fetchQAData = async (nombre, dol) =>{
 setLoading(true);
 try {
 let url = '/api/qa-data';
 if (nombre && dol) url += `?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`;
 let statusUrl = '/api/qa-status';
 if (nombre && dol) statusUrl += `?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`;
 const [dataRes, statusRes] = await Promise.all([
 httpService.getData(url),
 httpService.getData(statusUrl)
 ]);
 const json = dataRes.data;
 const status = statusRes.data;
 if (json.success) setData(json);
 setExtractorQaStatus(status);
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 const checkFiles = async (nombre, dol) =>{
 try {
 const res = await httpService.getData(`/api/check-files?nombre=${encodeURIComponent(nombre)}&dol=${encodeURIComponent(dol)}`);
 const json = res.data;
 setFileCheck(json);
 } catch (e) {
 setFileCheck({ available: 0, unavailable: 0, medicalCount: 0, error: true });
 }
 };

 useEffect(() =>{ fetchLotes(); fetchQAData(); }, []);

 useEffect(() =>{
 if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
 }, [qaLogs]);

 useEffect(() =>{
 const parsed = parseSelectedLote(selectedLote);

 if (parsed) {
 checkFiles(parsed.nombre, parsed.dol);
 fetchQAData(parsed.nombre, parsed.dol);
 } else {
 setFileCheck(null);
 fetchQAData();
 }
 }, [selectedLote]);

 const openDoc = (filename) =>{
 window.open(`${API_BASE}/api/documents/${filename}`, '_blank');
 };

 const startQARun = async () =>{
 const parsed = parseSelectedLote(selectedLote);

 if (!parsed) {
 alert('Select a batch first.');
 return;
 }

 if (qaStatus.pendientesCount >0) {
 alert(`There are ${qaStatus.pendientesCount} pending document(s). Resolve all in Organizer first.`);
 return;
 }

 if (fileCheck && fileCheck.available === 0 && fileCheck.totalMedical >0) {
 if (!window.confirm('Files in this batch are not cached (expired). AI will skip any that are missing. Continue?')) return;
 }

 setIsRunning(true);
 setQaLogs(['[QA] Starting QA analysis run...']);

 try {
 const response = await fetch(`${API_BASE}/api/run-qa`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ aiModel: 'gemini-3-flash-preview', nombre: parsed.nombre, dol: parsed.dol })
 });

 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let buffer = '';

 while (true) {
 const { done, value } = await reader.read();
 if (done) break;
 buffer += decoder.decode(value, { stream: true });
 const lines = buffer.split('\n');
 buffer = lines.pop() || '';
 for (const line of lines) {
 if (!line.trim()) continue;
 try {
 const parsedLine = JSON.parse(line);
 if (parsedLine.type === 'progress') {
 setQaLogs(prev =>[...prev, `[QA] ${parsedLine.msg}`]);
 } else if (parsedLine.type === 'result') {
 if (parsedLine.data.error) {
 setQaLogs(prev =>[...prev, `[ERROR] ${parsedLine.data.error}`]);
 } else {
 setQaLogs(prev =>[...prev, `[DONE] ${parsedLine.data.processed} processed, ${parsedLine.data.failed} failed`]);
 }
 }
 } catch (e) {
 console.error(e);
 }
 }
 }
 } catch (e) {
 setQaLogs(prev =>[...prev, `[ERROR] Connection failed: ${e.message}`]);
 } finally {
 setIsRunning(false);

 if (parsed) {
 fetchQAData(parsed.nombre, parsed.dol);
 }
 }
 };

 const cancelQA = async () =>{
 try {
 await httpService.postData('/api/cancel', {});
 setQaLogs(prev =>[...prev, '[SYS] Cancellation request sent...']);
 } catch (e) {
 console.error(e);
 }
 };

 const reRunQA = async () =>{
 const parsed = parseSelectedLote(selectedLote);
 if (!parsed) return alert('Select a batch first.');
 if (!window.confirm('Re-run? This will clear the current QA results for this batch and run again.')) return;

 try {
 await httpService.postData('/api/clear-qa', { nombre: parsed.nombre, dol: parsed.dol });

 setQaLogs([]);
 await fetchQAData(parsed.nombre, parsed.dol);
 await startQARun();
 } catch (e) {
 alert('Error: ' + e.message);
 }
 };

 if (loading && !selectedLote) {
 return (
 <div className="app-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
 <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1rem' }}></div>
 <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
 </div>
 );
 }

 const hasPendientes = qaStatus.pendientesCount >0;
 const hasResults = data && data.sampledCount >0 && data.providerNames && data.providerNames.length >0 &&
 Object.values(data.groupedByProvider || {}).some(recs =>recs.some(r =>r.hasQA));
 const filesUnavailable = fileCheck && fileCheck.available === 0 && fileCheck.totalMedical >0;

 return (
 <div className="app-container" style={{ marginTop: '1rem' }}>
 <header>
 <h1 style={{ color: 'var(--h-primary)' }}>Med Extractor QA</h1>
 <p>Independent run on approved Medical Records. Forensic analysis with source traceability.</p>
 </header>

 <BatchSelectorCard
 loteOptions={loteOptions}
 selectedLote={selectedLote}
 setSelectedLote={setSelectedLote}
 fileCheck={fileCheck}
 filesUnavailable={filesUnavailable}
 />

 {!selectedLote && <NoBatchSelectedState />}

 {selectedLote && (
 <>
 <QAControlPanel
 hasPendientes={hasPendientes}
 qaStatus={qaStatus}
 filesUnavailable={filesUnavailable}
 data={data}
 fileCheck={fileCheck}
 isRunning={isRunning}
 hasResults={hasResults}
 onStart={startQARun}
 onCancel={cancelQA}
 onReRun={reRunQA}
 />

 <QALogsTerminal qaLogs={qaLogs} logsEndRef={logsEndRef} />

 {!hasResults && !isRunning && !filesUnavailable && <NoResultsState />}

 {hasResults && (
 <>
 <QAStatsCards data={data} />
 <InputsTableSection data={data} openDoc={openDoc} />
 <ProvidersResultsSection data={data} openDoc={openDoc} />
 <ExecutiveSummarySection data={data} openDoc={openDoc} />
 </>
 )}
 </>
 )}
 </div>
 );
}


