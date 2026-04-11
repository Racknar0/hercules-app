import ExcelJS from 'exceljs';

export class ExcelService {
  /**
   * Genera un Excel a partir de un array de documentos JSON.
   * Los datos se escriben TAL CUAL vienen del OCR, sin normalizar.
   */
  static async generateExcelFromData(jsonRecords) {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Master Data');

      ws.columns = [
          { header: 'FILE', key: 'archivoOrigen', width: 25 },
          { header: 'CLIENT', key: 'nombreCliente', width: 20 },
          { header: 'TYPE', key: 'tipoDocumento', width: 15 },
          { header: 'DATE OF LOSS', key: 'dol', width: 15 },
          { header: 'PATIENT', key: 'nombrePaciente', width: 20 },
          { header: 'SENDER / FACILITY', key: 'quienEnvia', width: 25 },
          { header: 'DATE OF SERVICE', key: 'fecha', width: 15 },
          { header: 'DOC / SERVICES', key: 'nombreDoctor', width: 25 },
          { header: 'PROCEDURES EXECUTED', key: 'procedimientoEjecutado', width: 30 },
          { header: 'FUTURE PROCEDURES', key: 'procedimientoFuturo', width: 30 },
          { header: 'AMOUNT', key: 'monto', width: 12 }
      ];

      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A2BE2' } };
      ws.getRow(1).alignment = { horizontal: 'center' };
      ws.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 11 }
      };

      jsonRecords.forEach(doc => {
          const client = doc.nombreCliente || 'Sin Nombre';
          const dol = doc.dol || 'Sin Fecha';

          if (doc.lineItems && doc.lineItems.length > 0) {
              doc.lineItems.forEach(item => {
                  const row = ws.addRow({
                      archivoOrigen: doc.archivoOrigen,
                      nombreCliente: client,
                      tipoDocumento: doc.tipoDocumento,
                      dol: dol,
                      nombrePaciente: doc.nombrePaciente,
                      quienEnvia: doc.quienEnvia,
                      fecha: item.fecha,
                      nombreDoctor: item.nombreDoctor,
                      grupoProveedor: item.grupoProveedor,
                      procedimientoEjecutado: item.procedimientoEjecutado,
                      procedimientoFuturo: item.procedimientoFuturo,
                      monto: item.monto
                  });

                  // Rojo si falta DOL
                  if (!dol || dol === 'Sin Fecha') {
                      row.eachCell((cell) => {
                          cell.fill = {
                              type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' }
                          };
                          cell.font = { color: { argb: 'FFFF0000' } };
                      });
                  }
              });
          }
      });

      return await workbook.xlsx.writeBuffer();
  }
}
