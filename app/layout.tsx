import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Rescue Bird",
  description: "Emergency alert and rescue coordination for Bangladesh"
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
             __html: `
               (function() {
                 try {
                   var theme = localStorage.getItem("rescue-bird-theme") || "light";
                   document.documentElement.setAttribute("data-theme", theme);
                 } catch (e) {}
               })();
             `,
          }}
        />
      </head>
      <body className={`${manrope.variable} ${sora.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
