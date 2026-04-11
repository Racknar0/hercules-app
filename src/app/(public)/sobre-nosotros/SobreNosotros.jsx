import './SobreNosotros.scss';

const VALORES = [
  { icon: '🌿', title: 'Naturalidad', text: 'Cada ingrediente es seleccionado por su calidad y origen natural. Sin aditivos artificiales.' },
  { icon: '❤️', title: 'Pasión', text: 'Amamos lo que hacemos. Cada producto refleja nuestro compromiso con el bienestar animal.' },
  { icon: '🔬', title: 'Ciencia', text: 'Nuestras fórmulas son desarrolladas con la guía de veterinarios y nutricionistas expertos.' },
  { icon: '🤝', title: 'Compromiso', text: 'Donamos trimestralmente a refugios de animales. Creemos en devolver a la comunidad.' },
];

const TEAM = [
  { name: 'Dr. Carlos Mendoza', role: 'Director de Nutrición', initials: 'CM' },
  { name: 'Ana García', role: 'Fundadora & CEO', initials: 'AG' },
  { name: 'Roberto Sánchez', role: 'Jefe de Producción', initials: 'RS' },
  { name: 'Dra. María Torres', role: 'Veterinaria en Jefe', initials: 'MT' },
];

const SobreNosotros = () => {
  return (
    <section className="about">
      {/* ─── Hero ─── */}
      <div className="about__hero">
        <p className="about__eyebrow">Nuestra Historia</p>
        <h1 className="about__title">Sobre Nosotros</h1>
        <p className="about__subtitle">
          Desde 2018 transformando la nutrición animal en México con productos naturales y de calidad premium.
        </p>
      </div>

      <div className="about__container">
        {/* ─── Story ─── */}
        <div className="about__story">
          <div className="about__story-img">📷 Imagen de equipo</div>
          <div className="about__story-content">
            <h2 className="about__story-title">Cómo empezó todo</h2>
            <p>
              Losrones nació en 2018 de la frustración de nuestra fundadora, Ana García, al no encontrar
              alimentos verdaderamente naturales para su golden retriever, Max. Tras meses de investigación
              y el apoyo de veterinarios especialistas, desarrolló las primeras fórmulas de lo que hoy es
              Losrones.
            </p>
            <p>
              Lo que comenzó como un pequeño emprendimiento en la cocina de casa, hoy es una empresa con
              4 tiendas en México, un equipo de más de 50 personas y la confianza de más de 5,000 familias
              que eligen nuestros productos cada mes.
            </p>
            <p>
              Nuestro compromiso sigue siendo el mismo: ofrecer alimentos que realmente nutran, hechos con
              ingredientes que nosotros mismos comeríamos. Porque tu mascota merece lo mejor.
            </p>
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className="about__stats">
          <div className="about__stat">
            <span className="about__stat-number">5,000+</span>
            <span className="about__stat-label">Clientes felices</span>
          </div>
          <div className="about__stat">
            <span className="about__stat-number">4</span>
            <span className="about__stat-label">Tiendas en México</span>
          </div>
          <div className="about__stat">
            <span className="about__stat-number">50+</span>
            <span className="about__stat-label">Productos</span>
          </div>
          <div className="about__stat">
            <span className="about__stat-number">8</span>
            <span className="about__stat-label">Años de experiencia</span>
          </div>
        </div>

        {/* ─── Values ─── */}
        <div className="about__values-section">
          <h2 className="about__section-title">Nuestros Valores</h2>
          <div className="about__values">
            {VALORES.map((v, i) => (
              <div className="about__value-card" key={i}>
                <span className="about__value-icon">{v.icon}</span>
                <h3 className="about__value-title">{v.title}</h3>
                <p className="about__value-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Team ─── */}
        <div className="about__team-section">
          <h2 className="about__section-title">Nuestro Equipo</h2>
          <div className="about__team">
            {TEAM.map((t, i) => (
              <div className="about__team-card" key={i}>
                <div className="about__team-avatar">{t.initials}</div>
                <h3 className="about__team-name">{t.name}</h3>
                <p className="about__team-role">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SobreNosotros;
