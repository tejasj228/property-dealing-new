'use client';

import { LazyMotion, domAnimation } from 'motion/react';
import { Navigation, Footer, useSiteTheme } from './SiteElements';
import ScrollToTop from './ScrollToTop';
import styles from './landing/Landing.module.css';
import './PublicPages.css';

export default function LegacyChrome({ children }) {
  const { theme, changeTheme } = useSiteTheme();
  return <LazyMotion features={domAnimation} strict><div className={`${styles.landing} public-pages`} data-theme={theme}>
    <Navigation theme={theme} onThemeChange={changeTheme} />
    <main id="landing-content">{children}</main>
    <Footer />
    <ScrollToTop />
  </div></LazyMotion>;
}
