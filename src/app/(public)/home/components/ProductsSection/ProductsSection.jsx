'use client';

import { useMemo, useState } from 'react';
import usePublicCart from '@store/usePublicCart';
import { PRODUCTS as ALL_PRODUCTS } from '../../../productos/data/products';
import ProductModal from '../../../productos/components/ProductModal/ProductModal';
import './ProductsSection.scss';

const FEATURED_PRODUCT_IDS = [1, 13, 10, 8];

const Stars = ({ count = 5, max = 5 }) => (
  <>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={i < count ? 'products__star' : 'products__star products__star--empty'}>★</span>
    ))}
  </>
);

const ProductsSection = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const addItem = usePublicCart((state) => state.addItem);

  const featuredProducts = useMemo(() => {
    return FEATURED_PRODUCT_IDS
      .map((productId) => ALL_PRODUCTS.find((product) => product.id === productId))
      .filter(Boolean);
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return featuredProducts;
    return featuredProducts.filter((product) => product.category === activeFilter);
  }, [activeFilter, featuredProducts]);

  const handleQuickAdd = (event, product) => {
    event.stopPropagation();
    addItem(product, 1);
  };

  return (
    <section className="products" id="products">
      <div className="products__container">
        <div className="products__header">
          <p className="products__eyebrow">Lo Más Vendido</p>
          <h2 className="products__title">Favoritos de Nuestros Clientes</h2>
        </div>

        <div className="products__filters">
          <button
            type="button"
            className={`products__filter-btn ${activeFilter === 'all' ? 'products__filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`products__filter-btn ${activeFilter === 'alimento' ? 'products__filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('alimento')}
          >
            Alimento
          </button>
          <button
            type="button"
            className={`products__filter-btn ${activeFilter === 'juguetes' ? 'products__filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('juguetes')}
          >
            Juguetes
          </button>
          <button
            type="button"
            className={`products__filter-btn ${activeFilter === 'accesorios' ? 'products__filter-btn--active' : ''}`}
            onClick={() => setActiveFilter('accesorios')}
          >
            Accesorios
          </button>
        </div>

        <div className="products__grid">
          {filteredProducts.map((product) => (
            <div
              className="products__card"
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedProduct(product)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedProduct(product);
                }
              }}
            >
              <div className="products__card-image">📷 Imagen producto</div>
              <div className="products__card-rating">
                <Stars count={product.rating} />
              </div>
              <div className="products__card-name">{product.name}</div>
              <div className="products__card-price">
                <span className="products__card-price-current">${product.price}</span>
                <span className="products__card-price-original">${product.originalPrice}</span>
              </div>
              <button
                type="button"
                className="products__card-btn"
                onClick={(event) => handleQuickAdd(event, product)}
              >
                Agregar al Carrito
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};

export default ProductsSection;
