// src/services/api.js - FIXED API Configuration
import axios from 'axios';

// 🔧 FIXED: Base URLs should NOT include /api
const BACKEND_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://property-dealing-qle8.onrender.com'  // ← Removed /api
  : 'http://localhost:5000';

const API_BASE_URL = `${BACKEND_BASE_URL}/api`;  // ← Add /api here once

console.log('🌐 Frontend API Base URL:', API_BASE_URL);
console.log('🌐 Backend Base URL:', BACKEND_BASE_URL);
console.log('🌐 Environment:', process.env.NODE_ENV);

// Helper function to get image URLs
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/map.webp';
  
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) {
    return imagePath;
  }
  
  const fullUrl = `${BACKEND_BASE_URL}${imagePath}`;
  return fullUrl;
};

// 🔧 FIXED: Helper function to get API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const fullUrl = `${API_BASE_URL}/${cleanEndpoint}`;
  return fullUrl;
};

// Axios Configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Add additional headers if needed
    config.headers['Access-Control-Allow-Origin'] = '*';
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      code: error.code
    });
    
    // Handle specific error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Network Error: Cannot connect to backend server');
      error.userMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.response?.status === 404) {
      console.error('🔍 Not Found: API endpoint not found');
      error.userMessage = 'The requested resource was not found.';
    } else if (error.response?.status === 500) {
      console.error('💥 Server Error: Internal server error');
      error.userMessage = 'Server error occurred. Please try again later.';
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Timeout: Request took too long');
      error.userMessage = 'Request timeout. The server is taking too long to respond.';
    } else if (error.message.includes('CORS')) {
      console.error('🚫 CORS Error: Cross-origin request blocked');
      error.userMessage = 'Connection blocked by browser security. Please contact support.';
    }
    
    return Promise.reject(error);
  }
);

// Contact form submission with better error handling
export const submitContactForm = async (formData) => {
  try {
    console.log('📧 Submitting contact form with data:', formData);
    
    const response = await api.post('/contacts', {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      interest: formData.interest?.trim() || '',
      message: formData.message.trim()
    });
    
    console.log('✅ Contact form submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Contact form submission failed:', error);
    
    // Provide user-friendly error messages
    if (error.userMessage) {
      throw new Error(error.userMessage);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Failed to submit contact form. Please try again.');
    }
  }
};

// Fetch all areas with better error handling
export const fetchAreas = async () => {
  try {
    console.log('🏢 Fetching areas from backend...');
    const response = await api.get('/areas');
    console.log('🏢 Areas fetched successfully:', response.data);
    return response.data.data || {};
  } catch (error) {
    console.error('❌ Error fetching areas:', error);
    
    // Return empty object instead of throwing
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend not reachable, returning empty areas');
      return {};
    }
    
    throw error;
  }
};

// 🆕 UPDATED: Fetch all properties with optional filters
export const fetchProperties = async (filters = {}) => {
  try {
    const { areaKey, propertyType } = filters;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (areaKey && areaKey !== 'all') {
      params.append('area', areaKey);
    }
    if (propertyType && propertyType !== 'all') {
      params.append('propertyType', propertyType);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/properties?${queryString}` : '/properties';
    
    console.log(`🏠 Fetching properties from: ${url}`);
    console.log(`🏠 Applied filters:`, { areaKey, propertyType });
    
    const response = await api.get(url);
    console.log('🏠 Properties fetched successfully:', response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching properties:', error);
    
    // Return empty array instead of throwing
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend not reachable, returning empty properties');
      return [];
    }
    
    throw error;
  }
};

// 🆕 UPDATED: Fetch properties by area with property type filter
export const fetchPropertiesByArea = async (areaKey, propertyType = 'all') => {
  try {
    console.log(`🏠 Fetching properties for area: ${areaKey}, type: ${propertyType}`);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (propertyType && propertyType !== 'all') {
      params.append('propertyType', propertyType);
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `/properties/area/${areaKey}?${queryString}` 
      : `/properties/area/${areaKey}`;
    
    const response = await api.get(url);
    console.log(`🏠 Properties for ${areaKey} (${propertyType}) fetched successfully`);
    return response.data.data || [];
  } catch (error) {
    console.error(`❌ Error fetching properties for area ${areaKey}:`, error);
    
    // Return empty array instead of throwing
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend not reachable, returning empty properties');
      return [];
    }
    
    throw error;
  }
};

// 🆕 NEW: Fetch properties with advanced filtering
export const fetchPropertiesWithFilters = async (filters = {}) => {
  try {
    const { area, propertyType, active } = filters;
    
    console.log(`🏠 Fetching properties with filters:`, filters);
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (area && area !== 'all') {
      params.append('area', area);
    }
    
    if (propertyType && propertyType !== 'all') {
      params.append('propertyType', propertyType);
    }
    
    if (active !== undefined) {
      params.append('active', active.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/properties/filter?${queryString}` : '/properties';
    
    const response = await api.get(url);
    console.log('🏠 Filtered properties fetched successfully:', response.data);
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching filtered properties:', error);
    
    // Return empty array instead of throwing
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend not reachable, returning empty properties');
      return [];
    }
    
    throw error;
  }
};

// 🆕 NEW: Get property type statistics
export const fetchPropertyTypeStats = async () => {
  try {
    console.log('📊 Fetching property type statistics...');
    
    const [allProperties, residentialProperties, commercialProperties] = await Promise.all([
      api.get('/properties'),
      api.get('/properties?propertyType=residential'),
      api.get('/properties?propertyType=commercial')
    ]);
    
    const stats = {
      total: allProperties.data.count || 0,
      residential: residentialProperties.data.count || 0,
      commercial: commercialProperties.data.count || 0
    };
    
    console.log('📊 Property type stats:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching property type stats:', error);
    return {
      total: 0,
      residential: 0,
      commercial: 0
    };
  }
};

// 🔧 FIXED: Fetch slider images
export const fetchSliderImages = async () => {
  try {
    console.log('🖼️ Fetching slider images from backend...');
    // Use direct API call instead of getApiUrl to avoid confusion
    const response = await api.get('/uploads/slider');
    console.log('🖼️ Slider images fetched successfully');
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching slider images:', error);
    
    // Return fallback images if API fails
    const fallbackImages = [
      {
        title: 'Modern House',
        imageUrl: 'https://images.unsplash.com/photo-1592394675778-4239b838fb2c?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        altText: 'Modern House'
      },
      {
        title: 'Luxury Villa',
        imageUrl: 'https://images.unsplash.com/photo-1673447620374-05f8b4842b41?q=80&w=1228&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        altText: 'Luxury Villa'
      },
      {
        title: 'Apartment Complex',
        imageUrl: 'https://i.pinimg.com/736x/63/08/b4/6308b4f4b61e0dfe0a5b2ff46fb81355.jpg',
        altText: 'Apartment Complex'
      }
    ];
    
    console.warn('⚠️ Using fallback images');
    return fallbackImages;
  }
};

// 🔧 FIXED: Fetch societies for a specific area/sub-area
export const fetchSocieties = async (areaKey, subAreaId) => {
  try {
    console.log(`🏘️ Fetching societies for area: ${areaKey}, sub-area: ${subAreaId}`);
    const response = await api.get(`/societies/${areaKey}/${subAreaId}`);
    console.log('🏘️ Societies fetched successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching societies:', error);
    throw error;
  }
};

// Health check with better error handling
export const checkBackendHealth = async () => {
  try {
    console.log('🔍 Checking backend health...');
    const response = await api.get('/health');
    console.log('✅ Backend health check passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    
    // Don't throw error, just return failed status
    return {
      status: 'failed',
      message: error.userMessage || 'Backend server is not responding',
      timestamp: new Date()
    };
  }
};

export default api;