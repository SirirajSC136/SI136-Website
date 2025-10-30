import './globals.css'
import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import Navbar from '@/app/components/shared/Navbar'
import Footer from './components/shared/Footer'
import { ThemeProvider } from 'next-themes'

// Set up the Kanit font from Google Fonts
const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SI136 Website',
  description: 'Academic website for Siriraj 136',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.className}  suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" enableSystem defaultTheme='light' >
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
