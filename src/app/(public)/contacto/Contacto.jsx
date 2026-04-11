'use client';

import './Contacto.scss';

const TIENDAS = [
  {
    name: 'CDMX — Condesa',
    address: 'Av. Tamaulipas 150, Col. Condesa, CP 06140, Ciudad de México',
    phone: '+52 55 1234 5678',
    hours: 'Lun-Sáb: 9:00 - 20:00 | Dom: 10:00 - 17:00',
    lat: 19.4127,
    lng: -99.1736,
  },
  {
    name: 'CDMX — Polanco',
    address: 'Av. Presidente Masaryk 320, Col. Polanco, CP 11560, Ciudad de México',
    phone: '+52 55 2345 6789',
    hours: 'Lun-Sáb: 10:00 - 21:00 | Dom: 11:00 - 18:00',
    lat: 19.4330,
    lng: -99.1910,
  },
  {
    name: 'Guadalajara — Providencia',
    address: 'Av. Providencia 2540, Col. Providencia, CP 44630, Guadalajara, Jalisco',
    phone: '+52 33 3456 7890',
    hours: 'Lun-Sáb: 9:00 - 20:00 | Dom: 10:00 - 16:00',
    lat: 20.6870,
    lng: -103.3940,
  },
  {
    name: 'Monterrey — San Pedro',
    address: 'Calzada del Valle 400, Col. Del Valle, CP 66220, San Pedro Garza García, N.L.',
    phone: '+52 81 4567 8901',
    hours: 'Lun-Sáb: 9:00 - 20:00 | Dom: 10:00 - 17:00',
    lat: 25.6510,
    lng: -100.3560,
  },
];

const Contacto = () => {
  return (
    <section className="contact">
      {/* ─── Hero ─── */}
      <div className="contact__hero">
        <p className="contact__eyebrow">Encuéntranos</p>
        <h1 className="contact__title">Contáctanos</h1>
        <p className="contact__subtitle">
          Visítanos en cualquiera de nuestras 4 tiendas o escríbenos por WhatsApp.
        </p>
      </div>

      <div className="contact__container">
        {/* ─── Store Cards ─── */}
        <div className="contact__stores">
          {TIENDAS.map((t, i) => (
            <div className="contact__store" key={i}>
              <div className="contact__store-icon">📍</div>
              <h3 className="contact__store-name">{t.name}</h3>
              <p className="contact__store-address">{t.address}</p>
              <div className="contact__store-detail">
                <span>📞 {t.phone}</span>
              </div>
              <div className="contact__store-detail">
                <span>🕒 {t.hours}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${t.lat},${t.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact__store-link"
              >
                Ver en Google Maps →
              </a>
            </div>
          ))}
        </div>

        {/* ─── Map ─── */}
        <div className="contact__map-section">
          <h2 className="contact__section-title">Nuestras Ubicaciones</h2>
          <div className="contact__map-wrapper">
            <iframe
              className="contact__map"
              title="Ubicaciones Losrones"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7667725.697421684!2d-104.0!3d23.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84043a3b88685353%3A0xed64b4be6b099811!2sMexico!5e0!3m2!1ses!2smx!4v1234567890"
              width="100%"
              height="500"
              style={{ border: 0, borderRadius: '20px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Fallback static pins overlay */}
            <div className="contact__map-pins">
              {TIENDAS.map((t, i) => (
                <div
                  key={i}
                  className="contact__map-pin"
                  title={t.name}
                  style={{
                    // Approximate pixel positions for Mexico map
                    left: `${((t.lng + 105) / 10) * 100}%`,
                    top: `${((28 - t.lat) / 12) * 100}%`,
                  }}
                >
                  <span className="contact__pin-dot" />
                  <span className="contact__pin-label">{t.name.split('—')[0].trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Contact Info ─── */}
        <div className="contact__info-section">
          <div className="contact__info-card">
            <span className="contact__info-icon">💬</span>
            <h3>WhatsApp</h3>
            <p>Escríbenos al +52 55 1234 5678</p>
            <a
              href="https://wa.me/525512345678"
              target="_blank"
              rel="noopener noreferrer"
              className="contact__info-btn contact__info-btn--whatsapp"
            >
              Enviar Mensaje
            </a>
          </div>
          <div className="contact__info-card">
            <span className="contact__info-icon">✉️</span>
            <h3>Email</h3>
            <p>info@losrones.com</p>
            <a href="mailto:info@losrones.com" className="contact__info-btn">
              Enviar Email
            </a>
          </div>
          <div className="contact__info-card">
            <span className="contact__info-icon">📱</span>
            <h3>Redes Sociales</h3>
            <p>@losrones en todas las plataformas</p>
            <a href="#" className="contact__info-btn">
              Seguirnos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacto;
