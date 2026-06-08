import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-title",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
    <html lang="es" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
