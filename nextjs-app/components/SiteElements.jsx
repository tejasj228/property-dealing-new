'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m, useReducedMotion } from 'motion/react';
import styles from './landing/Landing.module.css';

function Icon({ name, className = '' }) {
  return <i className={`fa-solid fa-${name} ${className}`} aria-hidden="true" />;
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <m.div className={className} initial={false}
      whileInView={reduce ? undefined : { opacity: [0.65, 1] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </m.div>
  );
}

export function Navigation({ theme, onThemeChange }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const close = () => setOpen(false);
  return (
    <header className={styles.header}>
      <a href="#landing-content" className={styles.skipLink}>Skip to content</a>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.wordmark} aria-label="Pawan Buildhome home">
          <span>Pawan</span><span>Buildhome<span className={styles.brandDot}>.</span></span>
        </Link>
        <div id="landing-navigation" className={`${styles.navLinks} ${open ? styles.navOpen : ''}`}>
          <Link href="/" onClick={close} aria-current={pathname === "/" ? "page" : undefined}>Home</Link>
          <Link href="/properties" onClick={close} aria-current={pathname?.startsWith("/propert") || pathname?.startsWith("/listings") ? "page" : undefined}>Properties</Link>
          <a href="/#areas" onClick={close}>Our Areas</a>
          <Link href="/contact" onClick={close} aria-current={pathname === "/contact" ? "page" : undefined}>Contact <Icon name="arrow-up-right-from-square" /></Link>
        </div>
        <div className={styles.navActions}>
          <button type="button" className={styles.iconButton} onClick={onThemeChange} aria-label="Switch light or dark theme" title="Switch theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <a className={styles.navPhone} href="tel:+919811186086"><Icon name="phone" /><span>Let’s talk</span></a>
          <button type="button" className={`${styles.iconButton} ${styles.menuButton}`} aria-controls="landing-navigation" aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(value => !value)}>
            <Icon name={open ? 'xmark' : 'bars'} />
          </button>
        </div>
      </nav>
    </header>
  );
}
export function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.contactBand}>
      <Reveal><p>Let’s find your place.</p><a href="tel:+919811186086">Start a conversation <Icon name="arrow-up-right-from-square" /></a></Reveal>
      <span>Residential & commercial property in NCR</span>
    </div>
    <div className={styles.footerGrid}>
      <div className={styles.footerBrand}><Link href="/" className={styles.wordmark}><span>Pawan</span><span>Buildhome<span className={styles.brandDot}>.</span></span></Link><p>Your trusted partner in real estate excellence.</p></div>
      <div className={styles.footerOffice}><h3>Visit us in Noida</h3><a href="https://maps.app.goo.gl/F4oyJaHCwG5fEHzn8?g_st=iw" target="_blank" rel="noopener noreferrer">Shop No.1, SKYTECH MATROTT,<br />Aditya Celebrity Homes, Sector 76,<br />Noida, U.P. 201316 <Icon name="arrow-up-right-from-square" /></a></div>
      <div className={styles.footerOffice}><h3>Visit us in Greater Noida</h3><a href="https://maps.google.com/?q=28.306482,77.558189" target="_blank" rel="noopener noreferrer">GF 90 & 96 Gaur Runway Suites,<br />Gaur Yamuna City Sec-19, Yamuna Expressway,<br />Greater Noida - 203201 <Icon name="arrow-up-right-from-square" /></a></div>
      <div className={styles.footerContact}><h3>Get in touch</h3><a href="tel:+919811186086">+91-9811186086</a><a href="tel:+919811186083">+91-9811186083</a><a href="tel:01203244364">0120-3244364</a><a href="mailto:pawan127jitendra@gmail.com">pawan127jitendra@gmail.com</a></div>
    </div>
    <div className={styles.footerBottom}><p>© 2025 Pawan Buildhome. All rights reserved.</p><div><a href="/#areas">Our Areas</a><Link href="/properties">Properties</Link><Link href="/contact">Contact</Link><a href="https://www.instagram.com/pawan.buildhome?igsh=MXNib2M3NmdlcDdlZQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Pawan Buildhome on Instagram"><i className="fa-brands fa-instagram" aria-hidden="true" /></a></div></div>
  </footer>;
}


export function useSiteTheme() {
  const [theme, setTheme] = useState('system');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      let stored;
      try { stored = localStorage.getItem('theme'); } catch { /* Storage is optional. */ }
      setTheme(stored === 'dark' || stored === 'light' ? stored : media.matches ? 'dark' : 'light');
    };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const changeTheme = () => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = isDark ? 'light' : 'dark'; setTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* The current visit still uses the chosen theme. */ }
  };
  return { theme, changeTheme };
}
