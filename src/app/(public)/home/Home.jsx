import HeroSection from './components/HeroSection/HeroSection';
import FeaturesSection from './components/FeaturesSection/FeaturesSection';
import ProductsSection from './components/ProductsSection/ProductsSection';
import PromoSection from './components/PromoSection/PromoSection';
import WhyUsSection from './components/WhyUsSection/WhyUsSection';
import TestimonialsSection from './components/TestimonialsSection/TestimonialsSection';
import CtaBanner from './components/CtaBanner/CtaBanner';
import FooterSection from './components/FooterSection/FooterSection';

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ProductsSection />
      <PromoSection />
      <WhyUsSection />
      <TestimonialsSection />
      <CtaBanner />
      <FooterSection />
    </>
  );
};

export default Home;
