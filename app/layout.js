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
  title: "Elecciones Presidenciales 2026 - Segunda Vuelta · Resultados ONPE y Proyecciones",
  description: "Resultados oficiales ONPE y proyecciones estadísticas al 100% de actas para las elecciones presidenciales de segunda vuelta en Perú 2026. Voto nacional y exterior en tiempo real.",
  keywords: "elecciones 2026, segunda vuelta peru, ONPE resultados, extrapolacion electoral, Keiko Fujimori, Roberto Sanchez, proyeccion electoral",
  authors: [{ name: "QM Solutions - Data Analytics Department" }],
  openGraph: {
    title: "Elecciones Presidenciales 2026 - Segunda Vuelta",
    description: "Resultados oficiales ONPE y proyecciones estadísticas al 100% de actas.",
    url: "https://ep2026.vercel.app",
    siteName: "Elecciones Perú 2026",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elecciones Presidenciales 2026 - Segunda Vuelta",
    description: "Resultados y Proyecciones Electorales al 100%",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${roboto.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
