'use client';

import { useState, useMemo } from 'react';
import usePublicCart from '@store/usePublicCart';
import { PRODUCTS, CATEGORIES } from './data/products';
import ProductModal from './components/ProductModal/ProductModal';
import './Productos.scss';

const Stars = ({ count = 5, max = 5 }) => (
  <>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={i < count ? 'prod__star' : 'prod__star prod__star--empty'}>★</span>
    ))}
  </>
);

const Productos = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const addItem = usePublicCart((s) => s.addItem);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  return (
    <section className="prod">
      {/* ─── Header ─── */}
      <div className="prod__hero">
        <div className="prod__hero-content">
          <p className="prod__eyebrow">Catálogo Completo</p>
          <h1 className="prod__title">Nuestros Productos</h1>
          <p className="prod__subtitle">
            Encuentra todo lo que tu mascota necesita. Alimentos, snacks, juguetes y más.
          </p>
        </div>
      </div>

      <div className="prod__container">
        {/* ─── Filters ─── */}
        <div className="prod__filters">
          <div className="prod__search-wrapper">
            <svg className="prod__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="prod__search"
              placeholder="Buscar productos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="prod__categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`prod__cat-btn ${activeCategory === cat.id ? 'prod__cat-btn--active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Results Count ─── */}
        <p className="prod__results-count">
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* ─── Grid ─── */}
        {filtered.length === 0 ? (
          <div className="prod__empty">
            <span>🔍</span>
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="prod__grid">
            {filtered.map((product) => {
              const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return (
                <div
                  className="prod__card"
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="prod__card-image">
                    📷
                    {discount > 0 && (
                      <span className="prod__card-discount">-{discount}%</span>
                    )}
                  </div>
                  <div className="prod__card-body">
                    <div className="prod__card-rating">
                      <Stars count={product.rating} />
                    </div>
                    <h3 className="prod__card-name">{product.name}</h3>
                    {product.weight && (
                      <span className="prod__card-weight">{product.weight}</span>
                    )}
                    <div className="prod__card-prices">
                      <span className="prod__card-price">${product.price.toFixed(2)}</span>
                      {product.originalPrice > product.price && (
                        <span className="prod__card-original">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      className="prod__card-btn"
                      onClick={(e) => handleQuickAdd(e, product)}
                    >
                      🛒 Agregar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Product Modal ─── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};

export default Productos;
