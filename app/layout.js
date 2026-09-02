import { Fraunces, Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import BottomNav from '../components/BottomNav';
import { AuthProvider } from '../lib/AuthContext';

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-body min-h-screen bg-gray-200 relative antialiased flex justify-center">
        {/* 
          Wrapper for mobile device view on desktop. 
          transform translate-x-0 ensures 'fixed' position elements inside act relative to this container.
        */}
        <div className="w-full max-w-md min-h-screen bg-green-50 relative shadow-2xl shadow-gray-400/20 flex flex-col overflow-x-hidden">
          <AuthProvider>
            {children}
            <BottomNav />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}

