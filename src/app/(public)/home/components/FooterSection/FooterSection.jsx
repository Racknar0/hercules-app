import Link from 'next/link';
import './FooterSection.scss';

const FooterSection = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer__container">
        <div>
          <div className="footer__brand-name">Losrones</div>
          <p className="footer__brand-desc">
            Tu tienda de mascotas favorita en México. Alimento, juguetes,
            accesorios y todo lo que tu compañero peludo necesita para ser feliz.
          </p>
        </div>

        <div>
          <h3 className="footer__col-title">Navegación</h3>
          <ul className="footer__links">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/productos">Productos</Link></li>
            <li><Link href="/noticias">Noticias</Link></li>
            <li><Link href="/sobre-nosotros">Sobre Nosotros</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="footer__col-title">Ayuda</h3>
          <ul className="footer__links">
            <li><Link href="/contacto">Contacto</Link></li>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Envíos y Devoluciones</a></li>
            <li><a href="#">Términos y Condiciones</a></li>
          </ul>
        </div>

        <div>
          <h3 className="footer__col-title">Contacto</h3>
          <ul className="footer__links">
            <li><a href="mailto:info@losrones.com">info@losrones.com</a></li>
            <li><a href="tel:+525555555555">+52 555 555 5555</a></li>
            <li><a href="#">Ciudad de México, MX</a></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copyright">© 2026 Losrones. Todos los derechos reservados.</p>
        <div className="footer__socials">
          <a href="#" className="footer__social-link" aria-label="Facebook">f</a>
          <a href="#" className="footer__social-link" aria-label="Instagram">ig</a>
          <a href="#" className="footer__social-link" aria-label="Twitter">x</a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
