import './globals.css';
import '@/styles/legacy-dashboard.scss';

export const metadata = {
  title: 'Hercules App',
  description: 'Zona publica y dashboard privado de Hercules',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
