import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import useAreas from '../hooks/useAreas';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Use areas hook with fallback enabled
  const { areasArray, areasLoading, areasError } = useAreas({
    autoLoad: true,
    fallbackToDefault: true,
    enableCache: false // Disable cache for debugging
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Immediately reset transparency state based on current page
    if (location.pathname !== '/') {
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

    // Helper to wait for .hero to exist before running handleScroll
    const runInitialCheck = () => {
      const hero = document.querySelector('.hero');
      if (hero) {
        handleScroll();
        window.addEventListener('scroll', handleScroll);
      } else {
        // Try again after a short delay if .hero not found
        timeout = setTimeout(runInitialCheck, 50);
      }
    };

    raf = requestAnimationFrame(runInitialCheck);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePropertiesClick = () => {
    navigate('/properties');
    setIsMenuOpen(false);
  };

  const handleAreaClick = (areaKey) => {
    navigate(`/properties?area=${areaKey}`);
    setIsMenuOpen(false);
  };

  const handleNavClick = (path) => {
    if (path) navigate(path);
    setIsMenuOpen(false);
  };

  // Get current page for highlighting
  const getCurrentPage = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/contact') return 'contact';
    if (location.pathname === '/properties' || location.pathname.startsWith('/listings')) return 'properties';
    return '';
  };

  const currentPage = getCurrentPage();

  // Render areas dropdown content
  const renderAreasDropdown = () => {
    console.log('🔄 Rendering areas dropdown:', { areasLoading, areasError, areasArray });
    
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
      return (
        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
          No areas available
        </div>
      );
    }

    return areasArray.map((area) => (
      <a 
        key={area.key}
        href="#" 
        onClick={(e) => { e.preventDefault(); handleAreaClick(area.key); }}
        title={area.description}
      >
        {area.displayName}
      </a>
    ));
  };

  // Mobile Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="mobile-hamburger" onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </button>
          <Link to="/" className="mobile-logo">
            Pawan Buildhome
          </Link>
          <button 
            className="mobile-theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
          </button>
        </div>

        {/* Mobile Sidebar */}
        <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <h3>Pawan Buildhome</h3>
            <button className="sidebar-close" onClick={toggleMenu}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="mobile-sidebar-content">
            <nav className="mobile-nav">
              <Link 
                to="/" 
                onClick={() => handleNavClick()}
                className={currentPage === 'home' ? 'active' : ''}
              >
                <i className="fas fa-home"></i>
                Home
              </Link>
              
              <div className="mobile-nav-section">
                <button 
                  onClick={handlePropertiesClick}
                  className={currentPage === 'properties' ? 'active' : ''}
                >
                  <i className="fas fa-building"></i>
                  Properties
                </button>
                <div className="mobile-subnav">
                  {areasArray.map((area) => (
                    <button 
                      key={area.key}
                      onClick={() => handleAreaClick(area.key)}
                      title={area.description}
                    >
                      {area.displayName}
                    </button>
                  ))}
                </div>
              </div>

              <Link 
                to="/contact" 
                onClick={() => handleNavClick()}
                className={currentPage === 'contact' ? 'active' : ''}
              >
                <i className="fas fa-envelope"></i>
                Contact
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMenuOpen && <div className="mobile-overlay" onClick={toggleMenu}></div>}
      </>
    );
  }

  // Desktop Navigation
  return (
    <div className={`nav-container${isTransparent ? ' transparent' : ''}`}>
      <nav className={`navbar${isTransparent ? ' transparent navbar--over-hero' : ''}`}>
        <Link to="/" className="logo">
          Pawan Buildhome
        </Link>

        <ul className="nav-links">
          <li>
            <Link 
              to="/" 
              className={currentPage === 'home' ? 'active' : ''}
            >
              Home
            </Link>
          </li>
          <li className="nav-item">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); handlePropertiesClick(); }}
              className={currentPage === 'properties' ? 'active' : ''}
            >
              Properties
            </a>
            <div className="dropdown">
              {renderAreasDropdown()}
            </div>
          </li>
          <li>
            <Link 
              to="/contact"
              className={currentPage === 'contact' ? 'active' : ''}
            >
              Contact
            </Link>
          </li>
        </ul>

        <div className="theme-container">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}></i>
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Header;