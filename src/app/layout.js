import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Luckiest_Guy, Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-luckiest-guy",
  display: "swap",
});

export const metadata = {
  title: "Losrones Web",
  description: "Panel y sitio publico de Losrones",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} ${luckiestGuy.variable}`}>{children}</body>
    </html>
  );
}
