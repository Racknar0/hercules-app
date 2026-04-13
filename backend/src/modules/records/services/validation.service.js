/**
 * ValidationService — Capa de validacion post-IA.
 * Se ejecuta despues de recibir la respuesta de Gemini y antes de guardar.
 */
export class ValidationService {
    static validate(rawData, officialClientName, officialDol) {
        let data = rawData;
        const flags = [];

        data = this.unwrapArray(data, flags);

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { _validationError: 'Respuesta no es un objeto JSON valido', _raw: rawData };
        }

        data = this.normalizeMontos(data, flags);
        data = this.dolFallback(data, officialDol, flags);
        data = this.fuzzyNameCheck(data, officialClientName, flags);
        data = this.validateDates(data, flags);
        data = this.validateLineItems(data, flags);

        if (flags.length > 0) {
            data._validationFlags = flags;
        }

        return data;
    }

    static unwrapArray(data, flags) {
        if (Array.isArray(data)) {
            if (data.length === 1) {
                flags.push('Auto-fix: Respuesta venia como array [{}], se extrajo el objeto.');
                return data[0];
            }
            if (data.length > 1) {
                flags.push(`Respuesta es un array con ${data.length} elementos. Se tomo el primero.`);
                return data[0];
            }
            flags.push('Respuesta es un array vacio.');
            return null;
        }
        return data;
    }

    static normalizeMontos(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems)) return data;

        data.lineItems = data.lineItems.map((item, idx) => {
            if (item.monto !== null && item.monto !== undefined) {
                const original = item.monto;
                const cleaned = String(item.monto).replace(/[$,\s]/g, '');
                const num = parseFloat(cleaned);

                if (Number.isNaN(num)) {
                    flags.push(`Monto no numerico en lineItem[${idx}]: "${original}" -> null`);
                    item.monto = null;
                } else if (num === 0) {
                    item.monto = null;
                } else {
                    item.monto = num;
                }
            }
            return item;
        });

        return data;
    }

    static dolFallback(data, officialDol, flags) {
        const dolVacio = !data.dol || data.dol === 'Sin Fecha' || data.dol.trim() === '';

        if (dolVacio) {
            data._dolMissing = true;
            flags.push('DOL no encontrado en documento — requiere revision manual.');
        }

        return data;
    }

    static fuzzyNameCheck(data, officialClientName, flags) {
        if (!data.nombreCliente || !officialClientName) return data;

        const normalizedExtracted = this.normalizeName(data.nombreCliente);
        const normalizedOfficial = this.normalizeName(officialClientName);

        const similarity = this.calculateSimilarity(normalizedExtracted, normalizedOfficial);
        const score = Math.round(similarity * 100);

        data._nameMatchScore = score;

        if (similarity < 0.4) {
            flags.push(`Nombre extraido "${data.nombreCliente}" tiene similitud muy baja (${score}%) con "${officialClientName}".`);
            if (!data.alertaIntruso) {
                data._possibleIntruder = true;
            }
        } else if (similarity < 0.7) {
            flags.push(`Nombre extraido "${data.nombreCliente}" difiere del oficial (${score}% similitud).`);
        }

        return data;
    }

    static normalizeDateString(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') return null;
        dateStr = dateStr.trim();
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        const monthMap = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
            ene: '01', abr: '04', ago: '08', dic: '12'
        };

        let match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (match) {
            let [_, m, d, y] = match;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        match = dateStr.match(/^([a-zA-Z]{3,})\s+(\d{1,2})[\s,]+(\d{4})$/);
        if (match) {
            let [_, m, d, y] = match;
            const mo = monthMap[m.toLowerCase().substring(0,3)];
            if(mo) {
                return `${y}-${mo}-${d.padStart(2, '0')}`;
            }
        }
        
        const parsed = new Date(dateStr);
        if (!Number.isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        return dateStr;
    }

    static validateDates(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems)) return data;

        let dolDateObj = null;
        if (data.dol && data.dol !== 'Sin Fecha' && data.dol.toLowerCase() !== 'sin fecha') {
            const originalDol = data.dol;
            data.dol = this.normalizeDateString(data.dol);
            if (originalDol !== data.dol && data.dol) {
                flags.push(`Auto-fix: DOL formato corregido de "${originalDol}" a "${data.dol}"`);
            }
            dolDateObj = new Date(`${data.dol}T00:00:00`);
        }

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        data.lineItems.forEach((item, idx) => {
            if (item.fecha) {
                const originalF = item.fecha;
                item.fecha = this.normalizeDateString(item.fecha);

                if (originalF !== item.fecha) {
                    flags.push(`Auto-fix: Formato de fecha de servicio corregido: "${originalF}" -> "${item.fecha}"`);
                }

                const dateObj = new Date(`${item.fecha}T00:00:00`);
                if (Number.isNaN(dateObj.getTime())) {
                    flags.push(`Fecha invalida o incomprensible en lineItem[${idx}]: "${item.fecha}"`);
                } else {
                    const year = dateObj.getFullYear();
                    if (year < 1950) {
                        flags.push(`Fecha hist\u00f3rica il\u00f3gica en lineItem[${idx}]: "${item.fecha}" (\u00bfsigo pasado?).`);
                    } else if (dateObj > now) {
                        flags.push(`Fecha futura en lineItem[${idx}]: "${item.fecha}". El servicio m\u00e9dico no puede ser posterior a hoy.`);
                    }

                    if (dolDateObj && !Number.isNaN(dolDateObj.getTime())) {
                        if (dateObj < dolDateObj) {
                            flags.push(`\u26a0\ufe0f Sospecha en lineItem[${idx}]: Fecha de servicio (${item.fecha}) es ANTERIOR a la Fecha de Accidente/DOL (${data.dol}).`);
                        }
                    }
                }
            }
        });

        return data;
    }

    static validateLineItems(data, flags) {
        if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
            flags.push('lineItems vacio o ausente — el documento puede requerir re-scan.');
            data.lineItems = data.lineItems || [];
        }
        return data;
    }

    static normalizeName(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[,.\-\(\)]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter((w) => w.length > 0)
            .sort()
            .join(' ');
    }

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

    static getBigrams(str) {
        const bigrams = [];
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.push(str.substring(i, i + 2));
        }
        return bigrams;
    }

    static compareExtractions(run1, run2) {
        const discrepancies = [];

        if ((run1.tipoDocumento || '') !== (run2.tipoDocumento || '')) {
            discrepancies.push({ field: 'tipoDocumento', label: 'Tipo de Documento', run1: run1.tipoDocumento || '—', run2: run2.tipoDocumento || '—' });
        }

        const nameSim = this.calculateSimilarity(
            this.normalizeName(run1.nombreCliente || ''),
            this.normalizeName(run2.nombreCliente || ''),
        );
        if (nameSim < 0.85) {
            discrepancies.push({ field: 'nombreCliente', label: 'Cliente', run1: run1.nombreCliente || '—', run2: run2.nombreCliente || '—' });
        }

        const dol1 = (run1.dol || 'Sin Fecha').trim();
        const dol2 = (run2.dol || 'Sin Fecha').trim();
        if (dol1 !== dol2) {
            discrepancies.push({ field: 'dol', label: 'Date of Loss', run1: dol1, run2: dol2 });
        }

        const senderSim = this.calculateSimilarity(
            this.normalizeName(run1.quienEnvia || ''),
            this.normalizeName(run2.quienEnvia || ''),
        );
        if (senderSim < 0.8) {
            discrepancies.push({ field: 'quienEnvia', label: 'Quien Envia', run1: run1.quienEnvia || '—', run2: run2.quienEnvia || '—' });
        }

        const items1 = run1.lineItems || [];
        const items2 = run2.lineItems || [];

        if (items1.length !== items2.length) {
            discrepancies.push({ field: 'lineItems.length', label: 'Cantidad de lineas', run1: `${items1.length} items`, run2: `${items2.length} items` });
        }

        const minLen = Math.min(items1.length, items2.length);
        for (let i = 0; i < minLen; i++) {
            const a = items1[i];
            const b = items2[i];

            if ((a.fecha || '') !== (b.fecha || '')) {
                discrepancies.push({ field: `lineItems[${i}].fecha`, label: `Linea ${i + 1}: Fecha`, run1: a.fecha || '—', run2: b.fecha || '—' });
            }

            const drSim = this.calculateSimilarity(
                this.normalizeName(a.nombreDoctor || ''),
                this.normalizeName(b.nombreDoctor || ''),
            );
            if (drSim < 0.8 && (a.nombreDoctor || b.nombreDoctor)) {
                discrepancies.push({ field: `lineItems[${i}].nombreDoctor`, label: `Linea ${i + 1}: Doctor`, run1: a.nombreDoctor || '—', run2: b.nombreDoctor || '—' });
            }

            const m1 = a.monto ?? null;
            const m2 = b.monto ?? null;
            if (m1 !== m2) {
                discrepancies.push({
                    field: `lineItems[${i}].monto`,
                    label: `Linea ${i + 1}: Monto`,
                    run1: m1 != null ? `$${m1}` : '—',
                    run2: m2 != null ? `$${m2}` : '—',
                });
            }
        }

        return { isConsistent: discrepancies.length === 0, discrepancies };
    }
}
