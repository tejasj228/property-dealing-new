// src/hooks/useAreas.js - Enhanced hook for areas with better error handling
import { useState, useEffect } from 'react';
import { fetchAreas } from '../services/api';
import { areasObjectToArray, sortAreasByOrder, getDefaultAreas } from '../utils/areaUtils';

/**
 * Custom hook for managing areas data
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoLoad - Auto load areas on mount (default: true)
 * @param {boolean} options.fallbackToDefault - Use default areas if API fails (default: true)
 * @param {boolean} options.enableCache - Enable client-side caching (default: true)
 * @param {number} options.cacheTimeout - Cache timeout in minutes (default: 5)
 * @returns {Object} - Areas data and methods
 */
const useAreas = (options = {}) => {
  const {
    autoLoad = true,
    fallbackToDefault = true,
    enableCache = true,
    cacheTimeout = 5
  } = options;

  const [areasObject, setAreasObject] = useState({});
  const [areasArray, setAreasArray] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // Cache keys
  const CACHE_KEY = 'pawan_buildhome_areas';
  const CACHE_TIMESTAMP_KEY = 'pawan_buildhome_areas_timestamp';

  /**
   * Check if cached data is still valid
   */
  const isCacheValid = () => {
    if (!enableCache) return false;
    
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const maxAge = cacheTimeout * 60 * 1000; // Convert minutes to milliseconds
    
    return cacheAge < maxAge;
  };

  /**
   * Load areas from cache
   */
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData && isCacheValid()) {
        console.log('📦 Loading areas from cache');
        const parsedData = JSON.parse(cachedData);
        setAreasObject(parsedData);
        setAreasArray(sortAreasByOrder(areasObjectToArray(parsedData)));
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load areas from cache:', error);
    }
    return false;
  };

  /**
   * Save areas to cache
   */
  const saveToCache = (data) => {
    if (!enableCache) return;
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('💾 Areas saved to cache');
    } catch (error) {
      console.warn('⚠️ Failed to save areas to cache:', error);
    }
  };

  /**
   * Load areas from API
   */
  const loadAreas = async (forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh && loadFromCache()) {
        return;
      }

      console.log('🏢 Loading areas from API...');
      setAreasLoading(true);
      setAreasError(null);

      const areasData = await fetchAreas();
      
      if (areasData && Object.keys(areasData).length > 0) {
        console.log('✅ Areas loaded from API:', Object.keys(areasData));
        
        setAreasObject(areasData);
        const areasArrayData = sortAreasByOrder(areasObjectToArray(areasData));
        setAreasArray(areasArrayData);
        setLastFetched(new Date());
        
        // Save to cache
        saveToCache(areasData);
        
      } else if (fallbackToDefault) {
        console.warn('⚠️ API returned empty data, using default areas');
        const defaultAreas = getDefaultAreas();
        setAreasArray(defaultAreas);
        setAreasObject(defaultAreas.reduce((acc, area) => {
          acc[area.key] = area;
          return acc;
        }, {}));
      } else {
        setAreasError('No areas found');
      }
      
    } catch (error) {
      console.error('❌ Error loading areas:', error);
      setAreasError(error.message);
      
      // Try to use cached data or fallback
      if (!loadFromCache() && fallbackToDefault) {
        console.warn('⚠️ Using default areas as fallback');
        const defaultAreas = getDefaultAreas();
        setAreasArray(defaultAreas);
        setAreasObject(defaultAreas.reduce((acc, area) => {
          acc[area.key] = area;
          return acc;
        }, {}));
      }
    } finally {
      setAreasLoading(false);
    }
  };

  /**
   * Refresh areas data
   */
  const refreshAreas = () => {
    return loadAreas(true);
  };

  /**
   * Clear areas cache
   */
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('🧹 Areas cache cleared');
  };

  /**
   * Get area by key
   */
  const getAreaByKey = (key) => {
    return areasObject[key] || null;
  };

  /**
   * Check if area exists
   */
  const areaExists = (key) => {
    return key in areasObject;
  };

  /**
   * Get areas for dropdown/select components
   */
  const getAreaOptions = () => {
    return areasArray.map(area => ({
      value: area.key,
      label: area.displayName || area.name,
      ...area
    }));
  };

  // Auto-load areas on mount
  useEffect(() => {
    if (autoLoad) {
      loadAreas();
    }
  }, [autoLoad]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏢 Areas Hook State:', {
        areasCount: areasArray.length,
        loading: areasLoading,
        error: areasError,
        lastFetched,
        cacheValid: isCacheValid()
      });
    }
  }, [areasArray.length, areasLoading, areasError, lastFetched]);

  return {
    // Data
    areasObject,
    areasArray,
    
    // State
    areasLoading,
    areasError,
    lastFetched,
    
    // Methods
    loadAreas,
    refreshAreas,
    clearCache,
    getAreaByKey,
    areaExists,
    getAreaOptions,
    
    // Computed values
    hasAreas: areasArray.length > 0,
    isEmpty: areasArray.length === 0,
    cacheValid: isCacheValid()
  };
};

export default useAreas;