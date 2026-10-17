'use client';
import BrandIcon from './BrandIcon';
import { useEffect, useState } from 'react';
import './ScrollToTop.css';
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const update = () => setVisible(window.scrollY > 500); window.addEventListener('scroll', update, { passive: true }); update(); return () => window.removeEventListener('scroll', update); }, []);
  return <button className={`scroll-to-top ${visible ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} aria-label="Scroll to top"><BrandIcon className="fas fa-chevron-up" aria-hidden="true"  /></button>;
}
