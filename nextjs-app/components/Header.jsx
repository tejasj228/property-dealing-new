'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import useAreas from '@/hooks/useAreas';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const { areasArray, areasLoading, areasError } = useAreas({
    autoLoad: true,
    fallbackToDefault: true,
    enableCache: false,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (pathname !== '/') {
      setIsTransparent(false);
      return;
    }

    let raf;
    let timeout;
    const handleScroll = () => {
      const hero = document.querySelector('.hero');
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
      setIsTransparent(window.scrollY < heroBottom - 80);
    };

    const runInitialCheck = () => {
      const hero = document.querySelector('.hero');
      if (hero) {
        handleScroll();
        window.addEventListener('scroll', handleScroll);
      } else {
        timeout = setTimeout(runInitialCheck, 50);
      }
    };

    raf = requestAnimationFrame(runInitialCheck);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handlePropertiesClick = () => {
    router.push('/properties');
    setIsMenuOpen(false);
  };

  const handleAreaClick = (areaKey) => {
    router.push(`/properties?area=${areaKey}`);
    setIsMenuOpen(false);
  };

  const handleNavClick = () => setIsMenuOpen(false);

  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/contact') return 'contact';
    if (pathname === '/properties' || pathname?.startsWith('/listings')) return 'properties';
    return '';
  };

  const currentPage = getCurrentPage();

  const renderAreasDropdown = () => {
    if (areasLoading) {
      return (
        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '5px' }}></i>
          Loading areas...
        </div>
      );
    }

    if (areasError) {
      return (
        <div style={{ padding: '10px', textAlign: 'center', color: '#e74c3c' }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '5px' }}></i>
          Using default areas
        </div>
      );
    }

    if (areasArray.length === 0) {
      return <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>No areas available</div>;
    }

    return areasArray.map((area) => (
      <a key={area.key} href="#" onClick={(e) => { e.preventDefault(); handleAreaClick(area.key); }} title={area.description}>
        {area.displayName}
      </a>
    ));
  };

  if (isMobile) {
    return (
      <>
        <div className="mobile-header">
          <button className="mobile-hamburger" onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </button>
          <Link href="/" className="mobile-logo">Pawan Buildhome</Link>
          <button className="mobile-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={isDarkMode ? 'fas fa-moon' : 'fas fa-sun'}></i>
          </button>
        </div>

        <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <h3>Pawan Buildhome</h3>
            <button className="sidebar-close" onClick={toggleMenu}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="mobile-sidebar-content">
            <nav className="mobile-nav">
              <Link href="/" onClick={handleNavClick} className={currentPage === 'home' ? 'active' : ''}>
                <i className="fas fa-home"></i>Home
              </Link>

              <div className="mobile-nav-section">
                <button onClick={handlePropertiesClick} className={currentPage === 'properties' ? 'active' : ''}>
                  <i className="fas fa-building"></i>Properties
                </button>
                <div className="mobile-subnav">
                  {areasArray.map((area) => (
                    <button key={area.key} onClick={() => handleAreaClick(area.key)} title={area.description}>
                      {area.displayName}
                    </button>
                  ))}
                </div>
              </div>

              <Link href="/contact" onClick={handleNavClick} className={currentPage === 'contact' ? 'active' : ''}>
                <i className="fas fa-envelope"></i>Contact
              </Link>
            </nav>
          </div>
        </div>

        {isMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}
      </>
    );
  }

  return (
    <div className={`nav-container${isTransparent ? ' transparent' : ''}`}>
      <nav className={`navbar${isTransparent ? ' transparent navbar--over-hero' : ''}`}>
        <Link href="/" className="logo">Pawan Buildhome</Link>

        <ul className="nav-links">
          <li>
            <Link href="/" className={currentPage === 'home' ? 'active' : ''}>Home</Link>
          </li>
          <li className="nav-item">
            <a href="#" onClick={(e) => { e.preventDefault(); handlePropertiesClick(); }} className={currentPage === 'properties' ? 'active' : ''}>
              Properties
            </a>
            <div className="dropdown">{renderAreasDropdown()}</div>
          </li>
          <li>
            <Link href="/contact" className={currentPage === 'contact' ? 'active' : ''}>Contact</Link>
          </li>
        </ul>

        <div className="theme-container">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={isDarkMode ? 'fas fa-moon' : 'fas fa-sun'}></i>
            <span>{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Header;
