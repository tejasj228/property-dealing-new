// src/utils/areaUtils.js - Utility functions for area management

/**
 * Format area key to display name
 * @param {string} key - Area key (e.g., 'yamuna-expressway')
 * @returns {string} - Formatted display name (e.g., 'Yamuna Expressway')
 */
export const formatAreaKey = (key) => {
  if (!key) return '';
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format area name to URL-friendly key
 * @param {string} name - Area name (e.g., 'Yamuna Expressway')
 * @returns {string} - URL-friendly key (e.g., 'yamuna-expressway')
 */
export const formatAreaName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Get area display name with proper capitalization
 * @param {Object} area - Area object
 * @returns {string} - Properly formatted display name
 */
export const getAreaDisplayName = (area) => {
  if (!area) return '';
  if (area.displayName) return area.displayName;
  if (area.name) return area.name.replace(/\b\w/g, l => l.toUpperCase());
  if (area.key) return formatAreaKey(area.key);
  return '';
};

/**
 * Sort areas array by name alphabetically
 * @param {Array} areas - Array of area objects
 * @returns {Array} - Sorted array
 */
export const sortAreasByName = (areas) => {
  return [...areas].sort((a, b) => {
    const nameA = getAreaDisplayName(a).toLowerCase();
    const nameB = getAreaDisplayName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Sort areas array by order field, then by name
 * @param {Array} areas - Array of area objects
 * @returns {Array} - Sorted array
 */
export const sortAreasByOrder = (areas) => {
  return [...areas].sort((a, b) => {
    // First sort by order if it exists
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    
    // Then sort by name
    const nameA = getAreaDisplayName(a).toLowerCase();
    const nameB = getAreaDisplayName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

/**
 * Find area by key in areas object or array
 * @param {Object|Array} areas - Areas object or array
 * @param {string} key - Area key to find
 * @returns {Object|null} - Found area or null
 */
export const findAreaByKey = (areas, key) => {
  if (!areas || !key) return null;
  
  if (Array.isArray(areas)) {
    return areas.find(area => area.key === key) || null;
  }
  
  return areas[key] || null;
};

/**
 * Check if area key exists in areas
 * @param {Object|Array} areas - Areas object or array
 * @param {string} key - Area key to check
 * @returns {boolean} - True if area exists
 */
export const areaExists = (areas, key) => {
  return findAreaByKey(areas, key) !== null;
};

/**
 * Get all area keys from areas object or array
 * @param {Object|Array} areas - Areas object or array
 * @returns {Array} - Array of area keys
 */
export const getAreaKeys = (areas) => {
  if (!areas) return [];
  
  if (Array.isArray(areas)) {
    return areas.map(area => area.key).filter(Boolean);
  }
  
  return Object.keys(areas);
};

/**
 * Convert areas object to array with consistent format
 * @param {Object} areasObject - Areas object from API
 * @returns {Array} - Array of area objects
 */
export const areasObjectToArray = (areasObject) => {
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

/**
 * Filter areas by search query
 * @param {Array} areas - Array of area objects
 * @param {string} query - Search query
 * @returns {Array} - Filtered areas
 */
export const filterAreasBySearch = (areas, query) => {
  if (!query || !query.trim()) return areas;
  
  const searchTerm = query.toLowerCase().trim();
  
  return areas.filter(area => {
    const name = getAreaDisplayName(area).toLowerCase();
    const description = (area.description || '').toLowerCase();
    const key = (area.key || '').toLowerCase();
    
    return name.includes(searchTerm) || 
           description.includes(searchTerm) || 
           key.includes(searchTerm);
  });
};

/**
 * Get area statistics
 * @param {Array} areas - Array of area objects
 * @returns {Object} - Statistics object
 */
export const getAreaStatistics = (areas) => {
  if (!Array.isArray(areas)) return { total: 0, withSubAreas: 0, totalSubAreas: 0 };
  
  const stats = {
    total: areas.length,
    withSubAreas: 0,
    totalSubAreas: 0,
    averageSubAreas: 0
  };
  
  areas.forEach(area => {
    const subAreasCount = area.subAreas ? area.subAreas.length : 0;
    stats.totalSubAreas += subAreasCount;
    if (subAreasCount > 0) {
      stats.withSubAreas++;
    }
  });
  
  stats.averageSubAreas = stats.total > 0 ? stats.totalSubAreas / stats.total : 0;
  
  return stats;
};

/**
 * Validate area object structure
 * @param {Object} area - Area object to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateArea = (area) => {
  const errors = [];
  
  if (!area) {
    errors.push('Area object is required');
    return { isValid: false, errors };
  }
  
  if (!area.key || typeof area.key !== 'string') {
    errors.push('Area key is required and must be a string');
  }
  
  if (!area.name || typeof area.name !== 'string') {
    errors.push('Area name is required and must be a string');
  }
  
  if (area.subAreas && !Array.isArray(area.subAreas)) {
    errors.push('SubAreas must be an array');
  }
  
  if (area.order !== undefined && typeof area.order !== 'number') {
    errors.push('Order must be a number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Default fallback areas when API fails
 */
export const DEFAULT_AREAS = {
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
  }
};

/**
 * Get default areas as array
 * @returns {Array} - Array of default areas
 */
export const getDefaultAreas = () => {
  return areasObjectToArray(DEFAULT_AREAS);
};