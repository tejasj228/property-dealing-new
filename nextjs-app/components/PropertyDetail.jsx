'use client';
import BrandIcon from './BrandIcon';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentImageUrl } from '@/lib/image-url.mjs';
import { publicContentUrl } from '@/lib/public-content-path.mjs';
import './PropertyDetail.css';

const PropertyDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  // 🆕 FIXED: Helper function to get correct image URL
  const getImageUrl = (imageUrl) => {
    if (imageUrl && imageUrl.startsWith('http')) return imageUrl;
    return imageUrl || '';
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(''); setProperty(null); setCurrentImageIndex(0);
      try {
        const response = await fetch(publicContentUrl('/properties/' + encodeURIComponent(id)), { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 404 ? 'This property is no longer listed.' : 'We couldn’t load this property. Please try again.');
        const result = await response.json();
        if (!result.success || !result.data) throw new Error('This property is no longer listed.');
        if (controller.signal.aborted) return;
        setProperty(result.data);
        setAreaName((result.data.areaKey || '').replaceAll('-', ' '));
        fetch(publicContentUrl('/areas'), { signal: controller.signal }).then(r => r.json()).then(areas => {
          const area = areas.data?.[result.data.areaKey];
          if (area && !controller.signal.aborted) setAreaName(area.displayName || area.name || result.data.areaKey);
        }).catch(() => {});
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    if (id) load();
    return () => controller.abort();
  }, [id, attempt]);

  const nextImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // 🆕 NEW: Open current image in new tab
  const openImageInNewTab = () => {
    if (property?.images && property.images.length > 0) {
      const imageUrl = getImageUrl(property.images[currentImageIndex]);
      window.open(imageUrl, '_blank');
    }
  };

  // 🆕 FUNCTIONAL CONTACT METHODS
  const handlePhoneCall = (phoneNumber) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmail = (email) => {
    window.open(`mailto:${email}`, '_blank');
  };

  if (loading) {
    return (
      <>
        <div className="property-detail-page">
          <div className="container">
            <div className="loading-spinner" style={{ margin: '100px auto' }}></div>
            <p style={{ textAlign: 'center' }}>Loading property details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <div className="property-detail-page">
          <div className="container">
            <div className="error-message">
              <h1>Property unavailable.</h1>
              <p>{error || "This property is no longer listed."}</p><button className="btn btn-outline" onClick={() => setAttempt(n => n + 1)}>Try again</button>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/properties')}
              >
                Back to Properties
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 🆕 FIXED: Get current image URL using helper function
  const currentImageUrl = property.images && property.images.length > 0 
    ? getImageUrl(property.images[currentImageIndex]) 
    : null;

  // 🆕 NEW: Check if property has any external links - more thorough check
  const hasExternalLinks = (property.links?.acres99 && property.links.acres99.trim() !== '') || 
                           (property.links?.magicbricks && property.links.magicbricks.trim() !== '');

  return (
    <>
      <div className="property-detail-page">
        <div className="container">
          {/* Back Button */}
          <div className="back-navigation">
            <button 
              className="back-btn"
              onClick={() => window.history.length > 1 ? router.back() : router.push('/properties')}
            >
              <BrandIcon className="fas fa-arrow-left" />
              Back to Properties
            </button>
          </div>

          {/* Property Header */}
          <div className="property-header">
            <div className="property-title-section">
              <h1>{property.title}</h1>
              <div className="property-location">
                <BrandIcon className="fas fa-map-marker-alt" />
                {property.location}
              </div>
              <div className="property-area-badge">
                <BrandIcon className="fas fa-building" />
                {areaName}
              </div>
            </div>
            <div className="property-price-section">
              <div className="property-price">{property.price}</div>
            </div>
          </div>

          {/* Property Images Gallery */}
          <div className="property-gallery">
            {property.images && property.images.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="main-image-container">
                  {failedImages[currentImageUrl] ? <div className="image-empty">Image unavailable</div> : <img
                    src={contentImageUrl(currentImageUrl, 1600)} decoding="async"
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="main-image"
                    onError={() => setFailedImages(old => ({ ...old, [currentImageUrl]: true }))}
                  />}
                  
                  {/* 🆕 NEW: Open in New Tab Button */}
                  <button 
                    className="open-image-btn"
                    onClick={openImageInNewTab}
                    title="Open image in new tab" aria-label="Open full-size image in new tab"
                  >
                    <BrandIcon className="fas fa-external-link-alt" />
                  </button>
                  
                  {/* Navigation Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button className="gallery-nav gallery-prev" aria-label="Previous photo" onClick={prevImage}>
                        <BrandIcon className="fas fa-chevron-left" />
                      </button>
                      <button className="gallery-nav gallery-next" aria-label="Next photo" onClick={nextImage}>
                        <BrandIcon className="fas fa-chevron-right" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="image-counter">
                    {currentImageIndex + 1} / {property.images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {property.images.length > 1 && (
                  <div className="thumbnail-gallery">
                    {property.images.map((image, index) => {
                      const thumbnailUrl = getImageUrl(image);
                      return (
                        <button type="button" aria-label={`Show photo ${index + 1}`} aria-pressed={index === currentImageIndex}
                          key={index}
                          className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => goToImage(index)}
                        >
                          <img
                            src={contentImageUrl(thumbnailUrl, 180)} decoding="async" loading="lazy"
                            alt={`${property.title} - Thumbnail ${index + 1}`}
                            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

              </>
            ) : (
              <div className="no-images">
                <BrandIcon className="fas fa-image" />
                <p>No images available for this property</p>
              </div>
            )}
          </div>

          {/* Property Details Grid */}
          <div className="property-details-grid">
            {/* Left Column - Main Details */}
            <div className="property-main-details">
              {/* Property Features */}
              <div className="detail-section">
                <h3>Property Features</h3>
                <div className="features-grid">
                  {/* 🆕 FIXED: Only show beds/baths if they exist, are not null, and are greater than 0 */}
                  {property.beds > 0 && (
                    <div className="feature-item">
                      <BrandIcon className="fas fa-bed" />
                      <span>{property.beds} Bedrooms</span>
                    </div>
                  )}
                  {property.baths > 0 && (
                    <div className="feature-item">
                      <BrandIcon className="fas fa-bath" />
                      <span>{property.baths} Bathrooms</span>
                    </div>
                  )}
                  {/* Always show area if available */}
                  {property.area && (
                    <div className="feature-item">
                      <BrandIcon className="fas fa-expand-arrows-alt" />
                      <span>{property.area}</span>
                    </div>
                  )}
                  {/* 🆕 IMPROVED: Show property type specific info */}
                  {property.propertyType === 'commercial' && (
                    <div className="feature-item">
                      <BrandIcon className="fas fa-building" />
                      <span>Commercial Space</span>
                    </div>
                  )}
                  {property.propertyType === 'residential' && (
                    <div className="feature-item">
                      <BrandIcon className="fas fa-users" />
                      <span>Residential</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <div className="detail-section">
                  <h3>Description</h3>
                  <p className="property-description">{property.description}</p>
                </div>
              )}

              {/* Additional Features */}
              {property.features && property.features.length > 0 && (
                <div className="detail-section">
                  <h3>Additional Features</h3>
                  <div className="features-list">
                    {property.features.map((feature, index) => (
                      <div key={index} className="feature-tag">
                        <BrandIcon className="fas fa-check" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact & Actions */}
            <div className="property-sidebar">
              {/* Contact Card */}
              <div className="contact-card">
                <h3>Interested in this property?</h3>
                <p>Contact us for more details and to schedule a viewing.</p>
                
                <div className="contact-actions">
                  <button 
                    className="btn btn-primary contact-btn"
                    onClick={() => router.push('/contact')}
                  >
                    <BrandIcon className="fas fa-phone" />
                    Contact Us
                  </button>
                  
                  <div className="contact-info">
                    {/* 🆕 FUNCTIONAL PHONE BUTTON */}
                    <button
                      onClick={() => handlePhoneCall('+919811186086')}
                      className="contact-item contact-item-button"
                    >
                      <BrandIcon className="fas fa-phone" />
                      <span>+91-9811186086</span>
                    </button>
                    {/* 🆕 FUNCTIONAL EMAIL BUTTON */}
                    <button
                      onClick={() => handleEmail('pawan127jitendra@gmail.com')}
                      className="contact-item contact-item-button"
                    >
                      <BrandIcon className="fas fa-envelope" />
                      <span>pawan127jitendra@gmail.com</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 🆕 UPDATED: External Links - Only show if links exist */}
              {hasExternalLinks && (
                <div className="external-links-card">
                  <h3>View on Other Platforms</h3>
                  <div className="external-links">
                    {property.links?.acres99 && (
                      <a 
                        href={property.links.acres99} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        <BrandIcon className="fas fa-external-link-alt" />
                        View on 99acres
                      </a>
                    )}
                    {property.links?.magicbricks && (
                      <a 
                        href={property.links.magicbricks} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        <BrandIcon className="fas fa-external-link-alt" />
                        View on MagicBricks
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Property Info */}
              <div className="property-info-card">
                <h3>Property Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Property Type:</span>
                    <span className="value">
                      {property.propertyType === 'commercial' ? 'Commercial' : 'Residential'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Area:</span>
                    <span className="value">{areaName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className="value">{property.isActive === false ? "No longer listed" : "Listed for enquiry"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyDetail;