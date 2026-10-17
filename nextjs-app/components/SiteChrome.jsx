'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import PointerCursor from './PointerCursor';
import ReadingProgress from './ReadingProgress';

const LegacyChrome = dynamic(() => import('./LegacyChrome'));

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  return <><PointerCursor />{pathname === '/' ? <><ReadingProgress />{children}</> : <LegacyChrome>{children}</LegacyChrome>}</>;
}
