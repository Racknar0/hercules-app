"use client";

import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiEdit2, FiX } from 'react-icons/fi';

export default function EditablePencil({
 value,
 onSave,
 type = 'text',
 placeholder = '--',
 displayValue,
 inputWidth = '150px',
}) {
 const [isOpen, setIsOpen] = useState(false);
 const [draft, setDraft] = useState(value ?? '');
 const [isSaving, setIsSaving] = useState(false);
 const wrapperRef = useRef(null);

 useEffect(() =>{
 if (!isOpen) return;
 const handleOutsideClick = (event) =>{
 if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleOutsideClick);
 return () =>document.removeEventListener('mousedown', handleOutsideClick);
 }, [isOpen]);

 const handleSave = async () =>{
 if (isSaving) return;
 setIsSaving(true);
 const ok = await onSave(draft);
 setIsSaving(false);
 if (ok !== false) setIsOpen(false);
 };

 const shownValue =
 displayValue !== undefined
 ? displayValue
 : String(value ?? '').trim() || placeholder;

 return (
 <span
 ref={wrapperRef}
 style={{
 position: 'relative',
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 }}
 >
 <span>{shownValue}</span>
 <button
 type="button"
 onClick={(e) =>{
 e.stopPropagation();
 setDraft(value ?? '');
 setIsOpen((prev) =>!prev);
 }}
 title="Editar"
 style={{
 background: 'transparent',
 border: '1px solid rgba(255,255,255,0.25)',
 color: '#cbd5e1',
 borderRadius: '4px',
 width: '16px',
 height: '16px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 }}
 >
 <FiEdit2 size={10} />
 </button>
 {isOpen && (
 <div
 onClick={(e) =>e.stopPropagation()}
 style={{
 position: 'absolute',
 top: 'calc(100% + 4px)',
 left: 0,
 zIndex: 100,
 display: 'flex',
 alignItems: 'center',
 gap: '4px',
 background: 'rgba(15, 23, 42, 0.96)',
 border: '1px solid rgba(255,92,0,0.4)',
 borderRadius: '8px',
 padding: '4px',
 boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
 minWidth: inputWidth,
 }}
 >
 <input
 type={type}
 value={draft}
 autoFocus
 onChange={(e) =>setDraft(e.target.value)}
 onKeyDown={(e) =>{
 if (e.key === 'Enter') handleSave();
 if (e.key === 'Escape') setIsOpen(false);
 }}
 style={{
 width: '100%',
 minWidth: type === 'number' ? '90px' : '130px',
 padding: '4px 6px',
 borderRadius: '6px',
 border: '1px solid rgba(255,255,255,0.25)',
 background: 'rgba(255,255,255,0.08)',
 color: 'white',
 fontSize: '0.75rem',
 outline: 'none',
 }}
 />
 <button
 type="button"
 onClick={handleSave}
 disabled={isSaving}
 style={{
 background: 'rgba(0,200,83,0.25)',
 border: '1px solid rgba(0,200,83,0.6)',
 color: '#00c853',
 borderRadius: '5px',
 width: '20px',
 height: '20px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 }}
 >
 <FiCheck size={11} />
 </button>
 <button
 type="button"
 onClick={() =>setIsOpen(false)}
 style={{
 background: 'rgba(255,0,68,0.25)',
 border: '1px solid rgba(255,0,68,0.6)',
 color: '#ff4d4d',
 borderRadius: '5px',
 width: '20px',
 height: '20px',
 display: 'inline-flex',
 alignItems: 'center',
 justifyContent: 'center',
 cursor: 'pointer',
 padding: 0,
 }}
 >
 <FiX size={11} />
 </button>
 </div>
 )}
 </span>
 );
}
