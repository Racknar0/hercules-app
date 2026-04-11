import React from 'react';

import ExpirationsBoxes from './ExpirationsBoxes';
import './ExpirationsByStore.scss';

const ExpirationsByStore = ({ storesExpirations }) => {
  // storesExpirations: [{ storeName, products: [...] }]
  return (
    <div className="expirations-by-store-container">
      <div className="expirations-header">
        <div>
          <h4 className="expirations-title">Productos próximos a vencer por tienda</h4>
          <p className="expirations-subtitle">Ventana de revisión: próximos 15 días</p>
        </div>

        <div className="exp-legend-global">
          <span className="legend-item exp-green">15-10 días</span>
          <span className="legend-item exp-yellow">9-5 días</span>
          <span className="legend-item exp-red">Menos de 5 días</span>
        </div>
      </div>

      <div className="stores-scroll">
        {storesExpirations && storesExpirations.length > 0 ? (
          storesExpirations.map((store, idx) => (
            <div className="store-expirations-box" key={store.storeName || idx}>
              <div className="store-title-row">
                <div className="store-title">{store.storeName}</div>
                <span className="store-badge">{store.products?.length || 0} productos</span>
              </div>
              <ExpirationsBoxes products={store.products} />
            </div>
          ))
        ) : (
          <div className="no-stores">No hay tiendas disponibles.</div>
        )}
      </div>
    </div>
  );
};

export default ExpirationsByStore;
