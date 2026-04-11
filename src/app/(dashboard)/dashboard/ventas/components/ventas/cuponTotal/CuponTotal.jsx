import React, { useState } from 'react'
import Modal from '@admin-shared/modal/Modal';
import { CouponIcon } from '@admin-shared/icons/CouponIcon';
import useStore from '@store/useStore';

const CuponTotal = ({
    cupon,
    setCupon,
    handleCuponChange,
    onSelectCoupon
}) => {
  const [showCouponModal, setShowCouponModal] = useState(false);
  const cupones = useStore((state) => state.cupones);

  const selectCoupon = (coupon) => {
    onSelectCoupon(coupon);
    setShowCouponModal(false);
  };

  return (
    <>
        <p className="fs-4 mt-4 text-center">
                        Aplicar un cupón al total de la compra
                    </p>
        <div className="coupon_total_cntainer d-flex flex-column align-items-center">
            <div className="coupon_total_input_row">
                <input
                    type="text"
                    placeholder="Código del cupón"
                    className="form-control"
                    value={cupon}
                    onChange={(e) => setCupon(e.target.value.toUpperCase())}
                    onBlur={handleCuponChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                        }
                    }}
                />
                <button
                    type="button"
                    className="coupon_picker_btn"
                    aria-label="Seleccionar cupón"
                    title="Seleccionar cupón"
                    onClick={() => setShowCouponModal(true)}
                >
                    <CouponIcon width={18} height={18} />
                </button>
            </div>
        </div>

        <Modal
            show={showCouponModal}
            onClose={() => setShowCouponModal(false)}
            title="Seleccionar cupón para total"
        >
            <div className="coupon-picker-modal-list">
                {cupones?.length ? (
                    cupones.map((coupon) => (
                        <button
                            key={coupon.id}
                            type="button"
                            className="coupon-picker-modal-item"
                            onClick={() => selectCoupon(coupon)}
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
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCouponModal(false)}>
                    Cerrar
                </button>
            </div>
        </Modal>
    </>
  )
}

export default CuponTotal