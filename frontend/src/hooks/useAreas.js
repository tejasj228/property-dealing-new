// src/hooks/useAreas.js - Debug version with better error handling
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// Default areas fallback - matching what I see in your filter
const DEFAULT_AREAS = {
  'noida': {
    key: 'noida',
    name: 'Noida',
    description: 'Properties in Noida region',
    order: 0,
    subAreas: []
  },
  'yamuna-expressway': {
    key: 'yamuna-expressway',
    name: 'Yamuna Expressway',
    description: 'Properties along Yamuna Expressway',
    order: 1,
    subAreas: []
  },
  'indirapuram': {
    key: 'indirapuram',
    name: 'Indirapuram',
    description: 'Properties in Indirapuram',
    order: 2,
    subAreas: []
  }
};

// Utility functions
const formatAreaKey = (key) => {
  if (!key) return '';
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getAreaDisplayName = (area) => {
  if (!area) return '';
  if (area.displayName) return area.displayName;
  if (area.name) return area.name.replace(/\b\w/g, l => l.toUpperCase());
  if (area.key) return formatAreaKey(area.key);
  return '';
};

const areasObjectToArray = (areasObject) => {
  if (!areasObject || typeof areasObject !== 'object') return [];
  
  return Object.entries(areasObject).map(([key, area]) => ({
    key,
    name: area.name || key,
    displayName: getAreaDisplayName(area),
    description: area.description || '',
    order: area.order || 0,
    subAreas: area.subAreas || [],
    ...area
  }));
};

const sortAreasByOrder = (areas) => {
  return [...areas].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    
    const nameA = getAreaDisplayName(a).toLowerCase();
    const nameB = getAreaDisplayName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

const findAreaByKey = (areas, key) => {
  if (!areas || !key) return null;
  
  if (Array.isArray(areas)) {
    return areas.find(area => area.key === key) || null;
  }
  
  return areas[key] || null;
};

const areaExists = (areas, key) => {
  return findAreaByKey(areas, key) !== null;
};

const useAreas = (options = {}) => {
  const { 
    autoLoad = true, 
    sortBy = 'order',
    enableCache = false, // Disable cache for debugging
    fallbackToDefault = true
  } = options;

  const [areas, setAreas] = useState(fallbackToDefault ? DEFAULT_AREAS : {});
  const [areasLoading, setAreasLoading] = useState(autoLoad);
  const [areasError, setAreasError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Load areas from API
  const loadAreas = useCallback(async (force = false) => {
    try {
      setAreasLoading(true);
      setAreasError(null);
      
      console.log('🔄 Loading areas from API...');
      
      // Try multiple API URLs
      const API_URLS = [
        process.env.REACT_APP_API_URL,
        'https://property-dealing-qle8.onrender.com',
        'https://pawanbuildhome.com/api', // If you have this
        window.location.origin + '/api' // Same origin
      ].filter(Boolean);
      
      console.log('🔗 Trying API URLs:', API_URLS);
      
      let lastError = null;
      
      for (const API_URL of API_URLS) {
        try {
          console.log(`🔄 Trying: ${API_URL}/api/areas`);
          
          const response = await axios.get(`${API_URL}/api/areas`, {
            timeout: 8000,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          console.log('✅ API Response:', response.data);
          
          if (response.data && response.data.success && response.data.data) {
            const areasData = response.data.data;
            setAreas(areasData);
            setLastFetch(Date.now());
            console.log('✅ Areas loaded successfully:', Object.keys(areasData));
            return areasData;
          }
        } catch (error) {
          console.warn(`❌ Failed to load from ${API_URL}:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      // If all APIs failed, throw the last error
      throw lastError || new Error('All API endpoints failed');
      
    } catch (error) {
      console.error('❌ Error loading areas:', error);
      setAreasError(error.message);
      
      // Use default areas as fallback
      if (fallbackToDefault) {
        console.log('🔄 Using default areas as fallback');
        setAreas(DEFAULT_AREAS);
        return DEFAULT_AREAS;
      }
      
      return {};
    } finally {
      setAreasLoading(false);
    }
  }, [fallbackToDefault]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadAreas();
    }
  }, [autoLoad, loadAreas]);

  // Convert areas object to array with proper sorting
  const areasArray = useMemo(() => {
    console.log('🔄 Processing areas:', areas);
    
    let processedAreas = areasObjectToArray(areas);
    
    console.log('🔄 Processed areas array:', processedAreas);
    
    // Apply sorting
    if (sortBy === 'order') {
      processedAreas = sortAreasByOrder(processedAreas);
    } else if (sortBy === 'name') {
      processedAreas = processedAreas.sort((a, b) => {
        const nameA = getAreaDisplayName(a).toLowerCase();
        const nameB = getAreaDisplayName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
    
    console.log('🔄 Final sorted areas:', processedAreas);
    
    return processedAreas;
  }, [areas, sortBy]);

  // Helper functions
  const getAreaByKey = useCallback((key) => {
    return findAreaByKey(areas, key);
  }, [areas]);

  const getAreaName = useCallback((key) => {
    const area = getAreaByKey(key);
    return area ? getAreaDisplayName(area) : key;
  }, [getAreaByKey]);

  const checkAreaExists = useCallback((key) => {
    return areaExists(areas, key);
  }, [areas]);

  // Refetch areas (force reload)
  const refetchAreas = useCallback(async () => {
    return await loadAreas(true);
  }, [loadAreas]);

  // Get areas count
  const areasCount = Object.keys(areas).length;

  // Debug info
  console.log('🔍 useAreas Debug Info:', {
    areasCount,
    areasLoading,
    areasError,
    areasKeys: Object.keys(areas),
    areasArrayLength: areasArray.length
  });

  return {
    // Main data
    areas,
    areasArray,
    areasLoading,
    areasError,
    
    // Meta information
    areasCount,
    lastFetch,
    
    // Helper functions
    getAreaByKey,
    getAreaName,
    checkAreaExists,
    
    // Actions
    loadAreas,
    refetchAreas,
    
    // Utilities
    formatAreaName: getAreaDisplayName
  };
};

export default useAreas;