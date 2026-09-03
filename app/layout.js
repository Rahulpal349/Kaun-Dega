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
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-body min-h-screen bg-green-50 text-ink antialiased flex flex-col items-center">
        <div className="w-full max-w-lg min-h-screen flex flex-col bg-green-50 relative">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
