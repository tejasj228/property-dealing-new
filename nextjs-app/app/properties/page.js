import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Properties from '@/components/Properties';

export const metadata = {
  title: 'Properties - Pawan Buildhome',
  description: 'Browse our extensive collection of residential and commercial properties across NCR.',
};

function PropertiesFallback() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
      <p>Loading properties...</p>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PropertiesFallback />}>
        <Properties />
      </Suspense>
    </ErrorBoundary>
  );
}
