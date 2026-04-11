import React from 'react'
import CardIcon from '@admin-shared/icons/CardIcon'
import CashIcon from '@admin-shared/icons/CashIcon'
import TransferIcon from '@admin-shared/icons/TransferenciaIcon'

const SelectMetodoPago = ({
    tipoPago,
    setTipoPago
}) => {
  return (
    <>
    <p className="fs-4 mt-4 text-center">
                Selecciona el método de pago
            </p>
            <div className="btns_container">
                <button
                    className={`btn_card ${
                        tipoPago === 'tarjeta' ? 'active' : ''
                    }`}
                    onClick={() => setTipoPago('tarjeta')}
                >
                    <CardIcon width="46" height="46" />
                    <p>Tarjeta</p>
                </button>
                <button
                    className={`btn_card ${
                        tipoPago === 'efectivo' ? 'active' : ''
                    }`}
                    onClick={() => setTipoPago('efectivo')}
                >
                    <CashIcon width="46" height="46" />
                    <p>Efectivo</p>
                </button>
                <button
                    className={`btn_card ${
                        tipoPago === 'transferencia' ? 'active' : ''
                    }`}
                    onClick={() => setTipoPago('transferencia')}
                >
                    <TransferIcon width="46" height="46" />
                    <p>Transferencia</p>
                </button>
            </div>
    </>
  )
}

export default SelectMetodoPago