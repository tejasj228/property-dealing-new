'use client';
import { useState, useEffect } from 'react';
import { fetchAreas } from '@/services/api';
import { areasObjectToArray, sortAreasByOrder, getDefaultAreas } from '@/utils/areaUtils';

const useAreas = (options = {}) => {
  const {
    autoLoad = true,
    fallbackToDefault = true,
    enableCache = true,
    cacheTimeout = 5,
  } = options;

  const [areasObject, setAreasObject] = useState({});
  const [areasArray, setAreasArray] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [areasError, setAreasError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const CACHE_KEY = 'pawan_buildhome_areas';
  const CACHE_TIMESTAMP_KEY = 'pawan_buildhome_areas_timestamp';

  const isCacheValid = () => {
    if (!enableCache) return false;
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge < cacheTimeout * 60 * 1000;
  };

  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData && isCacheValid()) {
        const parsedData = JSON.parse(cachedData);
        setAreasObject(parsedData);
        setAreasArray(sortAreasByOrder(areasObjectToArray(parsedData)));
        return true;
      }
    } catch (error) {
      console.warn('Failed to load areas from cache:', error);
    }
    return false;
  };

  const saveToCache = (data) => {
    if (!enableCache) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save areas to cache:', error);
    }
  };

  const loadAreas = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && loadFromCache()) return;

      setAreasLoading(true);
      setAreasError(null);

      const areasData = await fetchAreas();

      if (areasData && Object.keys(areasData).length > 0) {
        setAreasObject(areasData);
        const areasArrayData = sortAreasByOrder(areasObjectToArray(areasData));
        setAreasArray(areasArrayData);
        setLastFetched(new Date());
        saveToCache(areasData);
      } else if (fallbackToDefault) {
        const defaultAreas = getDefaultAreas();
        setAreasArray(defaultAreas);
        setAreasObject(defaultAreas.reduce((acc, area) => { acc[area.key] = area; return acc; }, {}));
      } else {
        setAreasError('No areas found');
      }
    } catch (error) {
      setAreasError(error.message);
      if (!loadFromCache() && fallbackToDefault) {
        const defaultAreas = getDefaultAreas();
        setAreasArray(defaultAreas);
        setAreasObject(defaultAreas.reduce((acc, area) => { acc[area.key] = area; return acc; }, {}));
      }
    } finally {
      setAreasLoading(false);
    }
  };

  const refreshAreas = () => loadAreas(true);
  const clearCache = () => { localStorage.removeItem(CACHE_KEY); localStorage.removeItem(CACHE_TIMESTAMP_KEY); };
  const getAreaByKey = (key) => areasObject[key] || null;
  const areaExists = (key) => key in areasObject;
  const getAreaOptions = () => areasArray.map(area => ({ value: area.key, label: area.displayName || area.name, ...area }));

  useEffect(() => { if (autoLoad) loadAreas(); }, [autoLoad]);

  return { areasObject, areasArray, areasLoading, areasError, lastFetched, loadAreas, refreshAreas, clearCache, getAreaByKey, areaExists, getAreaOptions, hasAreas: areasArray.length > 0, isEmpty: areasArray.length === 0, cacheValid: isCacheValid() };
};

export default useAreas;
