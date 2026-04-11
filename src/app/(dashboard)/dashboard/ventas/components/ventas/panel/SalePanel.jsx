import React, { useState } from 'react';
import './SalePanel.scss';
import { CouponIcon } from '@admin-shared/icons/CouponIcon';
import { DeleteIcon } from '@admin-shared/icons/DeleteIcon';
import ProcesoPago from '../procesopago/ProcesoPago';
import useStore from '@store/useStore';
import ProcesoPagoCambio from '../procesopago/ProcesoPagoCambio';
import Modal from '@admin-shared/modal/Modal';

const SalePanel = ({
    cartItems,
    onRemoveFromCart,
    lastAddedIndex,
    fetchProducts,
}) => {
    const { applyItemCoupon, removeItemCoupon, cupones } = useStore();
    const dataCambio = useStore((state) => state.dataCambio);
    const [showItemCouponModal, setShowItemCouponModal] = useState(false);
    const [activeUnit, setActiveUnit] = useState(null);

    const handleItemCoupon = (unit, code) => {
        const cup = cupones.find((c) => c.code === code);
        if (cup) applyItemCoupon(unit.id, cup);
        else removeItemCoupon(unit.id); // para vacío o no válido
    };

    const openItemCouponPicker = (unit) => {
        setActiveUnit(unit);
        setShowItemCouponModal(true);
    };

    const closeItemCouponPicker = () => {
        setShowItemCouponModal(false);
        setActiveUnit(null);
    };

    const pickCouponForItem = (coupon) => {
        if (!activeUnit) return;
        handleItemCoupon(activeUnit, coupon.code);
        closeItemCouponPicker();
    };

    const clearCouponForItem = () => {
        if (!activeUnit) return;
        removeItemCoupon(activeUnit.id);
        closeItemCouponPicker();
    };

    return (
        <div className="col-md-8 sale_panel_container pt-4">
            <h5 className="text-center fs-3">Detalles de la Venta</h5>

            <div className="table-responsive coupon_table_wrapper mt-4">
                <table className="table table-bordered coupon_table">
                    <thead className="table-light">
                        <tr>
                            <th>Producto</th>
                            <th>Código</th>
                            <th>Precio</th>
                            <th>Vencimiento</th>
                            {dataCambio?.cambioActivo ? null : (
                                <th className="text-center">Cupón</th>
                            )}
                            <th className="th_coupon_body">
                                <DeleteIcon width="20px" height="20px" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {cartItems.length > 0 ? (
                            cartItems.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`table_row ${
                                        index === lastAddedIndex ? 'highlight' : ''
                                    }`}
                                >
                                    <td>{item.product.name}</td>
                                    <td>{item.product.code}</td>
                                    <td>
                                        {item.itemCoupon ? (
                                            <span className="before_coupon">
                                                ${item.product.salePrice}
                                            </span>
                                        ) : null}
                                        ${item.priceWithItemCoupon}
                                    </td>
                                    <td>
                                        {item.expirationDate
                                            ? new Date(
                                                  item.expirationDate
                                              ).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    {dataCambio?.cambioActivo ? null : (
                                        <td className="text-center">
                                            <div className="coupon-input-group">
                                                <input
                                                    key={`${item.id}-${item.itemCoupon?.code || 'none'}`}
                                                    className="form-control"
                                                    defaultValue={
                                                        item.itemCoupon?.code || ''
                                                    }
                                                    onBlur={(e) =>
                                                        handleItemCoupon(
                                                            item,
                                                            e.target.value
                                                                .trim()
                                                                .toUpperCase()
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            e.target.blur();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="coupon-picker-btn"
                                                    onClick={() => openItemCouponPicker(item)}
                                                    aria-label="Seleccionar cupón"
                                                    title="Seleccionar cupón"
                                                >
                                                    <CouponIcon width={18} height={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    <td className="text-center">
                                        <DeleteIcon
                                            className="delete_icon"
                                            width="20px"
                                            height="20px"
                                            onClick={() => {
                                                console.log('item', item);
                                                onRemoveFromCart(item);
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center">
                                    No hay productos en el carrito. Selecciona uno a
                                    la izquierda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <hr className="mt-5" />
            <h5 className="text-center fs-3 mt-5">
              {
                dataCambio?.cambioActivo
                    ? 'Proceso de Cambio'
                    : 'Proceso de Pago'
              }
            </h5>

            {dataCambio?.cambioActivo ? (
                <ProcesoPagoCambio />
            ) : (
                <ProcesoPago fetchProducts={fetchProducts} />
            )}

            <Modal
                show={showItemCouponModal}
                onClose={closeItemCouponPicker}
                title="Seleccionar cupón para item"
            >
                <div className="coupon-picker-modal-list">
                    {cupones?.length ? (
                        cupones.map((coupon) => (
                            <button
                                key={coupon.id}
                                type="button"
                                className="coupon-picker-modal-item"
                                onClick={() => pickCouponForItem(coupon)}
                            >
                                <span className="coupon-code">{coupon.code}</span>
                                <span className="coupon-description">{coupon.description}</span>
                                <span className="coupon-discount">-{coupon.discount}%</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center mb-0">No hay cupones disponibles</p>
                    )}
                </div>

                <div className="coupon-picker-modal-actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeItemCouponPicker}>
                        Cerrar
                    </button>
                    <button type="button" className="btn btn-outline-danger" onClick={clearCouponForItem}>
                        Quitar cupón
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SalePanel;
