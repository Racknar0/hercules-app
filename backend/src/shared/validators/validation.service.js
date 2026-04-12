/**
 * ValidationService — Capa de validación post-IA.
 * Se ejecuta DESPUÉS de recibir la respuesta de Gemini y ANTES de guardar.
 * No llama a ninguna API externa. Pura lógica local, instantánea, sin costo.
 */
export class ValidationService {

    /**
     * Punto de entrada principal. Recibe los datos crudos de Gemini y retorna
     * datos limpios con flags de validación si algo fue corregido o detectado.
     */
    static validate(rawData, officialClientName, officialDol) {
        let data = rawData;
        const flags = [];

        // Regla 1: Unwrap arrays anidados
        data = this.unwrapArray(data, flags);

        // Si después de unwrap no es un objeto válido, retornar con error
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { _validationError: 'Respuesta no es un objeto JSON válido', _raw: rawData };
        }

        // Regla 2: Normalizar montos a numbers
        data = this.normalizeMontos(data, flags);

        // Regla 3: DOL fallback desde el lote
        data = this.dolFallback(data, officialDol, flags);

        // Regla 4: Fuzzy match de nombres
        data = this.fuzzyNameCheck(data, officialClientName, flags);

        // Regla 5: Validar fechas
        data = this.validateDates(data, flags);

        // Regla 6: Validar que lineItems no esté vacío
        data = this.validateLineItems(data, flags);

        // Adjuntar flags al documento
        if (flags.length > 0) {
            data._validationFlags = flags;
        }

        return data;
    }

    // =============================================
    // REGLA 1: Unwrap arrays anidados
    // =============================================
    static unwrapArray(data, flags) {
        if (Array.isArray(data)) {
            if (data.length === 1) {
                flags.push('🔧 Auto-fix: Respuesta venía como array [{}], se extrajo el objeto.');
                return data[0];
            }
            if (data.length > 1) {
                flags.push(`⚠️ Respuesta es un array con ${data.length} elementos. Se tomó el primero.`);
                return data[0];
            }
            // Array vacío
            flags.push('❌ Respuesta es un array vacío.');
            return null;
        }
        return data;
    }

    // =============================================
    // REGLA 2: Normalizar montos a numbers
    // =============================================
    static normalizeMontos(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems)) return data;

        data.lineItems = data.lineItems.map((item, idx) => {
            if (item.monto !== null && item.monto !== undefined) {
                const original = item.monto;
                const cleaned = String(item.monto).replace(/[$,\s]/g, '');
                const num = parseFloat(cleaned);

                if (isNaN(num)) {
                    flags.push(`⚠️ Monto no numérico en lineItem[${idx}]: "${original}" → null`);
                    item.monto = null;
                } else if (num === 0) {
                    // $0.00 no es un monto real — convertir a null
                    item.monto = null;
                } else {
                    item.monto = num;
                }
            }
            return item;
        });

        return data;
    }

    // =============================================
    // REGLA 3: DOL ausente — Solo detectar, NO forzar
    // El usuario debe revisar manualmente y aprobar.
    // =============================================
    static dolFallback(data, officialDol, flags) {
        const dolVacio = !data.dol || data.dol === 'Sin Fecha' || data.dol.trim() === '';

        if (dolVacio) {
            data._dolMissing = true;
            flags.push(`📋 DOL no encontrado en documento — requiere revisión manual.`);
        }

        return data;
    }

    // =============================================
    // REGLA 4: Fuzzy match de nombres
    // =============================================
    static fuzzyNameCheck(data, officialClientName, flags) {
        if (!data.nombreCliente || !officialClientName) return data;

        const normalizedExtracted = this.normalizeName(data.nombreCliente);
        const normalizedOfficial = this.normalizeName(officialClientName);

        const similarity = this.calculateSimilarity(normalizedExtracted, normalizedOfficial);
        const score = Math.round(similarity * 100);

        data._nameMatchScore = score;

        if (similarity < 0.4) {
            flags.push(`🚨 Nombre extraído "${data.nombreCliente}" tiene similitud MUY BAJA (${score}%) con "${officialClientName}" — posible intruso.`);
            if (!data.alertaIntruso) {
                data._possibleIntruder = true;
            }
        } else if (similarity < 0.7) {
            flags.push(`⚠️ Nombre extraído "${data.nombreCliente}" difiere del oficial (${score}% similitud). Verificar manualmente.`);
        }
        // >= 70% → se considera match válido, no requiere flag

        return data;
    }

    // =============================================
    // REGLA 5: Validar fechas
    // =============================================
    static validateDates(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems)) return data;

        const now = new Date();
        const maxFutureDate = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

        data.lineItems.forEach((item, idx) => {
            if (item.fecha) {
                const date = new Date(item.fecha + 'T00:00:00'); // Forzar parse como local
                if (isNaN(date.getTime())) {
                    flags.push(`❌ Fecha inválida en lineItem[${idx}]: "${item.fecha}"`);
                } else if (date > maxFutureDate) {
                    flags.push(`⚠️ Fecha futura sospechosa en lineItem[${idx}]: "${item.fecha}"`);
                }
            }
        });

        return data;
    }

    // =============================================
    // REGLA 6: Validar lineItems no vacío
    // =============================================
    static validateLineItems(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
            flags.push('❌ lineItems vacío o ausente — el documento puede requerir re-scan.');
            data.lineItems = data.lineItems || [];
        }
        return data;
    }

    // =============================================
    // UTILIDADES
    // =============================================

    /**
     * Normaliza un nombre para comparación: lowercase, sin acentos,
     * sin puntuación, palabras ordenadas alfabéticamente.
     * "JUAREZ CEJA, JUAN LUIS" → "ceja juan juarez luis"
     * "Juan Luis Juarez Ceja"  → "ceja juan juarez luis"
     */
    static normalizeName(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')   // Eliminar acentos
            .replace(/[,.\-\(\)]/g, ' ')       // Reemplazar puntuación con espacio
            .replace(/\s+/g, ' ')              // Colapsar espacios múltiples
            .trim()
            .split(' ')
            .filter(w => w.length > 0)         // Eliminar vacíos
            .sort()                            // Ordenar → ignora el orden del nombre
            .join(' ');
    }

    /**
     * Coeficiente de Dice sobre bigramas.
     * Retorna un valor entre 0.0 (nada similar) y 1.0 (idéntico).
     */
    static calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (!str1 || !str2) return 0.0;

        const bigrams1 = this.getBigrams(str1);
        const bigrams2 = this.getBigrams(str2);

        if (bigrams1.length === 0 && bigrams2.length === 0) return 1.0;
        if (bigrams1.length === 0 || bigrams2.length === 0) return 0.0;

        let intersection = 0;
        const bigrams2Copy = [...bigrams2];

        for (const bigram of bigrams1) {
            const idx = bigrams2Copy.indexOf(bigram);
            if (idx !== -1) {
                intersection++;
                bigrams2Copy.splice(idx, 1);
            }
        }

        return (2 * intersection) / (bigrams1.length + bigrams2.length);
    }

    /**
     * Genera bigramas (pares de caracteres consecutivos) de un string.
     * "hola" → ["ho", "ol", "la"]
     */
    static getBigrams(str) {
        const bigrams = [];
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.push(str.substring(i, i + 2));
        }
        return bigrams;
    }

    // =============================================
    // QC: Comparación de dos extracciones (Run1 vs Run2)
    // =============================================

    /**
     * Compara dos resultados de extracción campo por campo.
     * Retorna { isConsistent, discrepancies: [{ field, run1, run2 }] }
     */
    static compareExtractions(run1, run2) {
        const discrepancies = [];

        // tipoDocumento — exacta
        if ((run1.tipoDocumento || '') !== (run2.tipoDocumento || '')) {
            discrepancies.push({
                field: 'tipoDocumento',
                label: 'Tipo de Documento',
                run1: run1.tipoDocumento || '—',
                run2: run2.tipoDocumento || '—'
            });
        }

        // nombreCliente — fuzzy (>85% = igual)
        const nameSim = this.calculateSimilarity(
            this.normalizeName(run1.nombreCliente || ''),
            this.normalizeName(run2.nombreCliente || '')
        );
        if (nameSim < 0.85) {
            discrepancies.push({
                field: 'nombreCliente',
                label: 'Cliente',
                run1: run1.nombreCliente || '—',
                run2: run2.nombreCliente || '—'
            });
        }

        // dol — exacta
        const dol1 = (run1.dol || 'Sin Fecha').trim();
        const dol2 = (run2.dol || 'Sin Fecha').trim();
        if (dol1 !== dol2) {
            discrepancies.push({
                field: 'dol',
                label: 'Date of Loss',
                run1: dol1,
                run2: dol2
            });
        }

        // quienEnvia — fuzzy (>80% = igual)
        const senderSim = this.calculateSimilarity(
            this.normalizeName(run1.quienEnvia || ''),
            this.normalizeName(run2.quienEnvia || '')
        );
        if (senderSim < 0.80) {
            discrepancies.push({
                field: 'quienEnvia',
                label: 'Quien Envía',
                run1: run1.quienEnvia || '—',
                run2: run2.quienEnvia || '—'
            });
        }

        // lineItems — comparar cantidad
        const items1 = run1.lineItems || [];
        const items2 = run2.lineItems || [];

        if (items1.length !== items2.length) {
            discrepancies.push({
                field: 'lineItems.length',
                label: 'Cantidad de líneas',
                run1: `${items1.length} items`,
                run2: `${items2.length} items`
            });
        }

        // Comparar lineItems uno a uno (hasta el mínimo de ambos)
        const minLen = Math.min(items1.length, items2.length);
        for (let i = 0; i < minLen; i++) {
            const a = items1[i];
            const b = items2[i];

            // fecha — exacta
            if ((a.fecha || '') !== (b.fecha || '')) {
                discrepancies.push({
                    field: `lineItems[${i}].fecha`,
                    label: `Línea ${i + 1}: Fecha`,
                    run1: a.fecha || '—',
                    run2: b.fecha || '—'
                });
            }

            // nombreDoctor — fuzzy
            const drSim = this.calculateSimilarity(
                this.normalizeName(a.nombreDoctor || ''),
                this.normalizeName(b.nombreDoctor || '')
            );
            if (drSim < 0.80 && (a.nombreDoctor || b.nombreDoctor)) {
                discrepancies.push({
                    field: `lineItems[${i}].nombreDoctor`,
                    label: `Línea ${i + 1}: Doctor`,
                    run1: a.nombreDoctor || '—',
                    run2: b.nombreDoctor || '—'
                });
            }

            // monto — exacta (numérico)
            const m1 = a.monto ?? null;
            const m2 = b.monto ?? null;
            if (m1 !== m2) {
                discrepancies.push({
                    field: `lineItems[${i}].monto`,
                    label: `Línea ${i + 1}: Monto`,
                    run1: m1 != null ? `$${m1}` : '—',
                    run2: m2 != null ? `$${m2}` : '—'
                });
            }

            // procedimientos: IGNORADOS intencionalmente (varían por parafraseo natural)
        }

        return {
            isConsistent: discrepancies.length === 0,
            discrepancies
        };
    }
}
