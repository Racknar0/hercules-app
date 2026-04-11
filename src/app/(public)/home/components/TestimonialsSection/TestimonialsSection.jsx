import './TestimonialsSection.scss';

const TESTIMONIALS = [
  { name: 'María López', role: 'Mamá de Max (Golden)', text: 'Encontré todo lo que necesitaba: alimento premium, una cama ortopédica y juguetes. Max está feliz y yo también. ¡La mejor tienda de mascotas!', initials: 'ML' },
  { name: 'Carlos Rivera', role: 'Papá de Luna (Husky)', text: 'El envío fue súper rápido y la calidad de los productos es increíble. La correa deportiva que compré es perfecta para nuestras caminatas.', initials: 'CR' },
  { name: 'Ana Martínez', role: 'Mamá de Michi (Gato Persa)', text: 'Por fin una tienda que tiene variedad para gatos. Los juguetes con catnip volvieron loco a Michi y el alimento es de primera. Totalmente recomendada.', initials: 'AM' },
];

const TestimonialsSection = () => {
  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials__container">
        <p className="testimonials__eyebrow">Testimonios</p>
        <h2 className="testimonials__title">Familias que nos Eligen</h2>

        <div className="testimonials__grid">
          {TESTIMONIALS.map((t, idx) => (
            <div className="testimonials__card" key={idx}>
              <div className="testimonials__card-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span className="testimonials__star" key={i}>★</span>
                ))}
              </div>
              <p className="testimonials__card-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonials__card-author">
                <div className="testimonials__card-avatar">{t.initials}</div>
                <div>
                  <div className="testimonials__card-name">{t.name}</div>
                  <div className="testimonials__card-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
