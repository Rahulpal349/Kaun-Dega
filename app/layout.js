import { Fraunces, Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import BottomNav from '../components/BottomNav';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '700'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '600'],
});

export const viewport = {
  themeColor: '#145C4B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'Kaun Dega? — split expenses without the awkward math',
  description: 'Track group expenses, split them fair, and settle up over WhatsApp.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kaun Dega',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body className="font-body min-h-screen bg-paper pb-20 relative overflow-x-hidden">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
