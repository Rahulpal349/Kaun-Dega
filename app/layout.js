import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
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

import LayoutWrapper from './LayoutWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${plexMono.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-sans min-h-screen bg-[#F4FBF7] text-text-main antialiased selection:bg-primary/20 selection:text-primary">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

