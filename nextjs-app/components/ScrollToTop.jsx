'use client';
import React, { useState, useEffect } from 'react';
import './ScrollToTop.css';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.pageYOffset > 300);
    const checkModalState = () => setIsModalOpen(document.body.classList.contains('modal-open'));

    window.addEventListener('scroll', toggleVisibility);
    const modalChecker = setInterval(checkModalState, 100);

    toggleVisibility();
    checkModalState();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      clearInterval(modalChecker);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      className={`scroll-to-top ${isVisible && !isModalOpen ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <i className="fas fa-chevron-up"></i>
    </button>
  );
};

export default ScrollToTop;
