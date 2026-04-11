import Link from 'next/link';
import './HeroSection.scss';
import Image from 'next/image';
import perroHero from '@assets/perro_hero.png';

const HeroSection = () => {
  return (
    <section className="hero" id="hero">
      <div className="hero__dots hero__dots--left" />
      <div className="hero__dots hero__dots--right" />

      <div className="hero__container">
        <div className="hero__content">
          <span className="hero__badge">Tu Pet Shop de Confianza</span>
          <h1 className="hero__title">
            Todo para tu mascota en un solo <span>lugar</span>.
          </h1>
          <p className="hero__description">
            Alimento premium, juguetes irresistibles, accesorios y todo lo que tu
            mejor amigo necesita para ser feliz. Calidad garantizada con envío a
            todo México.
          </p>
          <Link href="/productos" className="hero__cta">
            Explorar Tienda <span className="hero__cta-arrow">→</span>
          </Link>
        </div>

        <div className="hero__image-wrapper">
          <div className="hero__floating-badge hero__floating-badge--top">
            <span className="hero__floating-icon hero__floating-icon--yellow">🐾</span>
            +500 Productos
          </div>
          <div className="hero__image-blob">
            <div className="hero__image-placeholder">
              <Image
                src={perroHero}
                alt="Mascota feliz con productos de la tienda"
                width={400}
                height={400}
                loading="eager"
                className="hero__image"
              />
            </div>
          </div>
          <div className="hero__floating-badge hero__floating-badge--bottom">
            <span className="hero__floating-icon hero__floating-icon--pink">❤️</span>
            +5,000 mascotas felices
          </div>
        </div>
      </div>

      <div className="hero__wave">
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

export default HeroSection;
