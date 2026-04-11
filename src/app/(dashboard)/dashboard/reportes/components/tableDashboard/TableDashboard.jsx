import React, { useState } from 'react';
import './TableDashboard.scss';
import Modal from '@admin-shared/modal/Modal';
import EyeIcon from '@admin-shared/icons/EyeIcon';
import Spinner from '@admin-shared/spinner/Spinner';
import IconBillBlue from '@admin-shared/icons/BillBlueIcon';

const TableDashboard = ({
  sales,
  loading,
}) => {
  const BACK_HOST = process.env.NEXT_PUBLIC_BACK_HOST;
  const recibos = Array.isArray(sales) ? sales : [];
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const openModal = recibo => {
    setSelected(recibo);
    setShowModal(true);
  };

  return (
    <div className="TableDashboard container-fluid mt-4">

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
              <th>Ticket</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <Spinner color="#6564d8" styles={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : recibos.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No hay recibos en ese rango
                </td>
              </tr>
            ) : (
              recibos.map(r => (
                <tr key={r.id}>
                  <td>
                    <span
                      role="button"
                      className="ms-4"
                      title="Ver más detalles"
                      onClick={() => openModal(r)}
                    >
                      <EyeIcon />
                    </span>
                  </td>
                  <td>{r.ticketNumber}</td>
                  <td>${parseFloat(r.totalAmount).toFixed(2)}</td>
                  <td>{r.paymentMethod}</td>
                  <td>{r.type}</td>
                  <td>
                    {new Date(r.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                      hour12: false
                    })}
                  </td>
                  <td>
                    <span
                      role="button"
                      title="Ver Ticket"
                      onClick={() =>
                        window.open(
                          `${BACK_HOST}/sale/generate-pdf/${r.id}`,
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

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={selected ? `Recibo #${selected.ticketNumber}` : 'Detalles'}
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
                  <strong>Ticket:</strong> {selected.ticketNumber}
                </div>
              </li>
              <li className="col-12 col-md-6">
                <div className="chip">
                  <strong>Cupón ticket:</strong> {selected.couponCode || 'N/A'}
                </div>
              </li>
              <li className="col-12 col-md-6">
                <div className="chip">
                  <strong>Descuento ticket:</strong> ${globalDiscount.toFixed(2)}
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
                  {selected.saleItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td>${parseFloat(item.unitPrice).toFixed(2)}</td>
                      <td>{item.itemCouponCode || 'N/A'}</td>
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

export default TableDashboard;
