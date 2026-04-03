import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import NavbarServer from "@/components/shared/NavbarServer";
import Footer from "@/components/shared/Footer";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/AuthProvider";

// Set up the Kanit font from Google Fonts
const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Siriraj 136 Website",
  description: "Academic website for Siriraj 136 student community",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/apple.png",
    apple: "/apple.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.className} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider attribute="class" enableSystem defaultTheme="light">
            <NavbarServer />
            <main>{children}</main>
            <Footer />
          </ThemeProvider>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-R8MS3KCQTR"
          ></Script>
          <Script>
            {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-R8MS3KCQTR');`}
          </Script>
        </AuthProvider>
      </body>
    </html>
  );
}
