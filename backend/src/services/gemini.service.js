import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_FILE = path.join(__dirname, '..', '..', 'output', 'error-logs.txt');

function logErrorToFile(filename, errorMsg, attempt) {
    try {
        const time = new Date().toISOString();
        let logLine = `[${time}] Archivo: ${filename} | Intento: ${attempt || 'Final'} | Detalle: ${errorMsg}\n`;
        fs.appendFileSync(LOGS_FILE, logLine, 'utf8');
    } catch(e) {}
}
dotenv.config();

const ai = new GoogleGenAI({});

// =============================================
// JSON SCHEMAS — Estrategia 2: Enforcement a nivel de motor
// Fuerza la estructura exacta de la respuesta.
// =============================================

/** Schema para la Corrida 1 (Organizer): Clasificación y Extracción */
const ORGANIZER_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        _reasoning: {
            type: Type.STRING,
            description: 'Internal chain-of-thought: Step by step explain what you found in the document — where you found the client name, what label it was under, where you found the DOL, how you identified the doctor(s), and how you classified the document type. This is for auditing purposes.'
        },
        alertaIntruso: {
            type: Type.BOOLEAN,
            description: 'true ONLY if the document clearly belongs to a completely different person than the official client. If the name is a variation of the same person (different order, abbreviations, middle name missing), set false.'
        },
        motivoIntruso: {
            type: Type.STRING,
            description: 'Brief explanation if alertaIntruso is true, otherwise null',
            nullable: true
        },
        tipoDocumento: {
            type: Type.STRING,
            description: 'Document classification',
            enum: ['Medical Record', 'Bill']
        },
        nombreCliente: {
            type: Type.STRING,
            description: 'Client/patient name exactly as written in the document. This field should almost ALWAYS be found.'
        },
        dol: {
            type: Type.STRING,
            description: 'Date of Loss/Injury/Incident/Accident in YYYY-MM-DD format, or "Sin Fecha" if truly not present anywhere in the document'
        },
        nombrePaciente: {
            type: Type.STRING,
            description: 'Patient name exactly as written in the document (usually same as nombreCliente)'
        },
        quienEnvia: {
            type: Type.STRING,
            description: 'Facility, clinic, or provider that issued the document'
        },
        lineItems: {
            type: Type.ARRAY,
            description: 'Array of service/billing line items. Must contain at least 1 item.',
            items: {
                type: Type.OBJECT,
                properties: {
                    fecha: {
                        type: Type.STRING,
                        description: 'Service or billing date in YYYY-MM-DD format'
                    },
                    nombreDoctor: {
                        type: Type.STRING,
                        description: 'Treating physician name. Think: look for MD, DO, PA, NP, DC after names.',
                        nullable: true
                    },
                    procedimientoEjecutado: {
                        type: Type.STRING,
                        description: 'Medical Record only: procedure performed',
                        nullable: true
                    },
                    procedimientoFuturo: {
                        type: Type.STRING,
                        description: 'Medical Record only: future recommended procedure',
                        nullable: true
                    },
                    monto: {
                        type: Type.NUMBER,
                        description: 'Bill only: charge amount as a number (e.g. 1410.00). null for Medical Records.',
                        nullable: true
                    }
                },
                required: ['fecha']
            }
        }
    },
    required: ['_reasoning', 'alertaIntruso', 'tipoDocumento', 'nombreCliente', 'dol', 'nombrePaciente', 'quienEnvia', 'lineItems']
};

/** Schema para la Corrida 2 (QA Forense) */
const QA_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        edadCliente: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        },
        diagnostico: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        },
        limitacionesVidaDiaria: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        },
        recomendacionesFuturas: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        },
        diasIncapacidad: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        },
        hechos: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                source: { type: Type.STRING }
            },
            required: ['answer', 'source']
        }
    },
    required: ['edadCliente', 'diagnostico', 'limitacionesVidaDiaria', 'recomendacionesFuturas', 'diasIncapacidad', 'hechos']
};

// =============================================
// Configuración determinística — Estrategia 1
// temperature: 0 → máxima consistencia entre ejecuciones
// topP: 0.1 → restringe el vocabulario a las opciones más probables
// topK: 1 → solo considera el token más probable en cada paso
// =============================================
const DETERMINISTIC_CONFIG = {
    temperature: 0.0,
    topP: 0.1,
    topK: 1,
};

export class GeminiService {
    /**
     * CORRIDA 1: Organizer — Clasificación y extracción de datos estructurados.
     * NO incluye QA. Solo organizer puro.
     */
    static async extractDataFromDocument(fileBuffer, mimeType, filename, targetModel, officialClientName, officialDol, onProgress, focusPages) {
        try {
            const filePart = {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            // Si hay páginas específicas, inyectar instrucción de enfoque
            const pageInstruction = focusPages 
                ? `\n        ⚠️ CRITICAL PAGE FOCUS: Analyze ONLY page(s) ${focusPages} of this document. IGNORE all other pages. Extract data EXCLUSIVELY from the specified page(s).\n`
                : '';

            const prompt = `
        You are a forensic medical document analyst. You MUST use chain-of-thought reasoning.
        ${pageInstruction}
        AUTHORIZED BATCH CONTEXT:
        - OFFICIAL CASE OWNER / CLIENT: ${officialClientName}
        - DATE OF LOSS (DOL): ${officialDol}

        ═══════════════════════════════════════════════
        CHAIN OF THOUGHT — MANDATORY REASONING PROCESS
        ═══════════════════════════════════════════════
        Before filling ANY field, you MUST think step by step in the "_reasoning" field:

        STEP 1 — FIND THE CLIENT/PATIENT NAME:
        Scan the ENTIRE document for these labels (they ALL refer to the same person):
        "Patient", "Patient Name", "Client", "Claimant", "Insured", "Member", "Member Name",
        "Subscriber", "Injured Party", "Injured Worker", "Applicant", "Name", "Nombre".
        The client name is ALMOST ALWAYS present in medical documents. Search headers, footers,
        patient info sections, billing sections, and cover pages. If after exhaustive search you
        truly cannot find it, THEN flag it — but this should be extremely rare.
        Write in _reasoning: "Found client name '[NAME]' under label '[LABEL]' in [LOCATION]"

        STEP 2 — FIND THE DATE OF LOSS (DOL):
        Search the ENTIRE document for ANY of these labels:
        "Date of Loss", "DOL", "Date of Injury", "DOI", "Date of Accident", "DOA",
        "Accident Date", "Injury Date", "Incident Date", "Date of Incident",
        "Fecha del accidente", "Fecha de lesión".
        Write in _reasoning: "Found DOL '[DATE]' under label '[LABEL]' in [LOCATION]" or "DOL not found after searching all sections"

        STEP 3 — IDENTIFY DOCUMENT TYPE:
        Is it a Medical Record (clinical notes, reports, MRI results, consultation notes)
        or a Bill (invoice, statement, charges, CPT codes with dollar amounts)?
        Write in _reasoning: "Document is a [TYPE] because [EVIDENCE]"

        STEP 4 — FIND THE DOCTOR / PROVIDER:
        Look for names followed by: M.D., MD, D.O., DO, PA, PA-C, NP, DC, DPM, DDS.
        Also check: "Treating Physician", "Provider", "Attending", "Referring", "Ordering".
        Write in _reasoning: "Found doctor '[NAME]' with credential '[CREDENTIAL]' in [LOCATION]"

        STEP 5 — EXTRACT LINE ITEMS:
        For each service date / doctor / charge combination, create a separate lineItem.

        ═══════════════════════════════════════════════
        EXTRACTION RULES
        ═══════════════════════════════════════════════

        INTRUDER DETECTION:
        - Extract "nombreCliente" and "nombrePaciente" EXACTLY as written. Do NOT normalize.
        - Set alertaIntruso = true ONLY if the person is CLEARLY a completely different individual.
        - Name variations (order, abbreviations, middle names) are NOT intruders.
        
        LINE ITEMS:
        - If a document has MULTIPLE dates, doctors, or charges → split into MULTIPLE lineItems.
        - ALWAYS extract ALL dates found, even if some dates have no amount.
        - lineItems must NEVER be empty.
        - For BILLS: Extract monto as a raw number (e.g. 1410.00). Leave procedures as null.
          IMPORTANT: If a bill has multiple dates but only ONE charge amount, assign the monto
          to the line item where the charge actually appears, and set monto = null for the other
          dates. Do NOT put 0 or 0.00 — use null when there is no charge for that date.
          Example: 3 dates, 1 charge of $1410 on the first date → lineItems should be:
          [{ fecha: "2025-10-15", monto: 1410.00 }, { fecha: "2025-10-29", monto: null }, { fecha: "2026-03-11", monto: null }]
        - For MEDICAL RECORDS: Extract procedures. Leave monto as null.

        DOL:
        - If none of the DOL-related labels are found anywhere, return "Sin Fecha".
      `;

            const MAX_RETRIES = 50;
            let attempt = 0;

            while (attempt < MAX_RETRIES) {
                try {
                    console.log(`[Gemini - Organizer] Analizando ${filename}... (Intento ${attempt + 1}/${MAX_RETRIES}) usando ${targetModel}`);
                    const response = await ai.models.generateContent({
                        model: targetModel,
                        contents: [prompt, filePart],
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: ORGANIZER_SCHEMA,
                            ...DETERMINISTIC_CONFIG,
                        },
                    });
                    return JSON.parse(response.text);
                } catch (apiError) {
                    attempt++;
                    console.error(`[Error Gemini] Intento ${attempt} fallido para ${filename}:`, apiError.message);
                    logErrorToFile(filename, apiError.message, attempt);
                    if (onProgress) onProgress(attempt);
                    if (attempt >= MAX_RETRIES) {
                        console.error(`[Error Gemini] Abortando: Límite de ${MAX_RETRIES} reintentos.`);
                        return null;
                    }
                    await new Promise(res => setTimeout(res, 5000));
                }
            }
        } catch (error) {
            console.error(`[Error General] Fallo crítico al procesar ${filename}:`, error.message);
            logErrorToFile(filename, error.message, 'Critic');
            return null;
        }
    }

    /**
     * CORRIDA 2: QA Forense — Análisis profundo de Medical Records APROBADOS.
     * Se ejecuta desde el Medical Extractor como segunda pasada.
     * Cada campo QA devuelve {answer, source} para trazabilidad.
     */
    static async extractQAFromDocument(fileBuffer, mimeType, filename, targetModel, onProgress) {
        try {
            const filePart = {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            const prompt = `
        You are a strict medical records analyst. Your job is to extract specific answers EXCLUSIVELY from this medical document.
        GOLDEN RULE: Do NOT act as a doctor, do NOT guess, do NOT assume, do NOT fabricate answers.
        If the exact answer is not clearly in the document, you MUST answer "Not Specified in Document".

        For each field, provide an object with "answer" and "source" keys.
        The "source" must indicate the page number (if visible) and the section/area where the info was found.
        If page numbers are not visible, describe the location (e.g. "Top of document, Patient Info header").

        Fields to extract:
        - edadCliente: Patient age
        - diagnostico: Medical diagnosis(es)
        - limitacionesVidaDiaria: Daily life limitations from the accident
        - recomendacionesFuturas: Future medical recommendations/treatments
        - diasIncapacidad: Disability days, days off work
        - hechos: How the accident happened based on what is discussed in this report

        Be as detailed as possible using ONLY what is in the document.
      `;

            const MAX_RETRIES = 10;
            let attempt = 0;

            while (attempt < MAX_RETRIES) {
                try {
                    console.log(`[Gemini - QA] Analizando ${filename}... (Intento ${attempt + 1}/${MAX_RETRIES}) usando ${targetModel}`);
                    const response = await ai.models.generateContent({
                        model: targetModel,
                        contents: [prompt, filePart],
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: QA_SCHEMA,
                            ...DETERMINISTIC_CONFIG,
                        },
                    });
                    return JSON.parse(response.text);
                } catch (apiError) {
                    attempt++;
                    logErrorToFile(filename, apiError.message, `QA-${attempt}`);
                    if (onProgress) onProgress(attempt);
                    if (attempt >= MAX_RETRIES) return null;
                    await new Promise(res => setTimeout(res, 3000));
                }
            }
        } catch (error) {
            logErrorToFile(filename, error.message, 'QA-Critic');
            return null;
        }
    }
}
