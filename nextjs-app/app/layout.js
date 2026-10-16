import './globals.css';
import localFont from 'next/font/local';
const manrope = localFont({ src: '../public/fonts/manrope/Manrope-Variable.ttf', display: 'swap', variable: '--font-manrope' });
import '@fortawesome/fontawesome-free/css/all.min.css';
import SiteChrome from '@/components/SiteChrome';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Pawan Buildhome - Premium Real Estate in NCR',
  description: 'Your trusted partner in real estate excellence. We provide premium property solutions across key locations in NCR including Noida, Greater Noida, and Ghaziabad.',
  keywords: 'real estate, properties, NCR, Noida, Greater Noida, Ghaziabad, Pawan Buildhome',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={manrope.variable}>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
