import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/legacy-dashboard.scss';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Hercules AI — Intelligent Document Processing',
  description: 'AI-powered platform for automated document extraction, classification, and organization. Process medical records, financial reports, and more with 99.7% accuracy.',
  keywords: 'AI, document processing, medical records, data extraction, OCR, NLP',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
