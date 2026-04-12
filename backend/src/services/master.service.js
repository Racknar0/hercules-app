import { prisma } from '../database/prismaClient.js';

const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || 'org_default_hercules_seed';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

function normalizeDateLike(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12, 0, 0));
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const mdy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\b.*)?$/);
  if (mdy) {
    const mm = Number(mdy[1]);
    const dd = Number(mdy[2]);
    const yyyy = Number(mdy[3]);
    const parsed = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const ymd = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (ymd) {
    const yyyy = Number(ymd[1]);
    const mm = Number(ymd[2]);
    const dd = Number(ymd[3]);
    const parsed = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0));
}

function dateToKey(dateValue) {
  const parsed = normalizeDateLike(dateValue);
  if (!parsed) return '';
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dolMatches(caseDol, dolInput) {
  const left = dateToKey(caseDol);
  const right = dateToKey(dolInput);
  if (left && right) return left === right;
  return String(dolInput || '').trim() === '' && !caseDol;
}

function mapIncomingDocType(tipoDocumento) {
  const value = String(tipoDocumento || '').toLowerCase();
  if (value.includes('bill')) return 'BILL';
  if (value.includes('medical')) return 'MEDICAL_RECORD';
  return 'OTHER';
}

function mapPrismaDocType(docType, fallback) {
  if (fallback) return fallback;
  if (docType === 'BILL') return 'Bill';
  if (docType === 'MEDICAL_RECORD') return 'Medical Record';
  return 'Other';
}

function normalizeLineItemInput(item) {
  if (!isObject(item)) return null;

  const amountNum = Number(item.monto);
  const amount = Number.isFinite(amountNum) ? amountNum : null;

  return {
    fecha: item.fecha || null,
    nombreDoctor: item.nombreDoctor || null,
    procedimientoEjecutado: item.procedimientoEjecutado || null,
    monto: amount,
  };
}

function mapLineItemsForCreate(lineItems) {
  return (Array.isArray(lineItems) ? lineItems : [])
    .map(normalizeLineItemInput)
    .filter(Boolean)
    .map((item) => ({
      serviceDate: normalizeDateLike(item.fecha),
      doctorName: item.nombreDoctor,
      procedureName: item.procedimientoEjecutado,
      amount: item.monto,
      raw: item,
    }));
}

function mapLineItemFromDb(lineItem) {
  const raw = isObject(lineItem.raw) ? lineItem.raw : {};

  return {
    ...raw,
    fecha: raw.fecha || dateToKey(lineItem.serviceDate) || null,
    nombreDoctor: raw.nombreDoctor ?? lineItem.doctorName ?? null,
    procedimientoEjecutado:
      raw.procedimientoEjecutado ?? lineItem.procedureName ?? null,
    monto: raw.monto ?? (lineItem.amount != null ? Number(lineItem.amount) : null),
  };
}

function buildApiDocument(doc, caseRecord) {
  const metadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
  const lineItems = (doc.lineItems || []).map(mapLineItemFromDb);

  return {
    ...metadata,
    archivoOrigen: doc.originalName,
    tipoDocumento: mapPrismaDocType(doc.docType, metadata.tipoDocumento),
    quienEnvia: doc.senderName || metadata.quienEnvia || '',
    nombreCliente: metadata.nombreCliente || caseRecord.clientName,
    dol: metadata.dol || dateToKey(caseRecord.dol) || '',
    lineItems,
    qa: metadata.qa,
    _loteNombre: caseRecord.clientName,
    _loteDol: dateToKey(caseRecord.dol) || '',
  };
}

async function getOrCreateDefaultOrganization() {
  const byId = await prisma.organization.findUnique({
    where: { id: DEFAULT_ORG_ID },
  });

  if (byId) return byId;

  const anyOrg = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (anyOrg) return anyOrg;

  return prisma.organization.create({
    data: {
      id: DEFAULT_ORG_ID,
      name: 'Hercules Default Organization',
      status: 'ACTIVE',
    },
  });
}

async function findCaseByNombreDol(nombre, dol) {
  const normalizedNombre = normalizeName(nombre);
  if (!normalizedNombre) return null;

  const org = await getOrCreateDefaultOrganization();
  const cases = await prisma.caseRecord.findMany({
    where: {
      organizationId: org.id,
      clientName: normalizedNombre,
    },
    orderBy: { createdAt: 'asc' },
  });

  return cases.find((item) => dolMatches(item.dol, dol)) || null;
}

async function getOrCreateCase(nombre, dol) {
  const normalizedNombre = normalizeName(nombre);
  const normalizedDol = normalizeDateLike(dol);

  if (!normalizedNombre) {
    throw new Error('Nombre de lote requerido');
  }

  const existing = await findCaseByNombreDol(normalizedNombre, dol);
  if (existing) return existing;

  const org = await getOrCreateDefaultOrganization();
  return prisma.caseRecord.create({
    data: {
      organizationId: org.id,
      clientName: normalizedNombre,
      dol: normalizedDol,
      status: 'OPEN',
    },
  });
}

async function loadDocumentsForCase(caseId) {
  return prisma.document.findMany({
    where: { caseId },
    include: {
      lineItems: {
        orderBy: { createdAt: 'asc' },
      },
      case: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function upsertDocumentFromPayload(caseRecord, incomingDoc) {
  const metadata = isObject(incomingDoc) ? { ...incomingDoc } : {};
  const archivoOrigen = String(incomingDoc?.archivoOrigen || '').trim();
  if (!archivoOrigen) return null;

  const lineItemsPayload = mapLineItemsForCreate(incomingDoc?.lineItems);

  const existing = await prisma.document.findFirst({
    where: {
      caseId: caseRecord.id,
      originalName: archivoOrigen,
    },
    include: {
      lineItems: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const commonData = {
    organizationId: caseRecord.organizationId,
    caseId: caseRecord.id,
    originalName: archivoOrigen,
    storageKey: incomingDoc?.storageKey || archivoOrigen,
    mimeType: incomingDoc?.mimeType || null,
    docType: mapIncomingDocType(incomingDoc?.tipoDocumento),
    senderName: incomingDoc?.quienEnvia || null,
    qaStatus: incomingDoc?.qa ? 'APPROVED' : 'PENDING',
    metadata,
  };

  if (!existing) {
    const created = await prisma.document.create({
      data: commonData,
    });

    if (lineItemsPayload.length > 0) {
      await prisma.lineItem.createMany({
        data: lineItemsPayload.map((item) => ({
          ...item,
          organizationId: caseRecord.organizationId,
          documentId: created.id,
        })),
      });
    }

    return created;
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id: existing.id },
      data: commonData,
    }),
    prisma.lineItem.deleteMany({
      where: { documentId: existing.id },
    }),
  ]);

  if (lineItemsPayload.length > 0) {
    await prisma.lineItem.createMany({
      data: lineItemsPayload.map((item) => ({
        ...item,
        organizationId: caseRecord.organizationId,
        documentId: existing.id,
      })),
    });
  }

  return existing;
}

async function listPendingRows(caseId) {
  return prisma.pendingReview.findMany({
    where: {
      caseId,
      status: 'OPEN',
    },
    orderBy: { createdAt: 'asc' },
  });
}

export class MasterService {
  static async getStats() {
    const [cases, documents, pendientes] = await Promise.all([
      prisma.caseRecord.count(),
      prisma.document.count(),
      prisma.pendingReview.count({ where: { status: 'OPEN' } }),
    ]);

    return { cases, documents, pendientes };
  }

  static async getLotes() {
    return this.getUniqueProfiles();
  }

  static async getUniqueProfiles() {
    const org = await getOrCreateDefaultOrganization();
    const cases = await prisma.caseRecord.findMany({
      where: { organizationId: org.id },
      include: {
        _count: {
          select: {
            documents: true,
            pendingReviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cases.map((item) => ({
      labelCliente: item.clientName,
      dol: dateToKey(item.dol),
      documentCount: item._count.documents,
      pendientesCount: item._count.pendingReviews,
      key: `${item.clientName}|${dateToKey(item.dol)}`,
    }));
  }

  static async getLoteDocuments(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return [];

    const docs = await loadDocumentsForCase(caseRecord.id);
    return docs.map((doc) => buildApiDocument(doc, caseRecord));
  }

  static async getAllDocumentsFlat() {
    const docs = await prisma.document.findMany({
      include: {
        lineItems: {
          orderBy: { createdAt: 'asc' },
        },
        case: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((doc) => buildApiDocument(doc, doc.case));
  }

  static async saveToLote(nombre, dol, documents) {
    const caseRecord = await getOrCreateCase(nombre, dol);

    for (const doc of documents || []) {
      await upsertDocumentFromPayload(caseRecord, doc);
    }

    return prisma.document.count({ where: { caseId: caseRecord.id } });
  }

  static async deleteDocFromLote(nombre, dol, archivoOrigen) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return null;

    const doc = await prisma.document.findFirst({
      where: {
        caseId: caseRecord.id,
        originalName: archivoOrigen,
      },
      include: {
        lineItems: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!doc) return null;

    const removedSnapshot = buildApiDocument({ ...doc, case: caseRecord }, caseRecord);

    await prisma.document.delete({ where: { id: doc.id } });

    const remaining = await prisma.document.count({ where: { caseId: caseRecord.id } });
    const pendRemaining = await prisma.pendingReview.count({ where: { caseId: caseRecord.id, status: 'OPEN' } });

    if (remaining === 0 && pendRemaining === 0) {
      await prisma.caseRecord.delete({ where: { id: caseRecord.id } });
    }

    return removedSnapshot;
  }

  static async getPendientes(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return [];

    const pendingRows = await listPendingRows(caseRecord.id);

    return pendingRows.map((row) => {
      const payload = isObject(row.payload) ? { ...row.payload } : {};
      return {
        ...payload,
        _pendienteMotivo: payload._pendienteMotivo || row.reason,
        _loteKey: `${caseRecord.clientName}|${dateToKey(caseRecord.dol)}`,
      };
    });
  }

  static async getPendientesCount(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return 0;

    return prisma.pendingReview.count({
      where: {
        caseId: caseRecord.id,
        status: 'OPEN',
      },
    });
  }

  static async getAllPendientesCount() {
    return prisma.pendingReview.count({ where: { status: 'OPEN' } });
  }

  static async addPendientes(nombre, dol, docs) {
    const caseRecord = await getOrCreateCase(nombre, dol);

    for (const doc of docs || []) {
      await prisma.pendingReview.create({
        data: {
          organizationId: caseRecord.organizationId,
          caseId: caseRecord.id,
          reason:
            String(doc?._pendienteMotivo || doc?.motivo || 'Pending review').slice(
              0,
              255,
            ),
          payload: doc,
          status: 'OPEN',
        },
      });
    }
  }

  static async assignPendienteToLote(nombre, dol, pendienteIndex) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return false;

    const pendingRows = await listPendingRows(caseRecord.id);
    if (pendienteIndex < 0 || pendienteIndex >= pendingRows.length) return false;

    const row = pendingRows[pendienteIndex];
    const payload = isObject(row.payload) ? { ...row.payload } : {};

    delete payload.motivo;
    delete payload.loteKey;
    delete payload._pendienteMotivo;
    delete payload._loteKey;
    delete payload.alertaIntruso;
    delete payload.motivoIntruso;

    payload.dol = dateToKey(caseRecord.dol);

    await upsertDocumentFromPayload(caseRecord, payload);
    await prisma.pendingReview.delete({ where: { id: row.id } });

    return true;
  }

  static async deletePendiente(nombre, dol, pendienteIndex) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return null;

    const pendingRows = await listPendingRows(caseRecord.id);
    if (pendienteIndex < 0 || pendienteIndex >= pendingRows.length) return null;

    const row = pendingRows[pendienteIndex];
    await prisma.pendingReview.delete({ where: { id: row.id } });

    return isObject(row.payload) ? row.payload : row.payload;
  }

  static async sendToTrash(archivoOrigen, doc) {
    const caseRecord = await findCaseByNombreDol(doc?._fromLote, doc?._fromDol);

    let documentId = null;
    if (caseRecord) {
      const existingDoc = await prisma.document.findFirst({
        where: {
          caseId: caseRecord.id,
          originalName: archivoOrigen,
        },
        orderBy: { createdAt: 'asc' },
      });
      documentId = existingDoc?.id || null;
    }

    const organizationId =
      caseRecord?.organizationId || (await getOrCreateDefaultOrganization()).id;

    await prisma.trashItem.create({
      data: {
        organizationId,
        caseId: caseRecord?.id || null,
        documentId,
        deletedAt: new Date(),
        snapshot: doc,
      },
    });
  }

  static async getTrash() {
    const trash = await prisma.trashItem.findMany({
      include: {
        document: true,
      },
      orderBy: { deletedAt: 'desc' },
    });

    return trash.map((item) => {
      const snapshot = isObject(item.snapshot) ? { ...item.snapshot } : {};
      return {
        archivoOrigen:
          item.document?.originalName ||
          snapshot.archivoOrigen ||
          `trash-${item.id}`,
        deletedAt: item.deletedAt,
        doc: snapshot,
      };
    });
  }

  static async restoreFromTrash(trashIndex, targetLoteNombre, targetLoteDol) {
    const trash = await prisma.trashItem.findMany({
      orderBy: { deletedAt: 'desc' },
    });

    if (trashIndex < 0 || trashIndex >= trash.length) return false;

    const entry = trash[trashIndex];
    const doc = isObject(entry.snapshot) ? { ...entry.snapshot } : null;
    if (!doc) return false;

    await this.saveToLote(targetLoteNombre, targetLoteDol, [doc]);
    await prisma.trashItem.delete({ where: { id: entry.id } });

    return true;
  }

  static async addThinking(nombre, dol, thinkingEntry) {
    const caseRecord = await getOrCreateCase(nombre, dol);

    await prisma.auditLog.create({
      data: {
        organizationId: caseRecord.organizationId,
        action: 'thinking.add',
        entityType: 'case',
        entityId: caseRecord.id,
        meta: thinkingEntry,
      },
    });
  }

  static async getThinking(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return [];

    const logs = await prisma.auditLog.findMany({
      where: {
        organizationId: caseRecord.organizationId,
        action: 'thinking.add',
        entityType: 'case',
        entityId: caseRecord.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      ...(isObject(log.meta) ? log.meta : {}),
      timestamp: log.createdAt,
    }));
  }

  static async deleteLote(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return { success: false, reason: 'Lote no encontrado' };

    const [docsRemoved, pendRemoved] = await Promise.all([
      prisma.document.count({ where: { caseId: caseRecord.id } }),
      prisma.pendingReview.count({ where: { caseId: caseRecord.id, status: 'OPEN' } }),
    ]);

    const trashBefore = await prisma.trashItem.count({ where: { caseId: caseRecord.id } });

    await prisma.$transaction([
      prisma.trashItem.deleteMany({ where: { caseId: caseRecord.id } }),
      prisma.caseRecord.delete({ where: { id: caseRecord.id } }),
    ]);

    return {
      success: true,
      docsRemoved,
      pendRemoved,
      trashRemoved: trashBefore,
    };
  }

  static async resetAll() {
    await prisma.$transaction([
      prisma.trashItem.deleteMany(),
      prisma.pendingReview.deleteMany(),
      prisma.lineItem.deleteMany(),
      prisma.document.deleteMany(),
      prisma.auditLog.deleteMany({ where: { action: 'thinking.add' } }),
      prisma.caseRecord.deleteMany(),
    ]);
  }

  static async attachQAToDocument(loteNombre, loteDol, archivoOrigen, qaData) {
    const caseRecord = await findCaseByNombreDol(loteNombre, loteDol);
    if (!caseRecord) return false;

    const doc = await prisma.document.findFirst({
      where: {
        caseId: caseRecord.id,
        originalName: archivoOrigen,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!doc) return false;

    const metadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
    metadata.qa = qaData;

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        metadata,
        qaStatus: 'APPROVED',
      },
    });

    return true;
  }

  static async updateDocumentInLote(nombre, dol, archivoOrigen, newData) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return false;

    const doc = await prisma.document.findFirst({
      where: {
        caseId: caseRecord.id,
        originalName: archivoOrigen,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!doc) return false;

    const existingMetadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
    if (existingMetadata.qa && !newData.qa) {
      newData.qa = existingMetadata.qa;
    }

    await upsertDocumentFromPayload(caseRecord, {
      ...newData,
      archivoOrigen,
    });

    return true;
  }

  static async updateDocumentField(nombre, dol, archivoOrigen, field, value) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return false;

    const doc = await prisma.document.findFirst({
      where: {
        caseId: caseRecord.id,
        originalName: archivoOrigen,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!doc) return false;

    const metadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
    metadata[field] = value;

    const data = { metadata };
    if (field === 'quienEnvia') {
      data.senderName = value;
    }

    await prisma.document.update({
      where: { id: doc.id },
      data,
    });

    return true;
  }

  static async updateLineItemField(nombre, dol, archivoOrigen, lineItemIndex, field, value) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return false;

    const doc = await prisma.document.findFirst({
      where: {
        caseId: caseRecord.id,
        originalName: archivoOrigen,
      },
      include: {
        lineItems: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!doc) return false;
    if (lineItemIndex < 0 || lineItemIndex >= doc.lineItems.length) return false;

    const lineItem = doc.lineItems[lineItemIndex];
    const raw = isObject(lineItem.raw) ? { ...lineItem.raw } : {};
    raw[field] = value;

    const updateData = { raw };
    if (field === 'fecha') updateData.serviceDate = normalizeDateLike(value);
    if (field === 'nombreDoctor') updateData.doctorName = value;
    if (field === 'procedimientoEjecutado') updateData.procedureName = value;
    if (field === 'monto') updateData.amount = Number.isFinite(Number(value)) ? Number(value) : null;

    const metadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
    const metadataItems = Array.isArray(metadata.lineItems) ? [...metadata.lineItems] : [];
    if (metadataItems[lineItemIndex] && isObject(metadataItems[lineItemIndex])) {
      metadataItems[lineItemIndex][field] = value;
    }
    metadata.lineItems = metadataItems;

    await prisma.$transaction([
      prisma.lineItem.update({
        where: { id: lineItem.id },
        data: updateData,
      }),
      prisma.document.update({
        where: { id: doc.id },
        data: { metadata },
      }),
    ]);

    return true;
  }

  static async updateSenderForLote(nombre, dol, oldSender, newSender) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return 0;

    const docs = await prisma.document.findMany({
      where: { caseId: caseRecord.id },
      orderBy: { createdAt: 'asc' },
    });

    let updatedCount = 0;
    for (const doc of docs) {
      const metadata = isObject(doc.metadata) ? { ...doc.metadata } : {};
      const sender = String(metadata.quienEnvia || doc.senderName || '').trim();
      if (sender !== String(oldSender || '').trim()) {
        continue;
      }

      metadata.quienEnvia = newSender;
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          senderName: newSender,
          metadata,
        },
      });
      updatedCount += 1;
    }

    return updatedCount;
  }

  static async clearAllQA() {
    const docs = await prisma.document.findMany({
      where: {
        metadata: { not: null },
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    for (const doc of docs) {
      if (!isObject(doc.metadata) || !('qa' in doc.metadata)) continue;
      const metadata = { ...doc.metadata };
      delete metadata.qa;
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          metadata,
          qaStatus: 'PENDING',
        },
      });
    }
  }

  static async clearQAForLote(nombre, dol) {
    const caseRecord = await findCaseByNombreDol(nombre, dol);
    if (!caseRecord) return;

    const docs = await prisma.document.findMany({
      where: { caseId: caseRecord.id },
      select: {
        id: true,
        metadata: true,
      },
    });

    for (const doc of docs) {
      if (!isObject(doc.metadata) || !('qa' in doc.metadata)) continue;
      const metadata = { ...doc.metadata };
      delete metadata.qa;
      await prisma.document.update({
        where: { id: doc.id },
        data: {
          metadata,
          qaStatus: 'PENDING',
        },
      });
    }
  }
}
