'use client';
import BrandIcon from './BrandIcon';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './Footer.css';

const Footer = () => {
  const router = useRouter();

  const scrollToAreas = () => {
    if (window.location.pathname === '/') {
      const areasSection = document.getElementById('areas');
      if (areasSection) areasSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/');
      setTimeout(() => {
        const areasSection = document.getElementById('areas');
        if (areasSection) areasSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleEmailClick = (email) => window.open(`mailto:${email}`, '_blank');
  const handlePhoneClick = (phone) => window.open(`tel:${phone}`, '_self');
  const handleLocationClick = (url) => window.open(url, '_blank');

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Pawan Buildhome</h3>
            <p>Your trusted partner in real estate excellence. We provide premium property solutions across key locations in NCR.</p>
          </div>

          <div className="footer-section">
            <h3>Contact Info</h3>
            <div className="footer-contact-list">
              <div className="footer-contact-item clickable" onClick={() => handleEmailClick('pawan127jitendra@gmail.com')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-envelope" />
                <span>pawan127jitendra@gmail.com</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('+91-9811186086')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-phone" />
                <span>+91-9811186086</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('+91-9811186083')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-phone" />
                <span>+91-9811186083</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('0120-3244364')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-phone" />
                <span>0120-3244364</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handleLocationClick('https://maps.app.goo.gl/F4oyJaHCwG5fEHzn8?g_st=iw')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-map-marker-alt" />
                <span>Shop No.1, SKYTECH MATROTT, Aditya Celebrity Homes, Sector 76, Noida, U.P. 201316</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handleLocationClick('https://maps.google.com/?q=28.306482,77.558189')} style={{ cursor: 'pointer' }}>
                <BrandIcon className="fas fa-map-marker-alt" />
                <span>GF 90 & 96 Gaur Runway Suites, Gaur Yamuna City Sec-19, Yamuna Expressway, Greater Noida - 203201</span>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <Link href="/">Home</Link>
            <a href="#areas" onClick={(e) => { e.preventDefault(); scrollToAreas(); }}>Our Areas</a>
            <Link href="/properties">Property Listings</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Pawan Buildhome. All rights reserved.</p>
          <div className="footer-social">
            <span>Follow us:</span>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><BrandIcon className="fab fa-facebook-f" /></a>
              <a href="https://www.instagram.com/pawan.buildhome?igsh=MXNib2M3NmdlcDdlZQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <BrandIcon className="fab fa-instagram" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
