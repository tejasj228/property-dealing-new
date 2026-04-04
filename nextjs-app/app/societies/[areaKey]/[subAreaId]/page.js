import ErrorBoundary from '@/components/ErrorBoundary';
import Societies from '@/components/Societies';

export const metadata = {
  title: 'Societies - Pawan Buildhome',
  description: 'Explore societies and residential communities in our listed areas.',
};

export default function SocietiesPage() {
  return (
    <ErrorBoundary>
      <Societies />
    </ErrorBoundary>
  );
}
