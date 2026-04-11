// src/components/TableRecibos/TableMovimientos.jsx
import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-date-range';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import HttpService from '@services/HttpService';
import './TableMovimientos.scss';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Spinner from '@admin-shared/spinner/Spinner';
import useStore from '@store/useStore';

const TableMovimientos = () => {
  const httpService   = new HttpService();
  const selectedStore = useStore(state => state.selectedStore);

  // Rango de fechas para el picker
  const [range, setRange]                   = useState({
    startDate: new Date(),
    endDate:   new Date(),
    key:       'selection'
  });
  const [showCalendar, setShowCalendar]    = useState(false);
  const [movimientos, setMovimientos]      = useState([]);
  const [loading, setLoading]              = useState(false);
  const calendarRef                         = useRef(null);

  // NUEVOS estados para los filtros
  const [searchTerm, setSearchTerm]         = useState('');
  const [actionFilter, setActionFilter]     = useState(''); // '' = Todos

  const formatTopDate = (date) =>
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
    }).format(date);

  // Cerrar el picker si el usuario hace click fuera
  useEffect(() => {
    const onClickOutside = e => {
      if (
        showCalendar &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showCalendar]);

  // Cada vez que cambien fechas o tienda, recargar movimientos
  useEffect(() => {
    fetchMovimientos();
  }, [range, selectedStore]);

  // Cuando cargue por primera vez o cambie la tienda, traer movimientos del día de hoy
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setRange({
      startDate: today,
      endDate:   new Date(),
      key:       'selection'
    });
    fetchMovimientos();
  }, [selectedStore]);

  const fetchMovimientos = async () => {
    setLoading(true);
    const payload = {
      startDate: range.startDate.toISOString(),
      endDate:   range.endDate.toISOString(),
      storeId:   selectedStore
    };
    try {
      // Simula un pequeño delay
      await new Promise(r => setTimeout(r, 500));
      const resp = await httpService.postData(
        '/movements/filter',
        payload
      );
      if (resp.status === 200) {
        setMovimientos(resp.data || []);
      } else {
        console.error('Error al traer movimientos:', resp.statusText);
        setMovimientos([]);
      }
    } catch (err) {
      console.error('Error fetchMovimientos:', err);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = ranges => {
    setRange(ranges.selection);
    // ocultar calendario al elegir
    setShowCalendar(false);
  };

  // ----------------------------------------------------
  // Filtramos movimientos en función de searchTerm y actionFilter:
  // ----------------------------------------------------
  const filteredMovimientos = movimientos.filter(r => {
    const term = searchTerm.trim().toLowerCase();

    // 1) Coincidencia texto (tienda, producto o usuario)
    const matchesSearch =
      term === '' ||
      r.store?.name.toLowerCase().includes(term) ||
      r.product?.name.toLowerCase().includes(term) ||
      r.user?.user.toLowerCase().includes(term);

    // 2) Coincidencia acción
    const matchesAction =
      actionFilter === '' || // '' significa “Todos”
      r.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // ----------------------------------------------------
  // Exportar movimientos filtrados a Excel
  // ----------------------------------------------------
  const exportarMovimientos = async () => {
    const toNumberOrNull = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Movimientos', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    const columns = [
      { header: 'Accion', key: 'accion', width: 14 },
      { header: 'Tienda', key: 'tienda', width: 22 },
      { header: 'Producto', key: 'producto', width: 40 },
      { header: 'Precio Compra', key: 'precioCompra', width: 16 },
      { header: 'Precio Venta', key: 'precioVenta', width: 16 },
      { header: 'Usuario', key: 'usuario', width: 18 },
      { header: 'Fecha', key: 'fecha', width: 22 },
    ];

    worksheet.columns = columns;

    const todayText = new Date().toLocaleString('es-MX');
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.getCell('A1').value = 'Reporte de Movimientos';
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F2937' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells(2, 1, 2, columns.length);
    worksheet.getCell('A2').value = `Generado: ${todayText}`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF4B5563' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getRow(4).values = columns.map((c) => c.header);

    filteredMovimientos.forEach((mov) => {
      worksheet.addRow({
        accion: mov.action,
        tienda: mov.store?.name || '',
        producto: mov.product?.name || '',
        precioCompra: toNumberOrNull(mov.product?.purchasePrice),
        precioVenta: toNumberOrNull(mov.product?.salePrice),
        usuario: mov.user?.user || '',
        fecha: new Date(mov.createdAt).toLocaleString('es-ES', {
          dateStyle: 'short',
          timeStyle: 'short',
          hour12: false,
        }),
      });
    });

    const headerRow = worksheet.getRow(4);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF374151' },
      };
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });

    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: columns.length },
    };

    for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const isEven = rowNumber % 2 === 0;

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });

      [4, 5].forEach((columnIndex) => {
        const cell = row.getCell(columnIndex);
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `movimientos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(blob, fileName);
  };

  return (
    <div className="tableMovimientos container-fluid mt-4">
      {/* <h1 className="mb-4">Movimientos de Stock</h1> */}

      {/* ———————– RANGO Y EXPORTACIÓN ———————– */}
      <div className="movimientos-topbar mb-3" ref={calendarRef}>
        <div className="range-controls">
          <button
            className="btn-range-select"
            onClick={() => setShowCalendar((show) => !show)}
          >
            {showCalendar ? 'Cerrar selector' : 'Seleccionar rango'}
          </button>

          <div className="range-preview">
            <span className="range-date-chip">{formatTopDate(range.startDate)}</span>
            <span className="range-separator">-</span>
            <span className="range-date-chip">{formatTopDate(range.endDate)}</span>
          </div>

          {showCalendar && (
            <div className="calendar-popover">
              <DateRange
                ranges={[range]}
                onChange={handleSelect}
                months={2}
                direction="horizontal"
                showSelectionPreview={true}
                moveRangeOnFirstSelection={false}
                editableDateInputs={true}
                rangeColors={['#5a3ec8']}
              />
            </div>
          )}
        </div>

        <button
          className="exportar_btn"
          onClick={exportarMovimientos}
          disabled={filteredMovimientos.length === 0}
        >
          Exportar Movimientos
        </button>
      </div>

      {/* ———————– FILTROS DE BÚSQUEDA Y TIPO DE MOVIMIENTO ———————– */}
      <div className="row mt-3 mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control mb-2 form_buscador"
            placeholder="🔎 Buscar por tienda, producto o usuario..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select mb-2 form_buscador"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">Todos los movimientos</option>
            <option value="CREATE">CREATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* ———————– TABLA DE RESULTADOS ———————– */}
      <div className="table-responsive mt-2">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Tienda</th>
              <th>Producto</th>
              <th>Usuario</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  <Spinner color="#6564d8" styles={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : filteredMovimientos.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  No hay movimientos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filteredMovimientos.map(r => (
                <tr key={r.id}>
                  <td>
                    {r.action === 'CREATE' && <span>✅</span>}
                    {r.action === 'UPDATE' && <span>🔄</span>}
                    {r.action === 'DELETE' && <span>❌</span>}
                  </td>
                  <td>{r.store?.name}</td>
                  <td>{r.product?.name}</td>
                  <td>{r.user?.user}</td>
                  <td>
                    {new Date(r.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      hour12: false
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableMovimientos;
