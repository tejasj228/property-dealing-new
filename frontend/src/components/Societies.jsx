// frontend/src/components/Societies.jsx - Fixed button positioning
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
import './Societies.css';

// Helper function to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/map.webp';
  
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
    return imagePath;
  }
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://property-dealing-kuw8.onrender.com'
    : 'http://localhost:5000';
  
  return `${baseUrl}${imagePath}`;
};

// Helper function to get API URL
const getApiUrl = (endpoint) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://property-dealing-kuw8.onrender.com/api'
    : 'http://localhost:5000/api';
  
  return `${baseUrl}${endpoint}`;
};

// Enhanced Society Modal Component with Responsive Design
const SocietyModal = ({ isOpen, onClose, society, cardPosition }) => {
  const wasModalOpen = React.useRef(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isKeyboardNavEnabled, setIsKeyboardNavEnabled] = useState(true);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleKeyboard = (e) => {
      if (!isKeyboardNavEnabled || !isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      }
    };

    if (isOpen) {
      console.log('📂 Society Modal opening for:', society?.name);
      wasModalOpen.current = true;
      setCurrentImageIndex(0);
      
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyboard);
      
      // Lock body scroll and hide navigation
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.classList.add('modal-open');
      
      // Hide all navigation elements
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'none';
      
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'none';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = 'none';
      
    } else if (wasModalOpen.current) {
      console.log('📂 Society Modal closing, restoring position to:', cardPosition);
      
      // Restore body scroll and navigation
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      document.body.classList.remove('modal-open');
      
      // Restore all navigation elements
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'block';
      
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'flex';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = '';
      
      // Scroll back to card position
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
      document.removeEventListener('keydown', handleKeyboard);
      
      // Ensure cleanup
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      document.body.classList.remove('modal-open');
      
      // Ensure navbar is always restored
      const navbar = document.querySelector('.nav-container');
      if (navbar) navbar.style.display = 'block';
      
      const mobileHeader = document.querySelector('.mobile-header');
      if (mobileHeader) mobileHeader.style.display = 'flex';
      
      const mobileSidebar = document.querySelector('.mobile-sidebar');
      if (mobileSidebar) mobileSidebar.style.display = '';
    };
  }, [isOpen, onClose, cardPosition, society, isKeyboardNavEnabled]);

  if (!isOpen || !society) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get all available images (gallery images + map image)
  const getAllImages = () => {
    const images = [];
    
    // First add all gallery images
    if (society.images && society.images.length > 0) {
      society.images.forEach(img => {
        images.push({
          url: getImageUrl(img),
          type: 'gallery',
          alt: `${society.name} gallery image`
        });
      });
    }
    
    // Then add map image
    if (society.mapImage) {
      images.push({
        url: getImageUrl(society.mapImage),
        type: 'map',
        alt: `${society.name} map`
      });
    }
    
    // Default fallback if no images at all
    if (images.length === 0) {
      images.push({
        url: '/assets/map.webp',
        type: 'default',
        alt: 'Default map'
      });
    }
    
    return images;
  };

  const allImages = getAllImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleImageError = (e, imageIndex) => {
    console.error('❌ Image failed to load:', allImages[imageIndex]?.url);
    if (e.target.src !== '/assets/map.webp') {
      e.target.src = '/assets/map.webp';
    }
  };

  const handleImageLoad = (imageIndex) => {
    console.log('✅ Image loaded successfully:', allImages[imageIndex]?.url);
  };

  const openImageInNewTab = () => {
    const currentImage = allImages[currentImageIndex];
    if (currentImage) {
      window.open(currentImage.url, '_blank');
    }
  };

  const handleContactUs = () => {
    window.location.href = '/contact';
  };

  return (
    <div 
      className="modal-overlay society-modal-overlay" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content society-modal">
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <i className="fas fa-times"></i>
        </button>
        
        {/* Left Section: Image Gallery */}
        <div className="modal-left">
          <div className="modal-gallery">
            <img 
              src={allImages[currentImageIndex]?.url}
              alt={allImages[currentImageIndex]?.alt}
              style={{
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
              onLoad={() => handleImageLoad(currentImageIndex)}
              onError={(e) => handleImageError(e, currentImageIndex)}
            />
            
            {/* Navigation arrows for multiple images */}
            {allImages.length > 1 && (
              <>
                <button 
                  className="gallery-nav gallery-prev" 
                  onClick={prevImage}
                  aria-label="Previous image"
                  title="Previous image (←)"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  className="gallery-nav gallery-next" 
                  onClick={nextImage}
                  aria-label="Next image"
                  title="Next image (→)"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                
                {/* Image counter */}
                <div className="gallery-counter">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}

            {/* Image thumbnails for quick navigation */}
            {allImages.length > 1 && (
              <div className="gallery-thumbnails" style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '5px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '5px',
                borderRadius: '15px',
                maxWidth: '90%',
                overflowX: 'auto'
              }}>
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      background: index === currentImageIndex ? '#b8860b' : 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Society Information */}
        <div className="modal-right">
          <h2 id="modal-title">{society.name}</h2>
          <p className="modal-description">{society.description}</p>
          
          {/* Amenities Section */}
          {society.amenities && society.amenities.length > 0 && (
            <div className="modal-amenities">
              <h4>
                <i className="fas fa-star" style={{ marginRight: '8px' }}></i>
                Amenities & Features
              </h4>
              <div className="amenities-grid">
                {society.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <i className="fas fa-check"></i>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="modal-button">
            <button 
              className="btn btn-secondary modal-map-btn" 
              onClick={openImageInNewTab}
              title="Open current image in new tab"
            >
              <i className="fas fa-external-link-alt" style={{ marginRight: '5px' }}></i>
              Open Image in New Tab
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleContactUs}
              title="Contact us for more information"
            >
              <i className="fas fa-envelope" style={{ marginRight: '5px' }}></i>
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔧 FIXED: Map-Only Image Slider Component with Properly Positioned Buttons
const SocietiesMapSlider = ({ societies = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 🔧 FIXED: Create slides array from only MAP images
  const slides = [];
  societies.forEach(society => {
    if (society.mapImage) {
      slides.push({
        image: getImageUrl(society.mapImage),
        societyName: society.name,
        societyId: society.id,
        type: 'map'
      });
    }
  });

  // If no map images, show a placeholder
  if (slides.length === 0) {
    slides.push({
      image: '/assets/map.webp',
      societyName: 'Default Area Map',
      societyId: 'default',
      type: 'default'
    });
  }

  // Auto-slide functionality
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  useEffect(() => {
    if (slides.length > 0) {
      setIsLoading(false);
    }
  }, [slides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleSlideImageError = (e) => {
    e.target.src = '/assets/map.webp';
  };

  const openCurrentMapInNewTab = () => {
    if (slides[currentSlide] && slides[currentSlide].image) {
      window.open(slides[currentSlide].image, '_blank');
    }
  };

  return (
    <div className="societies-slider">
      <div className="slider-container">
        <div className="slider-main">
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '1.2rem'
            }}>
              Loading maps...
            </div>
          )}
          
          <img
            src={slides[currentSlide].image}
            alt={`${slides[currentSlide].societyName} map`}
            className="slider-image"
            onError={handleSlideImageError}
            onLoad={() => setIsLoading(false)}
          />
          
          <div className="slider-overlay">
            <div className="slider-content">
              <h2 className="society-name">{slides[currentSlide].societyName}</h2>
              <p className="slider-description">
                {slides[currentSlide].type === 'map' ? 'Society Location Map' : 'Area Map'}
              </p>
              <div className="slide-counter">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>
          </div>

          {/* 🔧 NEW: Individual buttons positioned separately */}
          <button 
            className="slider-open-map-btn"
            onClick={openCurrentMapInNewTab}
            aria-label="Open current map in new tab"
            title="Open current map in new tab"
          >
            <i className="fas fa-external-link-alt"></i>
          </button>
          
          {slides.length > 1 && (
            <button 
              className="slider-play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
            </button>
          )}

          {/* Navigation arrows */}
          {slides.length > 1 && (
            <>
              <button 
                className="slider-nav prev" 
                onClick={prevSlide}
                aria-label="Previous map"
                title="Previous map"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="slider-nav next" 
                onClick={nextSlide}
                aria-label="Next map"
                title="Next map"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </>
          )}
        </div>

        {slides.length > 1 && (
          <div className="slider-thumbnails">
            {slides.map((slide, index) => (
              <button
                key={index}
                className={`thumbnail ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                style={{
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                aria-label={`Go to ${slide.societyName} map`}
                title={`${slide.societyName} - Location Map`}
              >
                <span className="thumbnail-label">{slide.societyName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to validate URL parameters
const validateParams = (areaKey, subAreaId) => {
  if (!areaKey || !subAreaId) {
    return false;
  }
  
  const subAreaIdNum = parseInt(subAreaId);
  if (isNaN(subAreaIdNum) || subAreaIdNum <= 0) {
    return false;
  }
  
  return true;
};

// Helper function to fetch area info from areas API
const fetchAreaInfo = async (areaKey, subAreaId) => {
  try {
    const response = await fetch(getApiUrl(`/areas/${areaKey}`));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success && data.data) {
      const area = data.data;
      const subArea = area.subAreas?.find(sa => sa.id === parseInt(subAreaId));
      
      if (subArea) {
        return {
          areaName: area.name,
          subAreaName: subArea.title,
          subAreaDescription: subArea.description
        };
      }
    }
    
    throw new Error('Sub-area not found');
  } catch (error) {
    console.error('Error fetching area info:', error);
    return null;
  }
};

const Societies = () => {
  const { areaKey, subAreaId } = useParams();
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [areaInfo, setAreaInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardPosition, setCardPosition] = useState(null);

  // Validate parameters on component mount
  useEffect(() => {
    if (!validateParams(areaKey, subAreaId)) {
      console.error('❌ Invalid URL parameters:', { areaKey, subAreaId });
      setError('Invalid URL parameters. Please check the area and sub-area values.');
      setLoading(false);
      return;
    }
    
    loadSocieties();
  }, [areaKey, subAreaId]);

  const loadSocieties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🏘️ Loading societies for area: ${areaKey}, sub-area: ${subAreaId}`);
      
      // First, fetch area info to validate the URL parameters
      const areaInfoResult = await fetchAreaInfo(areaKey, subAreaId);
      if (!areaInfoResult) {
        setError('Area or sub-area not found. Please check the URL.');
        setLoading(false);
        return;
      }
      
      setAreaInfo(areaInfoResult);
      
      // Then fetch societies
      const apiUrl = getApiUrl(`/societies/${areaKey}/${subAreaId}`);
      console.log(`🔗 Fetching societies from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Area or sub-area not found. Please check the URL.');
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSocieties(data.data.societies || []);
        // Update area info from API response if available
        if (data.data.areaName) {
          setAreaInfo({
            areaName: data.data.areaName,
            subAreaName: data.data.subAreaName,
            subAreaDescription: data.data.subAreaDescription
          });
        }
        console.log('✅ Societies loaded successfully:', data.data.societies.length);
        console.log('🗺️ Societies with maps:', data.data.societies.filter(s => s.mapImage).length);
        console.log('🖼️ Societies with gallery images:', data.data.societies.filter(s => s.images?.length > 0).length);
      } else {
        throw new Error(data.message || 'Failed to load societies');
      }
    } catch (error) {
      console.error('❌ Error loading societies:', error);
      
      // Better error handling
      if (error.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        setError('The requested area or sub-area could not be found. Please check the URL.');
      } else {
        setError(error.message || 'An unexpected error occurred while loading societies.');
      }
      
      // Don't load fallback data on parameter validation errors
      if (validateParams(areaKey, subAreaId)) {
        loadFallbackData();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    // Enhanced fallback society data with separate map and gallery images
    const fallbackSocieties = [
      {
        id: 1,
        name: 'Green Valley Apartments',
        description: 'Premium residential complex with modern amenities and excellent connectivity.',
        mapImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800', // Map image
        images: [ // Gallery images
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
        ],
        amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', '24/7 Power Backup'],
        contact: {
          phone: '+91-9811186086',
          email: 'info@greenvalley.com'
        }
      },
      {
        id: 2,
        name: 'Royal Heights Society',
        description: 'Luxury housing society offering world-class facilities and premium lifestyle.',
        mapImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800', // Map image
        images: [ // Gallery images
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
          'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800'
        ],
        amenities: ['Club House', 'Tennis Court', 'Children Play Area', 'Garden', 'CCTV'],
        contact: {
          phone: '+91-9811186083',
          email: 'contact@royalheights.com'
        }
      }
    ];
    
    setSocieties(fallbackSocieties);
    if (!areaInfo.areaName) {
      setAreaInfo({
        areaName: 'Sample Area',
        subAreaName: 'Sample Sub-Area',
        subAreaDescription: 'This is sample data as the backend connection failed.'
      });
    }
    console.log('⚠️ Using fallback society data');
  };

  const handleSocietyClick = (society, event) => {
    console.log('🏘️ Society card clicked:', society.name);
    
    const cardElement = event.currentTarget;
    const rect = cardElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const cardAbsolutePosition = {
      y: rect.top + scrollTop - 100,
      x: rect.left,
      element: cardElement
    };
    
    setCardPosition(cardAbsolutePosition);
    setSelectedSociety(society);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('🏘️ Closing society modal');
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedSociety(null);
      setTimeout(() => {
        setCardPosition(null);
      }, 1000);
    }, 300);
  };

  // 🔧 FIXED: Get primary gallery image for society cards (not map)
  const getSocietyImage = (society) => {
    // Prioritize gallery images for society cards
    if (society.images && society.images.length > 0) {
      return getImageUrl(society.images[0]); // First gallery image
    } 
    // Fallback to map image if no gallery images
    else if (society.mapImage) {
      return getImageUrl(society.mapImage);
    }
    // Final fallback
    return '/assets/map.webp';
  };

  const handleImageError = (e) => {
    if (e.target.src !== '/assets/map.webp') {
      e.target.src = '/assets/map.webp';
    }
  };

  // Better error handling for invalid parameters
  if (error && error.includes('Invalid URL parameters')) {
    return (
      <PageTransition>
        <div className="societies-page">
          <div className="container">
            <div className="back-navigation">
              <button 
                className="back-btn"
                onClick={() => navigate('/')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Home
              </button>
            </div>
            
            <div className="section-title">
              <h2>Invalid URL</h2>
              <p>The URL parameters are invalid. Please check the area and sub-area values.</p>
            </div>
            
            <div className="no-societies">
              <div className="no-societies-content">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>Invalid Parameters</h3>
                <p>The area key "{areaKey}" or sub-area ID "{subAreaId}" is invalid.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="societies-page">
          <div className="container">
            <div className="section-title">
              <h2>Loading Societies...</h2>
              <div className="loading-spinner" style={{ 
                margin: '50px auto',
                width: '40px',
                height: '40px',
                border: '4px solid var(--border-light)',
                borderTop: '4px solid var(--accent-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="societies-page">
        <div className="container">
          {/* Back Navigation */}
          <div className="back-navigation">
            <button 
              className="back-btn"
              onClick={() => navigate(-1)}
              title="Go back to previous page"
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          </div>

          {/* Page Header */}
          <div className="section-title">
            <h2>{areaInfo.subAreaName || 'Societies'}</h2>
            <p>{areaInfo.subAreaDescription || 'Explore societies in this area'}</p>
            {areaInfo.areaName && (
              <div className="breadcrumb">
                <span>{areaInfo.areaName}</span>
                <i className="fas fa-chevron-right"></i>
                <span>{areaInfo.subAreaName}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          {/* 🔧 FIXED: Map-Only Slider */}
          <SocietiesMapSlider societies={societies} />

          {/* Societies Grid with Gallery Images */}
          {societies.length > 0 ? (
            <div className="societies-grid">
              {societies.map((society, index) => (
                <div
                  key={society.id}
                  className="society-card"
                  onClick={(event) => handleSocietyClick(society, event)}
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSocietyClick(society, e);
                    }
                  }}
                  aria-label={`View details for ${society.name}`}
                >
                  <div className="society-image">
                    <img 
                      src={getSocietyImage(society)}
                      alt={`${society.name} Image`}
                      onError={handleImageError}
                      loading="lazy"
                    />
                    {/* 🔧 FIXED: Show correct image count badges */}
                    <div className="society-image-badges">
                      {society.images && society.images.length > 0 && (
                        <div className="image-count-badge gallery">
                          <i className="fas fa-images"></i>
                          {society.images.length}
                        </div>
                      )}
                      {society.mapImage && (
                        <div className="image-count-badge map">
                          <i className="fas fa-map"></i>
                          Map
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="society-content">
                    <h3>{society.name}</h3>
                    <p className="society-description">{society.description}</p>
                    
                    {society.amenities && society.amenities.length > 0 && (
                      <div className="amenities-preview">
                        <div className="amenities-list">
                          {society.amenities.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="amenity-tag">
                              <i className="fas fa-check"></i>
                              {amenity}
                            </span>
                          ))}
                          {society.amenities.length > 3 && (
                            <span className="amenity-tag more">
                              +{society.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Open Button */}
                    <div className="society-open-button">
                      <button 
                        className="btn btn-primary society-open-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleSocietyClick(society, e);
                        }}
                        title={`View details for ${society.name}`}
                      >
                        <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-societies">
              <div className="no-societies-content">
                <i className="fas fa-building"></i>
                <h3>No Societies Available</h3>
                <p>
                  We're currently updating our listings for this area. 
                  Please check back soon or contact us for the latest available societies.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/contact')}
                >
                  Contact Us
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Responsive Society Modal */}
        <SocietyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          society={selectedSociety}
          cardPosition={cardPosition}
        />
      </div>

      {/* 🔧 FIXED: NEW CSS with separate button positioning */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* 🔧 FIXED: Open Map button - positioned towards center-left */
        .societies-slider .slider-open-map-btn {
          position: absolute !important;
          top: 15px !important;
          left: 80px !important; /* Much further from left edge */
          background: rgba(0, 0, 0, 0.8) !important;
          border: none !important;
          border-radius: 50% !important;
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          color: white !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(6px) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          z-index: 15 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* 🔧 FIXED: Play/Pause button - positioned towards center-right */
        .societies-slider .slider-play-pause-btn {
          position: absolute !important;
          top: 15px !important; /* Same vertical position */
          right: 80px !important; /* Much further from right edge */
          background: rgba(0, 0, 0, 0.8) !important;
          border: none !important;
          border-radius: 50% !important;
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          color: white !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(6px) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          z-index: 15 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .societies-slider .slider-open-map-btn:hover,
        .societies-slider .slider-play-pause-btn:hover {
          background: rgba(184, 134, 11, 0.9) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 12px rgba(184, 134, 11, 0.4) !important;
        }
        
        .societies-slider .slider-open-map-btn:active,
        .societies-slider .slider-play-pause-btn:active {
          transform: scale(0.95) !important;
        }
        
        .society-image-badges {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          z-index: 5 !important;
        }
        
        .image-count-badge {
          padding: 4px 8px !important;
          border-radius: 12px !important;
          font-size: 0.8rem !important;
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
          gap: 4px !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        
        .image-count-badge.gallery {
          background: rgba(76, 175, 80, 0.9) !important;
          color: white !important;
        }
        
        .image-count-badge.map {
          background: rgba(255, 152, 0, 0.9) !important;
          color: white !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .societies-slider .slider-open-map-btn {
            top: 12px !important;
            left: 60px !important; /* Closer to center on tablets */
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 14px !important;
          }
          
          .societies-slider .slider-play-pause-btn {
            top: 12px !important;
            right: 60px !important; /* Closer to center on tablets */
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 14px !important;
          }
          
          /* 🔧 FIXED: Thumbnail responsiveness for tablets */
          .societies-slider .slider-thumbnails {
            padding: 8px 10px !important;
            gap: 6px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .societies-slider .thumbnail {
            min-width: 60px !important;
            height: 45px !important;
            border-radius: 6px !important;
            flex-shrink: 0 !important;
          }
          
          .societies-slider .thumbnail-label {
            font-size: 0.65rem !important;
            padding: 2px 4px !important;
          }
        }
        
        @media (max-width: 480px) {
          .societies-slider .slider-open-map-btn {
            top: 10px !important;
            left: 40px !important; /* Even closer to center on mobile */
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 12px !important;
          }
          
          .societies-slider .slider-play-pause-btn {
            top: 10px !important;
            right: 40px !important; /* Even closer to center on mobile */
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 12px !important;
          }
          
          /* 🔧 FIXED: Thumbnail responsiveness for mobile */
          .societies-slider .slider-thumbnails {
            padding: 6px 8px !important;
            gap: 4px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          
          .societies-slider .slider-thumbnails::-webkit-scrollbar {
            display: none !important;
          }
          
          .societies-slider .thumbnail {
            min-width: 50px !important;
            height: 38px !important;
            border-radius: 4px !important;
            flex-shrink: 0 !important;
            border: 2px solid transparent !important;
          }
          
          .societies-slider .thumbnail.active {
            border-color: #b8860b !important;
          }
          
          .societies-slider .thumbnail-label {
            font-size: 0.6rem !important;
            padding: 1px 3px !important;
            line-height: 1.2 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
          }
          
          .society-image-badges {
            top: 6px !important;
            right: 6px !important;
            gap: 3px !important;
          }
          
          .image-count-badge {
            padding: 3px 6px !important;
            font-size: 0.7rem !important;
          }
        }
        
        /* 🔧 NEW: Extra small screens (very small phones) */
        @media (max-width: 360px) {
          .societies-slider .slider-thumbnails {
            padding: 4px 6px !important;
            gap: 3px !important;
          }
          
          .societies-slider .thumbnail {
            min-width: 45px !important;
            height: 34px !important;
          }
          
          .societies-slider .thumbnail-label {
            font-size: 0.55rem !important;
            padding: 1px 2px !important;
          }
        }
      `}</style>
    </PageTransition>
  );
};

export default Societies;