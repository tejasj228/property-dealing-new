import axios from 'axios';

// In Next.js, API routes are same-origin. Use relative URLs.
const API_BASE_URL = '/api';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/assets/map.webp';
  if (imagePath.startsWith('http') || imagePath.startsWith('//')) return imagePath;
  return imagePath;
};

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.userMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'The requested resource was not found.';
    } else if (error.response?.status === 500) {
      error.userMessage = 'Server error occurred. Please try again later.';
    } else if (error.message?.includes('timeout')) {
      error.userMessage = 'Request timeout. The server is taking too long to respond.';
    }
    return Promise.reject(error);
  }
);

export const submitContactForm = async (formData) => {
  try {
    const response = await api.post('/contacts', {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      interest: formData.interest?.trim() || '',
      message: formData.message.trim(),
    });
    return response.data;
  } catch (error) {
    if (error.userMessage) throw new Error(error.userMessage);
    else if (error.response?.data?.message) throw new Error(error.response.data.message);
    else throw new Error('Failed to submit contact form. Please try again.');
  }
};

export const fetchAreas = async () => {
  try {
    const response = await api.get('/areas');
    return response.data.data || {};
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') return {};
    throw error;
  }
};

export const fetchProperties = async (filters = {}) => {
  try {
    const { areaKey, propertyType } = filters;
    const params = new URLSearchParams();
    if (areaKey && areaKey !== 'all') params.append('area', areaKey);
    if (propertyType && propertyType !== 'all') params.append('propertyType', propertyType);
    const queryString = params.toString();
    const url = queryString ? `/properties?${queryString}` : '/properties';
    const response = await api.get(url);
    return response.data.data || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') return [];
    throw error;
  }
};

export const fetchPropertiesByArea = async (areaKey, propertyType = 'all') => {
  try {
    const params = new URLSearchParams();
    if (propertyType && propertyType !== 'all') params.append('propertyType', propertyType);
    const queryString = params.toString();
    const url = queryString ? `/properties/area/${areaKey}?${queryString}` : `/properties/area/${areaKey}`;
    const response = await api.get(url);
    return response.data.data || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') return [];
    throw error;
  }
};

export const fetchPropertiesWithFilters = async (filters = {}) => {
  try {
    const { area, propertyType, active } = filters;
    const params = new URLSearchParams();
    if (area && area !== 'all') params.append('area', area);
    if (propertyType && propertyType !== 'all') params.append('propertyType', propertyType);
    if (active !== undefined) params.append('active', active.toString());
    const queryString = params.toString();
    const url = queryString ? `/properties/filter?${queryString}` : '/properties';
    const response = await api.get(url);
    return response.data.data || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') return [];
    throw error;
  }
};

export const fetchPropertyTypeStats = async () => {
  try {
    const [allProperties, residentialProperties, commercialProperties] = await Promise.all([
      api.get('/properties'),
      api.get('/properties?propertyType=residential'),
      api.get('/properties?propertyType=commercial'),
    ]);
    return { total: allProperties.data.count || 0, residential: residentialProperties.data.count || 0, commercial: commercialProperties.data.count || 0 };
  } catch {
    return { total: 0, residential: 0, commercial: 0 };
  }
};

export const fetchSliderImages = async () => {
  try {
    const response = await api.get('/uploads/slider');
    return response.data.data || [];
  } catch {
    return [
      { title: 'Modern House', imageUrl: 'https://images.unsplash.com/photo-1592394675778-4239b838fb2c?q=80&w=1074&auto=format&fit=crop', altText: 'Modern House' },
      { title: 'Luxury Villa', imageUrl: 'https://images.unsplash.com/photo-1673447620374-05f8b4842b41?q=80&w=1228&auto=format&fit=crop', altText: 'Luxury Villa' },
      { title: 'Apartment Complex', imageUrl: 'https://i.pinimg.com/736x/63/08/b4/6308b4f4b61e0dfe0a5b2ff46fb81355.jpg', altText: 'Apartment Complex' },
    ];
  }
};

export const fetchSocieties = async (areaKey, subAreaId) => {
  try {
    const response = await api.get(`/societies/${areaKey}/${subAreaId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'failed', message: error.userMessage || 'Backend server is not responding', timestamp: new Date() };
  }
};

export default api;
