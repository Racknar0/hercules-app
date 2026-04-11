import React from 'react'

const TotalValue = ({
    selectedCoupon,
    totalCompra,
    totalCompraSinCupon
}) => {
  return (
    <div className="total_container">
                <div className="total">
                    <p className="total_title">Total a pagar</p>
                    <div className='d-flex flex-column align-items-center w-100 justify-content-center'>
                        {
                            selectedCoupon ? (
                                <p className="total_value antes">${totalCompraSinCupon}</p>
                            ) : null
                        }
                        <p className="total_value">${totalCompra}</p>
                    </div>
                </div>
            </div>
  )
}

export default TotalValue