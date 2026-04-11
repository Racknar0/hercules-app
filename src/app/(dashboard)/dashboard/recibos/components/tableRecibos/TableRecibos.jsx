// src/components/TableRecibos/TableRecibos.jsx
import React, { useEffect, useState, useRef } from 'react';
import { DateRange } from 'react-date-range';
import HttpService from '@services/HttpService';
import './TableRecibos.scss';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Modal from '@admin-shared/modal/Modal';
import EyeIcon from '@admin-shared/icons/EyeIcon';
import Spinner from '@admin-shared/spinner/Spinner';
import IconBillBlue from '@admin-shared/icons/BillBlueIcon';
import useStore from '@store/useStore';
import { DeleteIcon } from '@admin-shared/icons/DeleteIcon';
import { confirmAlert, successAlert } from '@helpers/alerts';
import { ReturnIcon } from '@admin-shared/icons/ReturnIcon';
import { useRouter } from 'next/navigation';

const TableRecibos = () => {
    const httpService = new HttpService();
    const BACK_HOST = process.env.NEXT_PUBLIC_BACK_HOST;
    const selectedStore = useStore((state) => state.selectedStore);
    const jwtData = useStore((state) => state.jwtData);
    const setDataCambio = useStore((state) => state.setDataCambio);

    // 1) Calculamos los límites de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2) Estado del rango inicial = todo el día de hoy
    const [range, setRange] = useState({
        startDate: todayStart,
        endDate: todayEnd,
        key: 'selection',
    });
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef(null);

    const [recibos, setRecibos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);

    const formatTopDate = (date) =>
        new Intl.DateTimeFormat('es-CO', {
            day: 'numeric',
            month: 'long',
        }).format(date);

    const router = useRouter();

    // cerrar picker al hacer click fuera
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
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [showCalendar]);

    // 3) Cargar recibos cuando ya existe tienda seleccionada
    useEffect(() => {
        if (!selectedStore) {
            setRecibos([]);
            return;
        }
        fetchRecibos(range.startDate, range.endDate);
    }, [selectedStore]); // <-- cada vez que cambia la tienda

    // fetchRecibos reutilizable: recibe dos Date
    const fetchRecibos = async (start, end) => {
        if (!selectedStore) return;
        setLoading(true);
        const payload = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            storeId: selectedStore,
        };
        try {
            // opcional: simula retraso
            await new Promise((res) => setTimeout(res, 500));
            const resp = await httpService.postData('/sale/filter', payload);
            if (resp.status === 200) {
                setRecibos(resp.data || []);
                console.log('Recibos:', resp.data);
            } else {
                console.error('Error al traer recibos:', resp.statusText);
            }
        } catch (err) {
            console.error('Error fetchRecibos:', err);
        } finally {
            setLoading(false);
        }
    };

    // 4) Cuando el usuario selecciona un rango, actualizamos y volvemos a traer
    const handleSelect = (ranges) => {
        const { startDate, endDate } = ranges.selection;
        setRange(ranges.selection);
        setShowCalendar(false);
        fetchRecibos(startDate, endDate);
    };

    const openModal = (recibo) => {
        setSelected(recibo);
        setShowModal(true);
    };

    const handleDeleteRecibo = async (r) => {
        console.log('Borrando recibo:', r);

        // Lanzar confirmación
        const confirm = await confirmAlert(
            '¿Estás seguro?',
            '¿Deseas eliminar este recibo?',
            'warning'
        );
        if (!confirm) return;

        // Consultar endpoint
        try {
            setLoading(true);

            // simular retraso
            const response = await httpService.deleteData('sale', r.id);

            if (response.status === 200) {
                successAlert(
                    'Recibo eliminado',
                    'El recibo se ha eliminado correctamente',
                    'success'
                );
            } else {
                console.error('Error al eliminar recibo:', response);
                throw new Error(response.statusText);
            }
        } catch (err) {
            console.error('Error al eliminar recibo:', err);
        } finally {
            fetchRecibos(range.startDate, range.endDate);
            setLoading(false);
            // Refrescar la lista de recibos
        }
    };

    const handleCambioTicket = async (recibo) => {
        const confirm = await confirmAlert(
            '¿Estás seguro?',
            '¿Deseas realizar un cambio sobre este ticket?',
            'warning'
        );
        if (!confirm) return;

        // console.log('Devolviendo ticket:', recibo);

        const datacambio = {
            cambioActivo: true,
            dataRecibo: recibo,
        };
        setDataCambio(datacambio);
        router.push('/dashboard/ventas');
    };

    return (
        <div className="tableRecibos container-fluid mt-4">
            <h1 className="mb-4">Recibos</h1>

            <div className="recibos-topbar mb-3" ref={calendarRef}>
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
                            <th>Ver más</th>
                            <th># Ticket</th>
                            <th>Total</th>
                            <th>Método Pago</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    <Spinner
                                        color="#6564d8"
                                        styles={{ margin: '0 auto' }}
                                    />
                                </td>
                            </tr>
                        ) : recibos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">
                                    No hay recibos en ese rango
                                </td>
                            </tr>
                        ) : (
                            recibos.map((r) => (
                                <tr key={r.id}>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        <span
                                            role="button"
                                            className="ms-4"
                                            title="Ver más detalles"
                                            onClick={() => openModal(r)}
                                        >
                                            <EyeIcon />
                                        </span>
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        {r.ticketNumber}
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        ${parseFloat(r.totalAmount).toFixed(2)}
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        {r.paymentMethod}
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        {r.type}
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        {new Date(r.createdAt).toLocaleString(
                                            'es-ES',
                                            {
                                                dateStyle: 'short',
                                                timeStyle: 'short',
                                                hour12: false,
                                            }
                                        )}
                                    </td>
                                    <td
                                        className={r.isDeleted ? 'deleted' : ''}
                                    >
                                        {!r.isDeleted && r.type === 'venta' && (
                                            <span
                                                role="button"
                                                title="Cambiar Ticket"
                                                onClick={() =>
                                                    handleCambioTicket(r)
                                                }
                                            >
                                                <ReturnIcon
                                                    width={24}
                                                    height={24}
                                                />
                                            </span>
                                        )}
                                        <span
                                            role="button"
                                            title="Ver Ticket"
                                            style={{ marginLeft: '5px' }}
                                            onClick={() =>
                                                window.open(
                                                    `${BACK_HOST}/sale/generate-pdf/${r.id}`,
                                                    '_blank'
                                                )
                                            }
                                        >
                                            <IconBillBlue
                                                width={24}
                                                height={24}
                                            />
                                        </span>
                                        {!r.isDeleted &&
                                            jwtData.roleId === 2 && (
                                                <span
                                                    role="button"
                                                    title="Delete Ticket"
                                                    onClick={() =>
                                                        handleDeleteRecibo(r)
                                                    }
                                                >
                                                    <DeleteIcon
                                                        width={24}
                                                        height={24}
                                                        className="ms-2 text-danger"
                                                    />
                                                </span>
                                            )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={
                    selected ? `Recibo #${selected.ticketNumber}` : 'Detalles'
                }
            >
                {selected && (
                    (() => {
                        const totalWithoutCoupon = Number(selected.totalWithoutCoupon || 0);
                        const totalAmount = Number(selected.totalAmount || 0);
                        const globalDiscount = Math.max(totalWithoutCoupon - totalAmount, 0);
                        return (
                    <div>
                        <ul className="list-unstyled row mb-4">
                            <li className="col-12 col-md-6">
                                <div className="chip">
                                    <strong>Ticket:</strong>{' '}
                                    {selected.ticketNumber}
                                </div>
                            </li>
                            <li className="col-12 col-md-6">
                                <div className="chip">
                                    <strong>Cupón ticket:</strong>{' '}
                                    {selected.couponCode || 'N/A'}
                                </div>
                            </li>
                            <li className="col-12 col-md-6">
                                <div className="chip">
                                    <strong>Descuento ticket:</strong>{' '}
                                    ${globalDiscount.toFixed(2)}
                                </div>
                            </li>
                        </ul>
                        <h5 className="mt-4">Ítems de la venta</h5>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio Unit.</th>
                                        <th>Cupón ítem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected.saleItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.product.name}</td>
                                            <td>
                                                $
                                                {parseFloat(
                                                    item.unitPrice
                                                ).toFixed(2)}
                                            </td>
                                            <td>
                                                {item.itemCouponCode || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                        );
                    })()
                )}
            </Modal>
        </div>
    );
};

export default TableRecibos;
