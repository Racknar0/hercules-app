'use client';

import usePublicCart from '@store/usePublicCart';
import { useState } from 'react';
import './ProductModal.scss';

const Stars = ({ count = 5, max = 5 }) => (
  <>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={i < count ? 'pm__star' : 'pm__star pm__star--empty'}>★</span>
    ))}
  </>
);

const ProductModal = ({ product, onClose }) => {
  const addItem = usePublicCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <>
      <div className="pm__overlay" onClick={onClose} />
      <div className="pm">
        <button className="pm__close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="pm__body">
          {/* Image */}
          <div className="pm__image-area">
            <div className="pm__image-placeholder">📷 Imagen producto</div>
            {discount > 0 && (
              <span className="pm__discount-badge">-{discount}%</span>
            )}
          </div>

          {/* Info */}
          <div className="pm__info">
            <div className="pm__rating">
              <Stars count={product.rating} />
              <span className="pm__rating-text">({product.rating}/5)</span>
            </div>

            <h2 className="pm__name">{product.name}</h2>
            
            {product.weight && (
              <span className="pm__weight">{product.weight}</span>
            )}

            <p className="pm__description">{product.description}</p>

            <div className="pm__prices">
              <span className="pm__price-current">${product.price.toFixed(2)}</span>
              {product.originalPrice > product.price && (
                <span className="pm__price-original">${product.originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="pm__qty-section">
              <span className="pm__qty-label">Cantidad:</span>
              <div className="pm__qty-controls">
                <button className="pm__qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="pm__qty-value">{qty}</span>
                <button className="pm__qty-btn" onClick={() => setQty(qty + 1)}>+</button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              className={`pm__add-btn ${added ? 'pm__add-btn--added' : ''}`}
              onClick={handleAdd}
            >
              {added ? '✓ Añadido al carrito' : '🛒 Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
