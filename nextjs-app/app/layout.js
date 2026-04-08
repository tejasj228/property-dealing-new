import './globals.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Pawan Buildhome - Premium Real Estate in NCR',
  description: 'Your trusted partner in real estate excellence. We provide premium property solutions across key locations in NCR including Noida, Greater Noida, and Ghaziabad.',
  keywords: 'real estate, properties, NCR, Noida, Greater Noida, Ghaziabad, Pawan Buildhome',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="App">
          <Header />
          <main>
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <Analytics />
        </div>
      </body>
    </html>
  );
}
