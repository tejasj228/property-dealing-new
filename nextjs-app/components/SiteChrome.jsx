'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const LegacyChrome = dynamic(() => import('./LegacyChrome'));

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  if (pathname === '/') return children;

  return <LegacyChrome>{children}</LegacyChrome>;
}
