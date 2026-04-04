import ErrorBoundary from '@/components/ErrorBoundary';
import PropertyDetail from '@/components/PropertyDetail';

export const metadata = {
  title: 'Property Details - Pawan Buildhome',
  description: 'View detailed information about this property listing.',
};

export default function PropertyDetailPage() {
  return (
    <ErrorBoundary>
      <PropertyDetail />
    </ErrorBoundary>
  );
}
