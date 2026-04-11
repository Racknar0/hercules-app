import React from 'react'

const Cambio = ({
    efectivo,
    setEfectivo,
    cambio,
    validarEfectivo,
    tipoPago
}) => {
  return (
    <>
                <p className="fs-4 mt-4 text-center">Ingrese el monto recibido</p>
            <div className="efectivo_cambio_container">
                <div className="efectivo_container">
                    <label htmlFor="efectivo">Recibido</label>
                    <input
                        type="number"
                        id="efectivo"
                        placeholder="0"
                        min="0"
                        value={efectivo}
                        onChange={(e) => setEfectivo(e.target.value)}
                        onBlur={() => validarEfectivo(efectivo)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); // evita un submit accidental
                                e.target.blur(); // dispara onBlur una sola vez
                            }
                        }}
                        disabled={tipoPago !== 'efectivo' ? true : false}
                        style={{ backgroundColor: (tipoPago === 'tarjeta' || tipoPago === 'transferencia') ? '#bebebe' : '' }}
                    />
                </div>
                <div className="cambio_container">
                    <label htmlFor="cambio">Cambio</label>
                    <input
                        type="number"
                        id="cambio"
                        placeholder="0"
                        disabled
                        value={cambio}
                    />
                </div>
            </div>
    </>
  )
}

export default Cambio