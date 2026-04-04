import ErrorBoundary from '@/components/ErrorBoundary';
import Contact from '@/components/Contact';

export const metadata = {
  title: 'Contact Us - Pawan Buildhome',
  description: 'Get in touch with Pawan Buildhome for all your real estate inquiries. We are here to help you find your perfect property.',
};

export default function ContactPage() {
  return (
    <ErrorBoundary>
      <Contact />
    </ErrorBoundary>
  );
}
