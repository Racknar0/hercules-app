import React, { useEffect, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DateRange } from 'react-date-range';
import TableDashboard from './components/tableDashboard/TableDashboard'; 
import DashboardSquares from './components/dashboardSquares/DashboardSquares';
import ExpirationsByStore from './components/dashboardSquares/ExpirationsByStore';
import HttpService from '@services/HttpService';
import './Dashboard.scss';
import useStore from '@store/useStore';
import { useRouter } from 'next/navigation';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const Dashboard = () => {

  const roleId = useStore((state) => state.jwtData?.roleId);
  const selectedStore = useStore((state) => state.selectedStore);
  const router = useRouter();
  const httpService = new HttpService();
  const calendarRef = useRef(null);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [range, setRange] = useState({
    startDate: todayStart,
    endDate: todayEnd,
    key: 'selection',
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    if (roleId == null) {
      return;
    }
    // validar si el usuario tiene permisos para ver el dashboard
    if (roleId !== 2) {
      router.push('/dashboard/ventas');
    }

  }, [roleId, router]);

  const [dataSales, setDataSales] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showCalendar &&
        calendarRef.current &&
        !calendarRef.current.contains(e.target)
      ) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const fetchSales = async (start, end) => {
    if (!selectedStore) {
      setDataSales([]);
      return;
    }

    setLoadingSales(true);
    try {
      const payload = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        storeId: selectedStore,
      };
      const resp = await httpService.postData('/sale/filter', payload);
      if (resp.status === 200) {
        const filteredData = (resp.data || []).filter((item) => !item.isDeleted);
        setDataSales(filteredData);
      } else {
        setDataSales([]);
      }
    } catch (err) {
      console.error('Error fetchSales:', err);
      setDataSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchSales(range.startDate, range.endDate);
  }, [selectedStore]);

  const handleSelectRange = (ranges) => {
    const nextRange = ranges.selection;
    setRange(nextRange);
    setShowCalendar(false);
    fetchSales(nextRange.startDate, nextRange.endDate);
  };

  const formatTopDate = (date) =>
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
    }).format(date);

  const exportarVentas = async () => {
    const toNumberOrNull = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    worksheet.columns = [
      { header: 'Ticket', key: 'ticket', width: 12 },
      { header: 'Fecha', key: 'fecha', width: 16 },
      { header: 'Sucursal', key: 'sucursal', width: 22 },
      { header: 'Usuario', key: 'usuario', width: 22 },
      { header: 'Metodo Pago', key: 'metodoPago', width: 16 },
      { header: 'Total Ticket', key: 'totalTicket', width: 16 },
      { header: 'Cupon ticket', key: 'cuponTicket', width: 18 },
      { header: 'Descuento ticket', key: 'descuentoTicket', width: 18 },
      { header: 'Producto', key: 'producto', width: 40 },
      { header: 'Codigo Producto', key: 'codigoProducto', width: 18 },
      { header: 'Impuesto', key: 'impuesto', width: 14 },
      { header: 'Costo', key: 'costo', width: 12 },
      { header: 'Precio Publico', key: 'precioPublico', width: 14 },
      { header: 'Vendido Por', key: 'vendidoPor', width: 14 },
      { header: 'Cupon item', key: 'cuponItem', width: 16 },
      { header: 'Descuento item', key: 'descuentoItem', width: 16 },
    ];

    const todayText = new Date().toLocaleString('es-MX');
    worksheet.mergeCells('A1:P1');
    worksheet.getCell('A1').value = 'Reporte de Ventas';
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F2937' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:P2');
    worksheet.getCell('A2').value = `Generado: ${todayText}`;
    worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF4B5563' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getRow(4).values = worksheet.columns.map((c) => c.header);

    dataSales.forEach((sale) => {
      const totalTicket = toNumberOrNull(sale.totalAmount) ?? 0;
      const totalSinCupon = toNumberOrNull(sale.totalWithoutCoupon) ?? 0;
      const descuentoTicket = Math.max(totalSinCupon - totalTicket, 0);

      sale.saleItems.forEach((item) => {
        const soldWithCoupon = toNumberOrNull(item.sellwhitcoupon);
        const descuentoItem = toNumberOrNull(item.couponDiscountValue);

        worksheet.addRow({
          ticket: sale.ticketNumber,
          fecha: new Date(sale.createdAt).toLocaleDateString('es-MX'),
          sucursal: sale.store?.name || '',
          usuario: sale.user?.name || '',
          metodoPago: sale.paymentMethod || '',
          totalTicket,
          cuponTicket: sale.couponCode || 'N/A',
          descuentoTicket,
          producto: item.product?.name || '',
          codigoProducto: item.product?.code || '',
          impuesto: item.product?.hasTax ? 'Si' : 'No',
          costo: toNumberOrNull(item.product?.purchasePrice),
          precioPublico: toNumberOrNull(item.product?.salePrice),
          vendidoPor: soldWithCoupon ?? item.unitPrice,
          cuponItem: item.itemCouponCode || 'N/A',
          descuentoItem: descuentoItem ?? 0,
        });
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
      to: { row: 4, column: 16 },
    };

    const currencyColumns = ['F', 'H', 'L', 'M', 'N', 'P'];
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

      currencyColumns.forEach((column) => {
        const cell = worksheet.getCell(`${column}${rowNumber}`);
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Estado para expiraciones reales por tienda
  const [storesExpirations, setStoresExpirations] = useState([]);
  const [loadingExpirations, setLoadingExpirations] = useState(true);

  useEffect(() => {
    const fetchExpirations = async () => {
      setLoadingExpirations(true);
      try {
        const httpService = new HttpService();
        const res = await httpService.getData('/product/expiring-perishables-by-store');
        if (res.status === 200) {
          setStoresExpirations(res.data);
        }
      } catch (err) {
        setStoresExpirations([]);
      } finally {
        setLoadingExpirations(false);
      }
    };
    fetchExpirations();
  }, []);

  return (
    <div>
      <DashboardSquares dataSales={dataSales}/>

      {/* Cajas de productos próximos a vencer por tienda */}
      {loadingExpirations ? (
        <div className="text-center my-4">Cargando productos próximos a vencer...</div>
      ) : (
        <ExpirationsByStore storesExpirations={storesExpirations} />
      )}

      <div className="reportes-table-section" ref={calendarRef}>
        <div className="reportes-topbar">
          <div className="range-controls">
            <button
              className="btn btn-range-select"
              onClick={() => setShowCalendar((prev) => !prev)}
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
                  onChange={handleSelectRange}
                  months={2}
                  direction="horizontal"
                  showSelectionPreview
                  moveRangeOnFirstSelection={false}
                  editableDateInputs
                  rangeColors={['#5a3ec8']}
                />
              </div>
            )}
          </div>

          <button className="exportar_btn" onClick={exportarVentas} disabled={!dataSales.length}>
            ↓ Exportar Ventas
          </button>
        </div>

        <TableDashboard sales={dataSales} loading={loadingSales} />
      </div>
    </div>
  );
};

export default Dashboard;
