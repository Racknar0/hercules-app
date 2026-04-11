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
 { key: 'edadCliente', label: 'Client Age', color: '#ff9800' },
 { key: 'diagnostico', label: 'Diagnosis', color: 'var(--accent)' },
 { key: 'limitacionesVidaDiaria', label: 'Daily Limitations', color: '#ff4d4d' },
 { key: 'recomendacionesFuturas', label: 'Treatments/Recommendations', color: 'var(--h-primary)' },
 { key: 'diasIncapacidad', label: 'Days Off / Disabilities', color: 'yellow' },
 { key: 'hechos', label: 'Accident Facts', color: '#22C55E' }
];

export const STATUS_LABELS = {
 sampled: { text: 'Reviewed', color: '#22C55E' },
 not_sampled: { text: 'Not sampled', color: '#888' },
 excluded_bill: { text: 'Excluded (Bill)', color: '#ff4d4d' },
 unavailable: { text: 'File not available', color: '#ff9800' }
};

