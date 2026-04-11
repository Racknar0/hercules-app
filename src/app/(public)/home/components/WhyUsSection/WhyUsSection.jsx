import './WhyUsSection.scss';

const WHY_US_ITEMS = [
  {
    icon: '🛍️',
    color: 'pink',
    title: 'Todo en un Solo Lugar',
    text: 'Alimento, juguetes, camas, correas, higiene y más. No necesitas ir a otra tienda, aquí encuentras todo para tu mascota.',
  },
  {
    icon: '🚚',
    color: 'yellow',
    title: 'Envío Rápido y Gratis',
    text: 'Recibe tu pedido en 24-48 horas. Envío gratis en compras mayores a $50. Porque tu mascota no puede esperar.',
  },
  {
    icon: '💛',
    color: 'plum',
    title: 'Atención Personalizada',
    text: 'Nuestro equipo de amantes de las mascotas te asesora para elegir lo mejor según la raza, edad y necesidades de tu compañero.',
  },
];

const WhyUsSection = () => {
  return (
    <section className="why-us" id="why-us">
      <div className="why-us__container">
        <p className="why-us__eyebrow">¿Por Qué Elegirnos?</p>
        <h2 className="why-us__title">La Tienda Favorita de las Mascotas</h2>

        <div className="why-us__grid">
          {WHY_US_ITEMS.map((item, idx) => (
            <div className="why-us__card" key={idx}>
              <div className={`why-us__card-icon why-us__card-icon--${item.color}`}>
                {item.icon}
              </div>
              <h3 className="why-us__card-title">{item.title}</h3>
              <p className="why-us__card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
