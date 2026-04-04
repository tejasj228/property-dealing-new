'use client';
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
  const handleLocationClick = (address) => window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');

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
                <i className="fas fa-envelope"></i>
                <span>pawan127jitendra@gmail.com</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('+91-9811186086')} style={{ cursor: 'pointer' }}>
                <i className="fas fa-phone"></i>
                <span>+91-9811186086</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('+91-9811186083')} style={{ cursor: 'pointer' }}>
                <i className="fas fa-phone"></i>
                <span>+91-9811186083</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handlePhoneClick('0120-3244364')} style={{ cursor: 'pointer' }}>
                <i className="fas fa-phone"></i>
                <span>0120-3244364</span>
              </div>
              <div className="footer-contact-item clickable" onClick={() => handleLocationClick('S-1 Skytech Matrott Market, Sector-76, Noida (U.P) 201307')} style={{ cursor: 'pointer' }}>
                <i className="fas fa-map-marker-alt"></i>
                <span>S-1 Skytech Matrott Market, Sector-76, Noida (U.P) 201307</span>
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
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="https://www.instagram.com/pawan.buildhome?igsh=MXNib2M3NmdlcDdlZQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
