import ErrorBoundary from '@/components/ErrorBoundary';
import LandingPage from '@/components/landing/LandingPage';
import { getLandingData } from '@/lib/landing-data';

export const revalidate = 300;

export const metadata = {
  title: 'Pawan Buildhome - Premium Real Estate in NCR',
  description: 'Explore premium residential and commercial properties in NCR. Find your dream property with Pawan Buildhome.',
};

export default async function HomePage() {
  const content = await getLandingData();
  return (
    <ErrorBoundary>
      <LandingPage content={content} />
    </ErrorBoundary>
  );
}
