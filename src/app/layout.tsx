import type { Metadata, Viewport } from "next";
import { Playfair_Display, Quicksand } from "next/font/google";
import { StoreProvider } from "@/context/StoreContext";
import { DynamicTitle } from "@/components/DynamicTitle";
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
  title: "DeCompritas — Tienda Online",
  description: "Explora nuestro catálogo de productos y realiza tu pedido de forma fácil y rápida.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#b55ca6",
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
        <StoreProvider>
          <DynamicTitle />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}