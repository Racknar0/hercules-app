import Link from 'next/link';
import './PromoSection.scss';

const PromoSection = () => {
  return (
    <section className="promo">
      <div className="promo__wave promo__wave--top">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0,30 C120,10 240,50 360,30 C480,10 600,50 720,30 C840,10 960,50 1080,30 C1200,10 1320,50 1440,30 L1440,0 L0,0 Z"
            fill="#FDF8F1"
          />
        </svg>
      </div>

      <div className="promo__container">
        <div className="promo__image-wrapper">
          <div className="promo__image-placeholder">📷 Imagen promo</div>
        </div>

        <div className="promo__content">
          <span className="promo__discount">Ahorra 20%</span>
          <h2 className="promo__title">Consiente a tu mascota con lo mejor</h2>
          <p className="promo__text">
            Aprovecha nuestra oferta en alimento, juguetes y accesorios.
            Todo lo que necesitas para que tu compañero peludo viva su mejor vida.
          </p>
          <Link href="/productos" className="promo__cta">
            Ver Ofertas <span>→</span>
          </Link>
        </div>
      </div>

      <div className="promo__wave promo__wave--bottom">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0,30 C120,50 240,10 360,30 C480,50 600,10 720,30 C840,50 960,10 1080,30 C1200,50 1320,10 1440,30 L1440,60 L0,60 Z"
            fill="#FDF8F1"
          />
        </svg>
      </div>
    </section>
  );
};

export default PromoSection;
