export const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'alimento', label: 'Alimento' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'accesorios', label: 'Accesorios' },
  { id: 'higiene', label: 'Higiene' },
  { id: 'juguetes', label: 'Juguetes' },
];

export const PRODUCTS = [
  // ─── Alimento ───
  { id: 1, name: 'Alimento Premium Pollo', category: 'alimento', price: 24.99, originalPrice: 32.99, rating: 5, description: 'Alimento premium de pollo con fórmula especial para perros adultos. Rico en proteínas y ácidos grasos esenciales para un pelaje brillante y una salud óptima.', weight: '5 kg' },
  { id: 2, name: 'Croquetas Cachorro', category: 'alimento', price: 19.99, originalPrice: 26.99, rating: 5, description: 'Fórmula especial para cachorros en crecimiento. Contiene DHA para el desarrollo cerebral y calcio para huesos fuertes.', weight: '3 kg' },
  { id: 3, name: 'Alimento Gato Adulto', category: 'alimento', price: 22.50, originalPrice: 28.00, rating: 4, description: 'Alimento completo para gatos adultos con sabor a salmón. Fórmula balanceada con taurina para la salud ocular y cardíaca.', weight: '4 kg' },
  { id: 4, name: 'Omega Fish Blend', category: 'alimento', price: 29.99, originalPrice: 36.99, rating: 4, description: 'Blend premium de pescado con omega 3 y 6. Ideal para perros con piel sensible y alergias alimentarias.', weight: '5 kg' },

  // ─── Snacks ───
  { id: 5, name: 'Snack Natural de Carne', category: 'snacks', price: 12.50, originalPrice: 16.00, rating: 4, description: 'Deliciosos snacks deshidratados de carne real. Sin conservantes ni colorantes artificiales. Perfecto para entrenamiento.', weight: '200 g' },
  { id: 6, name: 'Galletas Dentales', category: 'snacks', price: 8.99, originalPrice: 12.99, rating: 5, description: 'Galletas formuladas para la limpieza dental. Reducen el sarro y refrescan el aliento de tu mascota.', weight: '300 g' },
  { id: 7, name: 'Premios de Pollo', category: 'snacks', price: 10.50, originalPrice: 14.00, rating: 4, description: 'Premios de pollo deshidratado 100% natural. Ricos en proteína y bajos en grasa. Irresistibles para tu perro.', weight: '150 g' },

  // ─── Accesorios ───
  { id: 8, name: 'Correa Ajustable Sport', category: 'accesorios', price: 18.99, originalPrice: 24.99, rating: 5, description: 'Correa deportiva ajustable con mango acolchado y reflectante para paseos nocturnos. Material resistente y ligero.', weight: '250 g' },
  { id: 9, name: 'Comedero Antideslizante', category: 'accesorios', price: 14.99, originalPrice: 19.99, rating: 4, description: 'Comedero de acero inoxidable con base de goma antideslizante. Fácil de lavar y resistente a los arañazos.', weight: '350 g' },
  { id: 10, name: 'Cama Ortopédica Premium', category: 'accesorios', price: 45.99, originalPrice: 59.99, rating: 5, description: 'Cama ortopédica con espuma de memoria para mascotas. Ideal para perros mayores o con problemas articulares. Funda lavable.', weight: '2 kg' },

  // ─── Higiene ───
  { id: 11, name: 'Shampoo Pelo Largo', category: 'higiene', price: 11.99, originalPrice: 15.99, rating: 4, description: 'Shampoo especial para razas de pelo largo. Desenreda, nutre e hidrata. Con extracto de avena y vitamina E.', weight: '500 ml' },
  { id: 12, name: 'Toallitas Húmedas', category: 'higiene', price: 6.99, originalPrice: 9.99, rating: 4, description: 'Toallitas húmedas hipoalergénicas para la limpieza diaria de tu mascota. Sin alcohol ni parabenos.', weight: '80 uds' },

  // ─── Juguetes ───
  { id: 13, name: 'Pelota Indestructible', category: 'juguetes', price: 9.99, originalPrice: 13.99, rating: 5, description: 'Pelota de caucho natural ultra resistente. Perfecta para perros mordedores. Flota en el agua y rebota alto.', weight: '180 g' },
  { id: 14, name: 'Cuerda Dental Multicolor', category: 'juguetes', price: 7.50, originalPrice: 10.00, rating: 4, description: 'Cuerda de algodón trenzada que ayuda a limpiar los dientes mientras juega. Múltiples colores disponibles.', weight: '200 g' },
  { id: 15, name: 'Ratón con Catnip', category: 'juguetes', price: 5.99, originalPrice: 8.99, rating: 5, description: 'Ratón de peluche relleno de catnip orgánico. Estimula el instinto cazador de tu gato y lo mantiene activo.', weight: '50 g' },
  { id: 16, name: 'Kong Rellenable', category: 'juguetes', price: 15.99, originalPrice: 21.99, rating: 5, description: 'Juguete rellenable de caucho natural. Perfecto para mantener a tu perro entretenido por horas. Resistente y seguro.', weight: '220 g' },
];
