import type { Metadata, Viewport } from "next";
import { Playfair_Display, Quicksand } from "next/font/google";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeCompritas — Publicidad en Redes Sociales",
  description:
    "Gestionamos tus campañas de publicidad en Facebook, Instagram y TikTok. Resultados medibles, pagos seguros por PayPal.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#003087",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${quicksand.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-[color:var(--color-cream)] font-sans overflow-x-hidden" suppressHydrationWarning>
        {children}
        <WhatsAppButton variant="floating" />
      </body>
    </html>
  );
}
