"use client";

import { PlayCircle } from 'lucide-react';

export default function OrganizerStartAction({
 files,
 isUploading,
 officialClient,
 officialDol,
 evalFilesForDuplicates,
}) {
 if (files.length === 0 || isUploading) return null;

 const isDisabled = !officialClient || !officialDol;

 return (
 <section className="actions-bar" style={{ justifyContent: 'center' }}>
 <button className="btn" onClick={evalFilesForDuplicates} disabled={isDisabled} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
 <PlayCircle size={16} />
 {isDisabled
 ? 'Llena Cliente y DOL para desbloquear'
 : 'Iniciar evaluacion IA de todos los documentos'}
 </button>
 </section>
 );
}
