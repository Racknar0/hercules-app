'use client';

import Link from 'next/link';
import usePublicCart from '@store/usePublicCart';
import './CartSidebar.scss';

const CartSidebar = () => {
  const items = usePublicCart((s) => s.items);
  const sidebarOpen = usePublicCart((s) => s.sidebarOpen);
  const closeSidebar = usePublicCart((s) => s.closeSidebar);
  const updateQty = usePublicCart((s) => s.updateQty);
  const removeItem = usePublicCart((s) => s.removeItem);
  const getTotal = usePublicCart((s) => s.getTotal);

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && <div className="cart-sidebar__overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <div className={`cart-sidebar ${sidebarOpen ? 'cart-sidebar--open' : ''}`}>
        {/* Header */}
        <div className="cart-sidebar__header">
          <h3 className="cart-sidebar__title">
            🛒 Carrito
            <span className="cart-sidebar__count">({items.length})</span>
          </h3>
          <button className="cart-sidebar__close" onClick={closeSidebar} aria-label="Cerrar carrito">
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="cart-sidebar__body">
          {items.length === 0 ? (
            <div className="cart-sidebar__empty">
              <span className="cart-sidebar__empty-icon">🛒</span>
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-sidebar__item" key={item.id}>
                <div className="cart-sidebar__item-img">📷</div>
                <div className="cart-sidebar__item-info">
                  <div className="cart-sidebar__item-name">{item.name}</div>
                  <div className="cart-sidebar__item-price">${item.price.toFixed(2)}</div>
                  <div className="cart-sidebar__item-controls">
                    <button
                      className="cart-sidebar__qty-btn"
                      onClick={() => updateQty(item.id, item.qty - 1)}
                    >−</button>
                    <span className="cart-sidebar__qty">{item.qty}</span>
                    <button
                      className="cart-sidebar__qty-btn"
                      onClick={() => updateQty(item.id, item.qty + 1)}
                    >+</button>
                    <button
                      className="cart-sidebar__remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                    >🗑</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-sidebar__footer">
            <div className="cart-sidebar__total">
              <span>Subtotal</span>
              <strong>${getTotal().toFixed(2)}</strong>
            </div>
            <Link
              href="/carrito"
              className="cart-sidebar__view-cart"
              onClick={closeSidebar}
            >
              Ver Carrito Completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
