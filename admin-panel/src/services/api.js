import axios from 'axios';
import { uploadImageFile, uploadImageFiles } from './imageUploader';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 Authentication failed - redirecting to login');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Property API functions
export const propertyAPI = {
  // Get all properties
  getAll: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response.data;
  },

  // Get properties by area
  getByArea: async (areaKey) => {
    const response = await api.get(`/properties/area/${areaKey}`);
    return response.data;
  },

  // Get single property
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  // Create new property
  create: async (propertyData) => {
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  // Update property
  update: async (id, propertyData) => {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  // Delete property
  delete: async (id) => {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  // Reorder properties
  reorder: async (propertyIds) => {
    const response = await api.put('/properties/reorder', { propertyIds });
    return response.data;
  },
};

// Area API functions
export const areaAPI = {
  // Get all areas
  getAll: async () => {
    const response = await api.get('/areas');
    return response.data;
  },

  // Get single area
  getByKey: async (key) => {
    const response = await api.get(`/areas/${key}`);
    return response.data;
  },

  // Create new area
  create: async (areaData) => {
    const response = await api.post('/areas', areaData);
    return response.data;
  },

  // Update area
  update: async (key, areaData) => {
    const response = await api.put(`/areas/${key}`, areaData);
    return response.data;
  },

  // Delete area
  delete: async (key) => {
    const response = await api.delete(`/areas/${key}`);
    return response.data;
  },

  // Reorder areas
  reorder: async (areaKeys) => {
    const response = await api.put('/areas/reorder', { areaKeys });
    return response.data;
  },

  // Reorder sub-areas
  reorderSubAreas: async (areaKey, subAreas) => {
    const response = await api.put(`/areas/${areaKey}/subareas/reorder`, { subAreas });
    return response.data;
  },
};

// Upload API functions
// Photos go straight to Cloudinary with credentials signed by the website, so the website's
// request-size limit and the short API timeout do not apply to them.
const signUpload = async purpose => (await api.post('/uploads/sign', { purpose })).data.data;
const serverUpload = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/uploads/image', formData, {
    timeout: 120000,
    onUploadProgress: event => onProgress?.(event.loaded, event.total),
  });
  return response.data.data;
};

export const uploadAPI = {
  // Upload single image; resolves in the same shape the website's upload route returns
  uploadImage: async (file, onProgress = null, purpose = 'property') => {
    const stored = await uploadImageFile(file, {
      purpose, sign: signUpload, legacyUpload: serverUpload,
      onProgress: onProgress ? (loaded, total) => onProgress(Math.round((loaded * 100) / (total || 1))) : undefined,
    });
    return { success: true, data: { imageUrl: stored.imageUrl, filename: stored.publicId, originalName: file.name, size: file.size } };
  },

  // Upload several images; every photo reports on its own and failures do not discard the others
  uploadImages: (files, options = {}) => uploadImageFiles(files, { sign: signUpload, legacyUpload: serverUpload, ...options }),

  // Get all uploaded files
  getFiles: async () => {
    const response = await api.get('/uploads/files');
    return response.data;
  },

  // Get slider images
  getSliderImages: async () => {
    const response = await api.get('/uploads/slider');
    return response.data;
  },

  // Add slider image: the photo is uploaded first, then the slide is saved with its address
  addSliderImage: async (file, imageData, onProgress = null) => {
    const { data } = await uploadAPI.uploadImage(file, onProgress, 'slider');
    const response = await api.post('/uploads/slider', {
      title: imageData.title,
      altText: imageData.altText,
      order: imageData.order,
      imageUrl: data.imageUrl,
    });
    return response.data;
  },

  // Delete slider image
  deleteSliderImage: async (id) => {
    const response = await api.delete(`/uploads/slider/${id}`);
    return response.data;
  },

  // Delete file
  deleteFile: async (filename) => {
    const response = await api.delete(`/uploads/${filename}`);
    return response.data;
  },
};

// Contact API functions
export const contactAPI = {
  // Get all contacts with pagination and filtering
  getAll: async (params = {}, options = {}) => {
    const response = await api.get('/contacts', { ...options, params });
    return response.data;
  },

  // Get contact statistics
  getStats: async () => {
    const response = await api.get('/contacts/stats');
    return response.data;
  },

  // Get single contact
  getById: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  // Update contact (status, priority, notes)
  update: async (id, contactData) => {
    const response = await api.put(`/contacts/${id}`, contactData);
    return response.data;
  },

  // Mark contact as read
  markAsRead: async (id) => {
    const response = await api.put(`/contacts/${id}/mark-read`);
    return response.data;
  },

  // Delete contact
  delete: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not responding');
  }
};

// Export the axios instance for custom requests
export default api;
export const analyticsAPI = { getOverview: async () => (await api.get("/analytics")).data };
