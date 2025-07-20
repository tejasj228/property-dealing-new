// frontend/src/components/Modal.jsx - Enhanced responsive modal
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import './Modal.css';

const Modal = ({ isOpen, onClose, subArea, onViewProperties, cardPosition }) => {
  const wasModalOpen = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      console.log('📂 Modal opening, card position:', cardPosition);
      console.log('📂 Sub-area data:', subArea);
      wasModalOpen.current = true;
      
      document.addEventListener('keydown', handleEscape);
      
      // Enhanced body scroll lock
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.classList.add('modal-open');
      
      // Hide desktop navbar
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'none';
      
      // Hide mobile header and sidebar
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'none';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = 'none';
      
    } else if (wasModalOpen.current) {
      console.log('📂 Modal closing, restoring position to:', cardPosition);
      
      // Restore body scroll
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      document.body.classList.remove('modal-open');
      
      // Show desktop navbar
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'block';
      
      // Show mobile header and sidebar
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'flex';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = '';
      
      // Scroll back to the card position after a small delay
      if (cardPosition && cardPosition.y !== undefined) {
        setTimeout(() => {
          console.log('🎯 Scrolling back to card position:', cardPosition.y);
          window.scrollTo({
            top: cardPosition.y,
            left: 0,
            behavior: 'smooth'
          });
        }, 100);
      }
      
      wasModalOpen.current = false;
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      
      // Ensure cleanup
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      document.body.classList.remove('modal-open');
      
      // Show desktop navbar
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'block';
      
      // Show mobile header and sidebar
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'flex';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = '';
    };
  }, [isOpen, onClose, cardPosition]);

  if (!isOpen || !subArea) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle "View Areas" button click
  const handleViewAreas = () => {
    console.log('🏘️ Navigating to societies page for:', subArea);
    onClose(); // Close modal first
    // Navigate to societies page with areaKey and subAreaId
    navigate(`/societies/${subArea.areaKey}/${subArea.id}`);
  };

  // Determine which map image to show using helper function from api.js
  const getMapImage = () => {
    // Priority: 1. Sub-area's uploaded map, 2. Default map
    if (subArea.mapImage) {
      console.log('🗺️ Using uploaded map:', subArea.mapImage);
      return getImageUrl(subArea.mapImage);
    } else {
      console.log('🗺️ Using default map');
      return '/assets/map.webp';
    }
  };

  const mapImageSrc = getMapImage();

  const handleImageError = (e) => {
    console.error('❌ Modal map image failed to load:', mapImageSrc);
    // Fallback to default map if uploaded map fails
    if (subArea.mapImage && e.target.src !== '/assets/map.webp') {
      console.log('🔄 Modal falling back to default map');
      e.target.src = '/assets/map.webp';
    }
  };

  const openMapInNewTab = () => {
    const mapUrl = subArea.mapImage 
      ? getImageUrl(subArea.mapImage)
      : '/assets/map.webp';
    window.open(mapUrl, '_blank');
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content">
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="modal-left">
          <div className="modal-map">
            <img 
              src={mapImageSrc}
              alt={`${subArea.title} map`} 
              style={{
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
              onLoad={() => {
                console.log('✅ Modal map image loaded successfully:', mapImageSrc);
              }}
              onError={handleImageError}
            />
          </div>
        </div>

        <div className="modal-right">
          <h2 id="modal-title">{subArea.title}</h2>
          <div className="modal-description">
            <p className="modal-area-name">
              <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
              {subArea.parentArea.name}
            </p>
            <p className="modal-subarea-desc">{subArea.description}</p>
            <div className="modal-area-info">
              <h4>
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                About {subArea.parentArea.name}
              </h4>
              <p>{subArea.parentArea.description}</p>
            </div>
          </div>
          <div className="modal-button">
            <button 
              className="btn btn-secondary modal-map-btn" 
              onClick={openMapInNewTab}
              title="Open map in new tab"
            >
              <i className="fas fa-external-link-alt" style={{ marginRight: '5px' }}></i>
              Open Map in New Tab
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleViewAreas}
              title={`View societies under ${subArea.title}`}
            >
              
              View Areas Under {subArea.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;