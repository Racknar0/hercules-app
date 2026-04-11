'use client';

import { useState } from 'react';
import Link from 'next/link';
import usePublicCart from '@store/usePublicCart';
import './Carrito.scss';

const WHATSAPP_NUMBER = '525555555555'; // Cambiar al número real

const Carrito = () => {
  const items = usePublicCart((s) => s.items);
  const updateQty = usePublicCart((s) => s.updateQty);
  const removeItem = usePublicCart((s) => s.removeItem);
  const clearCart = usePublicCart((s) => s.clearCart);
  const getTotal = usePublicCart((s) => s.getTotal);
  const [enviado, setEnviado] = useState(false);

  const total = getTotal();
  const envio = total > 50 ? 0 : 5.99;
  const totalFinal = total + envio;

  const handleWhatsApp = () => {
    if (items.length === 0) return;

    let msg = '🛒 *Nuevo Pedido - Losrones*\n\n';
    items.forEach((item, i) => {
      msg += `${i + 1}. *${item.name}* x${item.qty} — $${(item.price * item.qty).toFixed(2)}\n`;
    });
    msg += `\n📦 Envío: ${envio === 0 ? 'GRATIS' : `$${envio.toFixed(2)}`}`;
    msg += `\n💰 *Total: $${totalFinal.toFixed(2)}*`;
    msg += '\n\n¡Gracias por tu compra! 🐾';

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, '_blank');
    setEnviado(true);
  };

  return (
    <section className="cart-page">
      <div className="cart-page__hero">
        <h1 className="cart-page__title">Tu Carrito</h1>
        <p className="cart-page__subtitle">Revisa tus productos antes de proceder al pago</p>
      </div>

      <div className="cart-page__container">
        {items.length === 0 ? (
          <div className="cart-page__empty">
            <span className="cart-page__empty-icon">🛒</span>
            <h2>Tu carrito está vacío</h2>
            <p>Explora nuestros productos y agrega lo que necesites.</p>
            <Link href="/productos" className="cart-page__empty-btn">Ver Productos</Link>
          </div>
        ) : (
          <div className="cart-page__layout">
            {/* ─── Items List ─── */}
            <div className="cart-page__items">
              <div className="cart-page__items-header">
                <span>{items.length} producto{items.length !== 1 ? 's' : ''}</span>
                <button className="cart-page__clear" onClick={clearCart}>
                  Vaciar carrito
                </button>
              </div>

              {items.map((item) => (
                <div className="cart-page__item" key={item.id}>
                  <div className="cart-page__item-img">📷</div>
                  <div className="cart-page__item-info">
                    <h3 className="cart-page__item-name">{item.name}</h3>
                    {item.weight && (
                      <span className="cart-page__item-weight">{item.weight}</span>
                    )}
                    <span className="cart-page__item-unit">${item.price.toFixed(2)} c/u</span>
                  </div>
                  <div className="cart-page__item-actions">
                    <div className="cart-page__qty-controls">
                      <button
                        className="cart-page__qty-btn"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >−</button>
                      <span className="cart-page__qty">{item.qty}</span>
                      <button
                        className="cart-page__qty-btn"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >+</button>
                    </div>
                    <span className="cart-page__item-total">${(item.price * item.qty).toFixed(2)}</span>
                    <button
                      className="cart-page__item-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Summary ─── */}
            <div className="cart-page__summary">
              <h3 className="cart-page__summary-title">Resumen del Pedido</h3>

              <div className="cart-page__summary-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="cart-page__summary-row">
                <span>Envío</span>
                <span className={envio === 0 ? 'cart-page__free' : ''}>
                  {envio === 0 ? 'GRATIS' : `$${envio.toFixed(2)}`}
                </span>
              </div>
              {envio > 0 && (
                <p className="cart-page__shipping-note">
                  Envío gratis en compras mayores a $50.00
                </p>
              )}
              <div className="cart-page__summary-divider" />
              <div className="cart-page__summary-row cart-page__summary-row--total">
                <span>Total</span>
                <strong>${totalFinal.toFixed(2)}</strong>
              </div>

              <button
                className={`cart-page__checkout ${enviado ? 'cart-page__checkout--sent' : ''}`}
                onClick={handleWhatsApp}
              >
                {enviado ? '✓ Pedido Enviado' : '💬 Proceder al Pago por WhatsApp'}
              </button>

              <Link href="/productos" className="cart-page__continue">
                ← Seguir Comprando
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Carrito;
