

import Image from 'next/image';
import './FeaturesSection.scss';
import dogShopping from '@assets/dog_shopping.jpg';
import asesor_image from '@assets/asesor_image.webp';


const FeaturesSection = () => {
  return (
    <section className="features" id="features">
      <div className="features__container">
        <div className="features__card features__card--pink">
          <span className="features__eyebrow">Variedad Única</span>
          <h2 className="features__card-title">Miles de productos en un solo lugar</h2>
          <p className="features__card-text">
            Desde alimento premium hasta juguetes, camas, accesorios y productos
            de higiene. Todo lo que tu mascota necesita, siempre disponible.
          </p>
          <div className="features__card-image">
            <Image
              src={dogShopping}
              alt="Perro feliz con productos de la tienda"
              width={400}
              height={300}
              className="features__image"
            />
          </div>
        </div>

        <div className="features__card features__card--yellow">
          <span className="features__eyebrow">Asesoría Experta</span>
          <h2 className="features__card-title">Te ayudamos a elegir lo ideal</h2>
          <p className="features__card-text">
            Nuestro equipo de expertos en mascotas te guía para encontrar los
            productos perfectos según la raza, edad y necesidades de tu compañero.
          </p>
          <div className="features__card-image">
            <Image
              src={asesor_image}
              alt="Asesoría Experta"
              width={400}
              height={300}
              className="features__image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
