import Link from 'next/link';
import './CtaBanner.scss';

const CtaBanner = () => {
  return (
    <section className="cta-banner" id="cta">
      <div className="cta-banner__container">
        <h2 className="cta-banner__title">¿Listo para consentir a tu mascota?</h2>
        <p className="cta-banner__text">
          Explora nuestra tienda con más de 500 productos. Alimento, juguetes,
          accesorios y mucho más. Envío gratis a todo México.
        </p>
        <Link href="/productos" className="cta-banner__btn">
          Ir a la Tienda <span>→</span>
        </Link>
      </div>
    </section>
  );
};

export default CtaBanner;
