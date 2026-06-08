import { Roboto, Open_Sans } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const viewport = {
  themeColor: "#080c14",
};

export const metadata = {
  title: "Proyección y Extrapolación Segunda Vuelta 2026 · ONPE Oficial",
  description: "Dashboard premium de proyección y extrapolación matemática al 100% de actas contabilizadas para las elecciones presidenciales de segunda vuelta en Perú 2026.",
  keywords: "elecciones 2026, segunda vuelta peru, ONPE api, extrapolacion electoral, Keiko Fujimori, Roberto Sanchez, ciencia de datos electoral",
  authors: [{ name: "Antigravity Data Analytics" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${roboto.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
