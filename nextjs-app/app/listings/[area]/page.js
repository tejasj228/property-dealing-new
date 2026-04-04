import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Properties from '@/components/Properties';

export const metadata = {
  title: 'Property Listings - Pawan Buildhome',
  description: 'Browse property listings in your selected area.',
};

export default function ListingsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 20px' }}>Loading...</div>}>
        <Properties />
      </Suspense>
    </ErrorBoundary>
  );
}
