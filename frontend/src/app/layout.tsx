import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Empleo Plus 40", template: "%s · Empleo Plus 40" },
  description:
    "Encuentra empleo después de los 40. Creamos tu perfil con honestidad, " +
    "traducimos tu experiencia y te ayudamos a conseguir entrevistas.",
  applicationName: "Empleo Plus 40",
};

// Color de la barra del navegador acorde al tema oscuro fijo.
export const viewport: Viewport = {
  themeColor: "#0B1020",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
