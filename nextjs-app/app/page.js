import ErrorBoundary from '@/components/ErrorBoundary';
import Home from '@/components/Home';

export const metadata = {
  title: 'Pawan Buildhome - Premium Real Estate in NCR',
  description: 'Explore premium residential and commercial properties in NCR. Find your dream property with Pawan Buildhome.',
};

export default function HomePage() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}
