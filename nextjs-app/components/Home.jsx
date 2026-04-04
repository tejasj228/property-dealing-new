'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { features } from '@/data/data'; // Keep features as static for now
import { fetchAreas, checkBackendHealth, getImageUrl } from '@/services/api';
import Modal from './Modal';
import ImageSlider from './ImageSlider';
import './Home.css';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubArea, setSelectedSubArea] = useState(null);
  const [cardPosition, setCardPosition] = useState(null);
  const [areas, setAreas] = useState({});
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  
  // 🆕 NEW: Separate loading state for areas data vs UI rendering
  const [areasLoading, setAreasLoading] = useState(true);
  const [initialUILoaded, setInitialUILoaded] = useState(false);
  
  const router = useRouter();

  // 🆕 OPTIMIZED: Load static fallback data immediately for faster UI rendering
  useEffect(() => {
    const loadFallbackDataImmediate = async () => {
      try {
        // Load static data immediately to show UI faster
        const { areas: fallbackAreas } = await import('@/data/data');
        setAreas(fallbackAreas);
        setInitialUILoaded(true);
        setLoading(false); // Allow UI to render with fallback data
        console.log('🚀 Initial UI loaded with fallback data');
      } catch (error) {
        console.error('Error loading fallback data:', error);
        setInitialUILoaded(true);
        setLoading(false);
      }
    };
    
    loadFallbackDataImmediate();
  }, []);

  // 🆕 OPTIMIZED: Load API data in parallel after UI is rendered
  useEffect(() => {
    if (initialUILoaded) {
      loadAreasFromAPI();
    }
  }, [initialUILoaded]);

  const loadAreasFromAPI = async () => {
    try {
      setAreasLoading(true);
      
      // Check backend connection in parallel
      const backendHealthCheck = checkBackendHealth()
        .then(() => {
          setBackendConnected(true);
          console.log('✅ Backend connected successfully');
        })
        .catch(() => {
          setBackendConnected(false);
          console.warn('⚠️ Backend not connected, keeping fallback data');
        });

      // Fetch areas from API
      const areasDataPromise = fetchAreas();
      
      // Wait for both operations
      const [areasData] = await Promise.all([areasDataPromise, backendHealthCheck]);
      
      if (Object.keys(areasData).length > 0) {
        setAreas(areasData);
        console.log('📊 API areas data loaded and updated:', Object.keys(areasData).length);
      } else {
        console.log('📊 No API data, keeping fallback areas');
      }
    } catch (error) {
      console.error('Error loading areas from API:', error);
      // Keep existing fallback data
      console.log('📊 API failed, keeping fallback areas data');
    } finally {
      setAreasLoading(false);
    }
  };

  // Scroll reveal animation
  useEffect(() => {
    const revealElements = () => {
      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          el.classList.add('revealed');
        }
      });
    };

    window.addEventListener('scroll', revealElements);
    revealElements(); // Initial check

    return () => window.removeEventListener('scroll', revealElements);
  }, []);

  const handleSubAreaClick = (areaKey, subArea, event) => {
    console.log('🎯 Card clicked - capturing position');
    console.log('🏘️ Area key:', areaKey);
    console.log('🏘️ Sub-area data:', subArea);
    
    // Get the clicked card element
    const cardElement = event.currentTarget;
    const rect = cardElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate the absolute position of the card
    const cardAbsolutePosition = {
      y: rect.top + scrollTop - 100, // Offset a bit above the card for better view
      x: rect.left,
      element: cardElement
    };
    
    console.log('📍 Card position captured:', cardAbsolutePosition);
    setCardPosition(cardAbsolutePosition);
    
    const areaData = areas[areaKey];
    const subAreaData = {
      ...subArea,
      parentArea: areaData,
      areaKey: areaKey // Make sure this is set correctly
    };
    
    console.log('🏘️ Final subArea data with areaKey:', subAreaData);
    
    // Set both states immediately to avoid delays
    setSelectedSubArea(subAreaData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('🔒 Closing modal - position will be restored');
    setIsModalOpen(false);
    // Clear selected subarea after modal closes
    setTimeout(() => {
      setSelectedSubArea(null);
      // Clear card position after a delay to ensure modal is fully closed
      setTimeout(() => {
        setCardPosition(null);
      }, 1000);
    }, 300);
  };

  const handleViewListings = (areaKey) => {
    router.push(`/properties?area=${areaKey}`);
  };

  const scrollToAreas = () => {
    document.getElementById('areas').scrollIntoView({ behavior: 'smooth' });
  };

  // 🆕 FIXED: Function to get the correct image for sub-area cards
  const getSubAreaImage = (subArea) => {
    if (subArea.mapImage) {
      console.log('🗺️ Using uploaded map for card:', subArea.mapImage);
      return getImageUrl(subArea.mapImage); // Use helper function from api.js
    } else {
      console.log('🗺️ Using default map for card');
      return '/assets/map.webp';
    }
  };

  // 🆕 OPTIMIZED: Show loading only on complete failure
  if (loading && !initialUILoaded) {
    return (
      <div className="home">
        <section className="hero">
          <div className="hero-video-overlay"></div>
          <video
            className="hero-video"
            src="/assets/video.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
            }}
          />
          <div className="hero-content">
            <h1>
              Premium <span className="highlight-accent">Real Estate</span> Solutions
            </h1>
            <p>Loading your premium property experience...</p>
            <div className="cta-buttons">
              <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section with Video */}
      <section className="hero">
        <div className="hero-video-overlay"></div>
        <video
          className="hero-video"
          src="/assets/video.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        />
        <div className="hero-content">
          <h1>
            Premium <span className="highlight-accent">Real Estate</span> Solutions
          </h1>
          <p>Discover your dream property with Pawan Buildhome - Your trusted partner in real estate excellence</p>
          <div className="cta-buttons">
            <button onClick={scrollToAreas} className="btn btn-primary">
              Explore Areas
            </button>
            <button onClick={() => router.push('/contact')} className="btn btn-secondary">
              Get In Touch
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us scroll-reveal">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose Pawan Buildhome?</h2>
            <p>Experience excellence in real estate with our premium services and expertise</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={feature.id} className={`feature-card scroll-reveal stagger-${index + 1}`}>
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Slider Section */}
      <section className="slider-section scroll-reveal">
        <div className="container">
          <ImageSlider />
        </div>
      </section>

      {/* Areas Section - Now renders immediately with fallback data */}
      <section id="areas" className="areas-section scroll-reveal">
        <div className="container">
          <div className="section-title">
            <h2>Areas Under Us</h2>
            <p>Explore our premium service areas with comprehensive property solutions</p>
            {/* 🆕 SUBTLE INDICATOR: Show if data is being updated */}
            {areasLoading && (
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    border: '2px solid #ddd',
                    borderTop: '2px solid #B8860B',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                ></div>
                Updating latest data...
              </div>
            )}
          </div>
          <div className="main-areas-container">
            {Object.entries(areas).map(([key, area], index) => (
              <div key={key} className={`main-area-card scroll-reveal stagger-${index + 1}`}>
                <div className="main-area-header">
                  <h3>{area.name}</h3>
                  <p>{area.description}</p>
                </div>
                <div className="sub-areas-grid">
                  {area.subAreas?.map((subArea) => (
                    <div
                      key={subArea.id}
                      className="sub-area-card"
                      onClick={(event) => handleSubAreaClick(key, subArea, event)}
                    >
                      <div className="sub-area-image">
                        <img 
                          src={getSubAreaImage(subArea)}
                          alt={`${subArea.title} Map`}
                          onLoad={() => {
                            console.log('✅ Sub-area card image loaded:', subArea.title);
                          }}
                          onError={(e) => {
                            console.error('❌ Sub-area card image failed:', subArea.title);
                            // Fallback to default map if uploaded map fails
                            if (subArea.mapImage && e.target.src !== '/assets/map.webp') {
                              console.log('🔄 Falling back to default map for card');
                              e.target.src = '/assets/map.webp';
                            }
                          }}
                        />
                      </div>
                      <div className="sub-area-content">
                        <h4>{subArea.title}</h4>
                        <p>{subArea.description}</p>
                      </div>
                    </div>
                  )) || (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center', 
                      color: '#666',
                      background: '#f5f5f5',
                      borderRadius: '8px'
                    }}>
                      <p>No sub-areas configured yet</p>
                    </div>
                  )}
                </div>
                <div className="main-area-footer">
                  <button
                    className="view-all-properties-btn"
                    onClick={() => handleViewListings(key)}
                  >
                    View All {area.name} Properties
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        subArea={selectedSubArea}
        cardPosition={cardPosition}
        onViewProperties={(areaKey) => {
          handleCloseModal();
          handleViewListings(areaKey);
        }}
      />
    </div>
  );
};

export default Home;