export const EMPTY_QA_ANSWER = '-';

export function getQA(field) {
 if (!field) return { answer: EMPTY_QA_ANSWER, source: '' };
 if (typeof field === 'string') return { answer: field, source: '' };
 return {
 answer: field.answer || EMPTY_QA_ANSWER,
 source: field.source || ''
 };
}

export function hasMeaningfulAnswer(answer) {
 if (!answer) return false;
 const normalized = String(answer).trim().toLowerCase();
 if (!normalized || normalized === '-' || normalized === '—' || normalized === '') return false;
 return !normalized.includes('not specified') && !normalized.includes('not discussed');
}

export const QA_FIELDS = [
 { key: 'edadCliente', label: 'Edad del Cliente', color: '#ff9800' },
 { key: 'diagnostico', label: 'Diagnostico', color: 'var(--accent)' },
 { key: 'limitacionesVidaDiaria', label: 'Limitaciones Diarias', color: '#ff4d4d' },
 { key: 'recomendacionesFuturas', label: 'Tratamientos/Recomendaciones', color: 'var(--h-primary)' },
 { key: 'diasIncapacidad', label: 'Dias Off / Incapacidades', color: 'yellow' },
 { key: 'hechos', label: 'Hechos del Accidente', color: '#22C55E' }
];

export const STATUS_LABELS = {
 sampled: { text: 'Revisado', color: '#22C55E' },
 not_sampled: { text: 'No muestreado', color: '#888' },
 excluded_bill: { text: 'Excluido (Bill)', color: '#ff4d4d' },
 unavailable: { text: 'Archivo no disponible', color: '#ff9800' }
};

