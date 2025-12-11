import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageTransition from './PageTransition';
import './Properties.css';

// 🔧 FIXED: Simplified API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://property-dealing-kbyb.onrender.com/api'
  : 'http://localhost:5000/api';

// Image Carousel Component for Frontend Property Cards
const PropertyImageCarousel = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to get correct image URL
  const getImageUrl = (imageUrl) => {
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `http://localhost:5000${imageUrl}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (images && images.length > 1) {
      const interval = setInterval(nextImage, 3000);
      return () => clearInterval(interval);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="property-image">
        <div style={{
          height: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          flexDirection: 'column'
        }}>
          <i className="fas fa-image" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
          <span>No Image Available</span>
        </div>
      </div>
    );
  }

  const currentImageUrl = getImageUrl(images[currentImageIndex]);

  return (
    <div className="property-image-carousel">
      <div 
        className="property-image"
        style={{
          position: 'relative',
          height: '250px',
          overflow: 'hidden',
          borderRadius: '8px'
        }}
      >
        <img
          src={currentImageUrl}
          alt={`${title} - Image ${currentImageIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onLoad={() => {
            console.log('✅ Property image loaded successfully');
          }}
          onError={(e) => {
            console.error('❌ Property image failed to load:', currentImageUrl);
          }}
        />

        {images.length > 1 && (
          <>
            <button 
              className="carousel-btn carousel-btn-prev"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevImage();
              }}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 2
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <button 
              className="carousel-btn carousel-btn-next"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextImage();
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                zIndex: 2
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>

            <div 
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {currentImageIndex + 1}/{images.length}
            </div>

            <div 
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '6px'
              }}
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Property Type Badge Component
const PropertyTypeBadge = ({ propertyType }) => {
  const getTypeInfo = (type) => {
    switch (type) {
      case 'commercial':
        return {
          icon: 'fas fa-building',
          label: 'Commercial',
          className: 'property-type-commercial'
        };
      case 'residential':
      default:
        return {
          icon: 'fas fa-home',
          label: 'Residential',
          className: 'property-type-residential'
        };
    }
  };

  const typeInfo = getTypeInfo(propertyType);

  return (
    <div className={`property-type-badge ${typeInfo.className}`}>
      <i className={typeInfo.icon}></i>
      <span>{typeInfo.label}</span>
    </div>
  );
};

// 🆕 NEW: Helper function to check if property has beds/baths info
const hasBedsAndBaths = (property) => {
  return property.beds && property.beds > 0 && property.baths && property.baths > 0;
};

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || 'all');
  const [selectedPropertyType, setSelectedPropertyType] = useState(searchParams.get('type') || 'all');
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [areas, setAreas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Property Type Options
  const propertyTypeOptions = [
    { value: 'all', label: 'All Types', icon: 'fas fa-list' },
    { value: 'residential', label: 'Residential', icon: 'fas fa-home' },
    { value: 'commercial', label: 'Commercial', icon: 'fas fa-building' }
  ];

  // Hardcoded areas for now since areas API is failing
  const fallbackAreas = {
    'central-noida': { name: 'Central Noida' },
    'noida-expressway': { name: 'Noida Expressway' },
    'yamuna-expressway': { name: 'Yamuna Expressway' }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const areaFromUrl = searchParams.get('area');
    const typeFromUrl = searchParams.get('type');
    
    if (areaFromUrl && areaFromUrl !== selectedArea) {
      setSelectedArea(areaFromUrl);
    }
    if (typeFromUrl && typeFromUrl !== selectedPropertyType) {
      setSelectedPropertyType(typeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (Object.keys(areas).length > 0) {
      filterProperties();
    }
  }, [selectedArea, selectedPropertyType, areas]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load areas, but use fallback if it fails
      try {
        console.log('🏢 Trying to load areas from API...');
        const areasResponse = await fetch(`${API_BASE_URL}/areas`);
        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          setAreas(areasData.data || {});
          console.log('✅ Areas loaded from API');
        } else {
          throw new Error('Areas API failed');
        }
      } catch (areasError) {
        console.warn('⚠️ Areas API failed, using fallback areas');
        setAreas(fallbackAreas);
      }
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError('Failed to load data');
      setAreas(fallbackAreas);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 FIXED: Simplified property fetching
  const filterProperties = async () => {
    try {
      setLoading(true);
      
      console.log(`🏠 Loading properties for area: ${selectedArea}, type: ${selectedPropertyType}`);

      // Build URL with filters
      const params = new URLSearchParams();
      if (selectedArea !== 'all') {
        params.append('area', selectedArea);
      }
      if (selectedPropertyType !== 'all') {
        params.append('propertyType', selectedPropertyType);
      }
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/properties${queryString ? `?${queryString}` : ''}`;
      
      console.log(`🌐 Fetching from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const properties = data.data || [];

      console.log(`✅ Properties loaded: ${properties.length}`);

      // Add area information to each property
      const propertiesWithAreaInfo = properties.map(property => ({
        ...property,
        areaName: areas[property.areaKey]?.name || property.areaKey,
        propertyType: property.propertyType || 'residential' // Ensure propertyType exists
      }));

      setFilteredProperties(propertiesWithAreaInfo);
      setError(null);
      
    } catch (error) {
      console.error('❌ Error filtering properties:', error);
      setError(`Failed to load properties: ${error.message}`);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (areaKey) => {
    setSelectedArea(areaKey);
    updateUrlParams(areaKey, selectedPropertyType);
  };

  const handlePropertyTypeChange = (propertyType) => {
    setSelectedPropertyType(propertyType);
    updateUrlParams(selectedArea, propertyType);
  };

  const updateUrlParams = (area, type) => {
    const params = new URLSearchParams();
    
    if (area !== 'all') {
      params.set('area', area);
    }
    
    if (type !== 'all') {
      params.set('type', type);
    }
    
    if (params.toString()) {
      setSearchParams(params);
    } else {
      setSearchParams({});
    }
  };

  const handleViewProperty = (property) => {
    console.log('🏠 Navigating to property details:', property.title);
    navigate(`/property/${property._id || property.id}`, { 
      state: { property, areaName: property.areaName } 
    });
  };

  const getPageTitle = () => {
    let title = '';
    
    if (selectedPropertyType === 'all') {
      title += 'All Properties';
    } else {
      const typeOption = propertyTypeOptions.find(opt => opt.value === selectedPropertyType);
      title += typeOption ? typeOption.label + ' Properties' : 'Properties';
    }
    
    if (selectedArea !== 'all') {
      const areaName = areas[selectedArea]?.name;
      if (areaName) {
        title += ` in ${areaName}`;
      }
    }
    
    return title;
  };

  const getPageDescription = () => {
    let description = 'Explore ';
    
    if (selectedPropertyType === 'all') {
      description += 'all types of properties ';
    } else {
      const typeOption = propertyTypeOptions.find(opt => opt.value === selectedPropertyType);
      description += `${typeOption?.label.toLowerCase()} properties `;
    }
    
    if (selectedArea === 'all') {
      description += 'across our premium locations';
    } else {
      const areaData = areas[selectedArea];
      description += `in ${areaData?.name || selectedArea}`;
    }
    
    return description;
  };

  if (loading && Object.keys(areas).length === 0) {
    return (
      <PageTransition>
        <div className="properties-page">
          <div className="container">
            <div className="section-title">
              <h2>Loading Properties...</h2>
              <div className="loading-spinner" style={{ margin: '50px auto' }}></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="properties-page">
        <div className="container">
          <div className="section-title">
            <h2>{getPageTitle()}</h2>
            <p>{getPageDescription()}</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ef5350'
            }}>
              <strong>Error:</strong> {error}
              <br />
              <small>Check browser console for more details.</small>
            </div>
          )}

          {/* Enhanced Filter Section */}
          <div className="filter-section">
            <div className="filter-container">
              {/* Area Filters */}
              <div className="filter-group">
                <h3>Filter by Area:</h3>
                <div className="area-filters">
                  <button
                    className={`filter-btn ${selectedArea === 'all' ? 'active' : ''}`}
                    onClick={() => handleAreaChange('all')}
                  >
                    <i className="fas fa-globe"></i>
                    All Areas
                  </button>
                  {Object.entries(areas).map(([key, area]) => (
                    <button
                      key={key}
                      className={`filter-btn ${selectedArea === key ? 'active' : ''}`}
                      onClick={() => handleAreaChange(key)}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type Filters */}
              <div className="filter-group">
                <h3>Filter by Property Type:</h3>
                <div className="property-type-filters">
                  {propertyTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`filter-btn property-type-btn ${selectedPropertyType === option.value ? 'active' : ''}`}
                      onClick={() => handlePropertyTypeChange(option.value)}
                    >
                      <i className={option.icon}></i>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div className="loading-spinner"></div>
              <p>Loading properties...</p>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="properties-grid">
              {filteredProperties.map((property, index) => (
                <div 
                  key={property._id || `${property.areaKey}-${index}`} 
                  className="property-card"
                  style={{
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {/* Property Image with Carousel */}
                  <PropertyImageCarousel 
                    images={property.images} 
                    title={property.title}
                  />
                  
                  {/* Property Details */}
                  <div className="property-details">
                    <div className="property-content">
                      <div className="property-price">{property.price}</div>
                      <div className="property-title">{property.title}</div>
                      <div className="property-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {property.location}
                      </div>
                      <div className="property-badges">
                        <div className="property-area-badge">
                          <i className="fas fa-building"></i>
                          {property.areaName}
                        </div>
                        {/* Property Type Badge */}
                        <PropertyTypeBadge propertyType={property.propertyType} />
                      </div>
                      {/* 🆕 UPDATED: Conditional rendering of property features */}
                      <div className="property-features">
                        {/* Only show beds/baths if they exist and are greater than 0 */}
                        {hasBedsAndBaths(property) && (
                          <>
                            <div className="feature">
                              <i className="fas fa-bed"></i>
                              {property.beds} Beds
                            </div>
                            <div className="feature">
                              <i className="fas fa-bath"></i>
                              {property.baths} Baths
                            </div>
                          </>
                        )}
                        {/* Always show area if available */}
                        {property.area && (
                          <div className="feature">
                            <i className="fas fa-expand-arrows-alt"></i>
                            {property.area}
                          </div>
                        )}
                        {/* For commercial properties without beds/baths, show property type */}
                        {!hasBedsAndBaths(property) && property.propertyType === 'commercial' && (
                          <div className="feature">
                            <i className="fas fa-building"></i>
                            Commercial Space
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* View Property Button */}
                    <div className="property-buttons">
                      <button
                        className="btn btn-primary view-property-btn"
                        onClick={() => handleViewProperty(property)}
                      >
                        <i className="fas fa-eye"></i>
                        View Property
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-properties">
              <div className="no-properties-content">
                <i className="fas fa-home"></i>
                <h3>No Properties Available</h3>
                <p>
                  {selectedArea === 'all' && selectedPropertyType === 'all'
                    ? "No properties found. This might be due to server connectivity issues. Please try again later or contact us."
                    : `No ${selectedPropertyType !== 'all' ? propertyTypeOptions.find(opt => opt.value === selectedPropertyType)?.label.toLowerCase() + ' ' : ''}properties found${selectedArea !== 'all' ? ` in ${areas[selectedArea]?.name || selectedArea}` : ''}. Try adjusting your filters or contact us for more information.`
                  }
                </p>
                <div className="no-properties-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/contact'}
                  >
                    Contact Us
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setSelectedArea('all');
                      setSelectedPropertyType('all');
                      setSearchParams({});
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Properties;