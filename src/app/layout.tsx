import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlackCut Finance",
  description: "Gestão financeira da BlackCut Barber",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#150811",
};

const SCRIPT_TEMA = `
  (function () {
    var hora = new Date().getHours();
    var tema = hora >= 6 && hora < 18 ? "day" : "night";
    document.documentElement.setAttribute("data-theme", tema);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${cinzel.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black-deep text-white font-body">
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}