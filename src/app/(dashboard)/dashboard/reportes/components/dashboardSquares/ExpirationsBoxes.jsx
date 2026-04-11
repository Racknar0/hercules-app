import React from 'react';
import './ExpirationsBoxes.scss';


const getColorClass = (expirationDate) => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays >= 10 && diffDays <= 15) return 'exp-green';
  if (diffDays >= 5 && diffDays <= 9) return 'exp-yellow';
  if (diffDays < 5) return 'exp-red';
  return '';
};

const ExpirationsBoxes = ({ products }) => {
  // products: array de productos próximos a vencer
  return (
    <div className="expirations-boxes-container">
      <div className="boxes-scroll">
        {products && products.length > 0 ? (
          products.slice(0, 5).map((prod, idx) => {
            const colorClass = getColorClass(prod.expirationDate);
            return (
              <div className={`expiration-box ${colorClass}`} key={prod.id || idx}>
                <div className="box-header">
                  <span className="box-title box-title-contrast">{prod.name}</span>
                </div>
                <div className="box-body box-body-contrast">
                  <div className="box-meta-row">
                    <span className="box-label">Código</span>
                    <span className="box-value">{prod.code}</span>
                  </div>
                  <div className="box-meta-row">
                    <span className="box-label">Stock</span>
                    <span className="box-stock-pill">{prod.stockunitCount || prod.stockunit?.length || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-products">No hay productos próximos a vencer.</div>
        )}
      </div>
    </div>
  );
};

export default ExpirationsBoxes;
