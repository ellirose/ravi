import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Shippori_Mincho_B1 } from "next/font/google";
import { revealBootScript } from "@/components/revealBoot";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin", "latin-ext"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"], display: "swap", axes: ["opsz", "SOFT"] });
// Japanese glyphs are only used for accents; don't block first paint on them.
const shippori = Shippori_Mincho_B1({ variable: "--font-shippori", weight: ["500", "700"], subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Ravi Y.T. — Creative Developer · Tokyo",
  description:
    "Portfolio of Ravi Y.T., a Tokyo-based creative developer working across brand & graphic design, video & motion, and React / Next.js development.",
  openGraph: {
    title: "Ravi Y.T. — Creative Developer · Tokyo",
    description: "Design, motion & code — crafted with Japanese care.",
    images: ["/profile/ravi-03.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script sets data-reveal-js on <html> before hydration.
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable} ${shippori.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
