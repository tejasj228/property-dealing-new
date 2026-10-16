'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import PointerCursor from './PointerCursor';

const LegacyChrome = dynamic(() => import('./LegacyChrome'));

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  return <><PointerCursor />{pathname === '/' ? children : <LegacyChrome>{children}</LegacyChrome>}</>;
}
