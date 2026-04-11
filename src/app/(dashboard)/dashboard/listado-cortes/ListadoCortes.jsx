// src/components/ListadoCortes/ListadoCortes.jsx
import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-date-range';
import HttpService from '@services/HttpService';
import Spinner from '@admin-shared/spinner/Spinner';
import useStore from '@store/useStore';

import './ListadoCortes.scss';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import IconBillBlue from '@admin-shared/icons/BillBlueIcon';

const ListadoCortes = () => {
  const httpService   = new HttpService();
  const selectedStore = useStore(state => state.selectedStore);
  const BACK_HOST     = process.env.NEXT_PUBLIC_BACK_HOST;

  const [range, setRange]                = useState({
    startDate: new Date(),
    endDate:   new Date(),
    key:       'selection'
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [cortes, setCortes]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const calendarRef                     = useRef(null);

  const formatTopDate = (date) =>
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
    }).format(date);

  // 1) Al montar, traer TODOS los cortes de la tienda
  useEffect(() => {
    if (!selectedStore) return;
    fetchAllCortes();
  }, [selectedStore]);

  // Cerrar el picker si clic fuera
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

  const fetchAllCortes = async () => {
    setLoading(true);
    try {
      const resp = await httpService.postData(
        '/cortes/range',
        { storeId: selectedStore }
      );
      if (resp.status === 200) {
        setCortes(resp.data);
      } else {
        console.error('Error trayendo todos los cortes:', resp.statusText);
      }
    } catch (err) {
      console.error('fetchAllCortes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredCortes = async ({ startDate, endDate }) => {
    setLoading(true);
    try {
      const resp = await httpService.postData(
        '/cortes/range',
        {
          storeId:    selectedStore,
          fechaInicial: startDate.toISOString().split('T')[0],
          fechaFinal:   endDate.toISOString().split('T')[0]
        }
      );
      if (resp.status === 200) {
        setCortes(resp.data);
      } else {
        console.error('Error trayendo cortes filtrados:', resp.statusText);
      }
    } catch (err) {
      console.error('fetchFilteredCortes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = ranges => {
    setRange(ranges.selection);
    setShowCalendar(false);
    fetchFilteredCortes(ranges.selection);
  };

  return (
    <div className="listadoCortes container-fluid mt-4">
      <h1 className="mb-4">Listado de Cortes</h1>

      <div className="listado-topbar mb-3" ref={calendarRef}>
        <div className="range-controls">
          <button
            className="btn-range-select"
            onClick={() => setShowCalendar((v) => !v)}
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
                showSelectionPreview
                moveRangeOnFirstSelection={false}
                editableDateInputs
                rangeColors={['#5a3ec8']}
              />
            </div>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Folio Inicial</th>
              <th>Folio Final</th>
              <th>Venta Total</th>
              <th>Costo Total</th>
              <th>Efectivo</th>
              <th>Tarjeta</th>
              <th>Transferencia</th>
              <th>Comentarios</th>
              <th><IconBillBlue width={24} height={24} /></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  <Spinner color="#6564d8" styles={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : cortes.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4">
                  No hay cortes para mostrar.
                </td>
              </tr>
            ) : (
              cortes.map(corte => (
                <tr key={corte.id}>
                  <td>
                  {new Date(corte.date).toLocaleDateString('es-ES', {
                      dateStyle: 'short',
                      timeZone: 'UTC'
                    })}
                  </td>
                  <td>{corte.folioInicial}</td>
                  <td>{corte.folioFinal}</td>
                  <td>${Number(corte.ventaTotal).toFixed(2)}</td>
                  <td>${Number(corte.costoTotal).toFixed(2)}</td>
                  <td>${Number(corte.efectivo).toFixed(2)}</td>
                  <td>${Number(corte.tarjeta).toFixed(2)}</td>
                  <td>${Number(corte.transferencia).toFixed(2)}</td>
                  <td>{corte.comentarios || '—'}</td>
                  <td>
                    <span
                      role="button"
                      title="Ver Ticket"
                      onClick={() =>
                        window.open(
                          `${BACK_HOST}/cortes/generate-pdf/${corte.id}`,
                          '_blank'
                        )
                      }
                    >
                      <IconBillBlue width={24} height={24} />
                    </span>
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

export default ListadoCortes;