import { getImageUrl, handleImageError } from '../utils/imageUtils';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Paper,
  Fab,
  CardMedia,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  Bed as BedIcon,
  Bathtub as BathtubIcon,
  AspectRatio as AreaIcon,
  Image as ImageIcon,
  DragIndicator as DragIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Business as CommercialIcon,
  House as ResidentialIcon,
} from '@mui/icons-material';

// Modern drag & drop imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { propertyAPI, areaAPI } from '../services/api';
import ImageUpload from '../components/ImageUpload/ImageUpload';

// 🆕 NEW: Property Type Options
const propertyTypeOptions = [
  { value: 'residential', label: 'Residential', icon: <ResidentialIcon /> },
  { value: 'commercial', label: 'Commercial', icon: <CommercialIcon /> },
];

// Image Carousel Component for Property Cards
const PropertyImageCarousel = ({ images, title }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          height: 200,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
        }}
      >
        <ImageIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: 200 }}>
      <CardMedia
        component="img"
        height="200"
        image={getImageUrl(images[currentImageIndex])}
        alt={`${title} - Image ${currentImageIndex + 1}`}
        sx={{ objectFit: 'cover' }}
        onError={(e) => handleImageError(e, images[currentImageIndex])}
      />
      
      {images.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <IconButton
            size="small"
            onClick={prevImage}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.8)',
              },
            }}
          >
            <PrevIcon />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={nextImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.8)',
              },
            }}
          >
            <NextIcon />
          </IconButton>

          {/* Image Counter */}
          <Chip
            label={`${currentImageIndex + 1}/${images.length}`}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              color: 'white',
            }}
          />

          {/* Dot Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.5,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

// 🆕 Helper function to get property type icon and color
const getPropertyTypeInfo = (propertyType) => {
  const typeInfo = propertyTypeOptions.find(option => option.value === propertyType);
  return {
    icon: typeInfo?.icon || <HomeIcon />,
    label: typeInfo?.label || propertyType,
    color: propertyType === 'commercial' ? 'primary' : 'secondary'
  };
};

// Sortable Property Card Component using @dnd-kit
const SortablePropertyCard = ({ property, onEdit, onDelete, index, getAreaLabel }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 🆕 Get property type info
  const propertyTypeInfo = getPropertyTypeInfo(property.propertyType);

  // 🆕 UPDATED: Helper function to check if beds/baths should be shown
  const shouldShowBedsAndBaths = (property) => {
    return property.beds && property.beds > 0 && property.baths && property.baths > 0;
  };

  return (
    <Grid item xs={12} md={6} lg={4}>
      <Card
        ref={setNodeRef}
        style={style}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: isDragging ? '2px dashed #B8860B' : '1px solid #e0e0e0',
          boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {/* Order Number Badge */}
        <Chip
          label={`#${index + 1}`}
          size="small"
          color="primary"
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            zIndex: 1,
            backgroundColor: 'primary.main',
            color: 'white'
          }}
        />

        {/* 🆕 Property Type Badge */}
        <Chip
          icon={propertyTypeInfo.icon}
          label={propertyTypeInfo.label}
          size="small"
          color={propertyTypeInfo.color}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            zIndex: 1,
            fontWeight: 600
          }}
        />

        {/* Drag Handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            backgroundColor: 'primary.main',
            color: 'white',
            cursor: isDragging ? 'grabbing' : 'grab',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <DragIcon fontSize="small" />
          <Typography variant="caption" sx={{ ml: 1 }}>
            Drag to reorder
          </Typography>
        </Box>

        {/* Property Image Carousel */}
        <PropertyImageCarousel images={property.images} title={property.title} />

        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              {property.title}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => onEdit(property)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(property._id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="h5" color="primary" gutterBottom>
            {property.price}
          </Typography>

          <Box display="flex" alignItems="center" mb={1}>
            <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {property.location}
            </Typography>
          </Box>

          <Box display="flex" gap={1} mb={2}>
            <Chip
              label={getAreaLabel(property.areaKey)}
              size="small"
              color="secondary"
            />
            {/* 🆕 Property Type Chip */}
            <Chip
              icon={propertyTypeInfo.icon}
              label={propertyTypeInfo.label}
              size="small"
              color={propertyTypeInfo.color}
              variant="outlined"
            />
          </Box>

          {/* 🆕 UPDATED: Conditional display of beds/baths */}
          <Box display="flex" gap={2} mb={1} flexWrap="wrap">
            {shouldShowBedsAndBaths(property) && (
              <>
                <Box display="flex" alignItems="center">
                  <BedIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{property.beds} beds</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <BathtubIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2">{property.baths} baths</Typography>
                </Box>
              </>
            )}
            {property.area && (
              <Box display="flex" alignItems="center">
                <AreaIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{property.area}</Typography>
              </Box>
            )}
          </Box>

          {/* Property Links Status - 🆕 UPDATED: Only show if links exist */}
          {(property.links?.acres99 || property.links?.magicbricks) && (
            <Box display="flex" gap={1} mb={1}>
              {property.links?.acres99 && (
                <Chip 
                  label="99acres" 
                  size="small" 
                  color="success"
                  variant="filled"
                />
              )}
              {property.links?.magicbricks && (
                <Chip 
                  label="MagicBricks" 
                  size="small" 
                  color="success"
                  variant="filled"
                />
              )}
            </Box>
          )}

          {property.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {property.description.length > 100 
                ? `${property.description.substring(0, 100)}...`
                : property.description
              }
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

function Properties() {
  const [properties, setProperties] = useState([]);
  const [areas, setAreas] = useState({}); // 🆕 NEW: State for areas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    beds: '', // 🆕 UPDATED: Made optional (empty string by default)
    baths: '', // 🆕 UPDATED: Made optional (empty string by default)
    area: '',
    areaKey: '',
    propertyType: 'residential', // 🆕 NEW: Default to residential
    description: '',
    features: '',
    images: [],
    links: {
      acres99: '',
      magicbricks: '',
    },
  });

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  // 🆕 NEW: Load both properties and areas
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load areas and properties in parallel
      const [areasResponse, propertiesResponse] = await Promise.all([
        areaAPI.getAll().catch(err => {
          console.warn('⚠️ Error loading areas:', err);
          return { data: {} }; // Return empty object if areas fail to load
        }),
        propertyAPI.getAll().catch(err => {
          console.error('❌ Error loading properties:', err);
          return { data: [] }; // Return empty array if properties fail to load
        })
      ]);

      console.log('🏢 Areas loaded:', areasResponse.data);
      console.log('🏠 Properties loaded:', propertiesResponse.data);

      setAreas(areasResponse.data || {});
      setProperties(propertiesResponse.data || []);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyAPI.getAll();
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSavingOrder(true);
      
      // Update local state immediately for responsive UI
      const newProperties = arrayMove(
        properties,
        properties.findIndex((item) => item._id === active.id),
        properties.findIndex((item) => item._id === over.id)
      );
      
      setProperties(newProperties);
      
      console.log('🔄 Reordered properties locally');
      
      try {
        // Persist order to backend
        const propertyIds = newProperties.map(property => property._id);
        await propertyAPI.reorder(propertyIds);
        console.log('✅ Properties order saved to backend');
        setError(null);
      } catch (error) {
        console.error('❌ Error saving properties order:', error);
        setError('Failed to save properties order');
        // Reload data to revert changes on error
        loadProperties();
      } finally {
        setSavingOrder(false);
      }
    }
  };

  const handleOpenDialog = (property = null) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        title: property.title || '',
        price: property.price || '',
        location: property.location || '',
        beds: property.beds?.toString() || '', // 🆕 UPDATED: Optional - can be empty
        baths: property.baths?.toString() || '', // 🆕 UPDATED: Optional - can be empty
        area: property.area || '',
        areaKey: property.areaKey || '',
        propertyType: property.propertyType || 'residential', // 🆕 NEW
        description: property.description || '',
        features: Array.isArray(property.features) ? property.features.join(', ') : '',
        images: property.images || [],
        links: {
          acres99: property.links?.acres99 || '',
          magicbricks: property.links?.magicbricks || '',
        },
      });
    } else {
      setEditingProperty(null);
      setFormData({
        title: '',
        price: '',
        location: '',
        beds: '', // 🆕 UPDATED: Optional - empty by default
        baths: '', // 🆕 UPDATED: Optional - empty by default
        area: '',
        areaKey: '',
        propertyType: 'residential', // 🆕 NEW: Default to residential
        description: '',
        features: '',
        images: [],
        links: {
          acres99: '',
          magicbricks: '',
        },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProperty(null);
    setFormData({
      title: '',
      price: '',
      location: '',
      beds: '', // 🆕 UPDATED: Optional
      baths: '', // 🆕 UPDATED: Optional
      area: '',
      areaKey: '',
      propertyType: 'residential', // 🆕 NEW
      description: '',
      features: '',
      images: [],
      links: {
        acres99: '',
        magicbricks: '',
      },
    });
  };

  const handleInputChange = (field) => (event) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: event.target.value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value
      }));
    }
  };

  const handleImagesChange = (newImages) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSave = async () => {
    try {
      // 🆕 FIXED: Clean links before saving
      const cleanLinks = {};
      if (formData.links.acres99 && formData.links.acres99.trim()) {
        cleanLinks.acres99 = formData.links.acres99.trim();
      }
      if (formData.links.magicbricks && formData.links.magicbricks.trim()) {
        cleanLinks.magicbricks = formData.links.magicbricks.trim();
      }

      // 🆕 UPDATED: Handle optional beds/baths
      const propertyData = {
        ...formData,
        // Only include beds/baths if they have values
        ...(formData.beds && { beds: parseInt(formData.beds) || 0 }),
        ...(formData.baths && { baths: parseInt(formData.baths) || 0 }),
        features: formData.features 
          ? formData.features.split(',').map(f => f.trim()).filter(f => f)
          : [],
        // 🆕 UPDATED: Only include links if they have values
        ...(Object.keys(cleanLinks).length > 0 && { links: cleanLinks })
      };

      console.log('💾 Saving property with clean data:', propertyData);

      if (editingProperty) {
        await propertyAPI.update(editingProperty._id, propertyData);
      } else {
        await propertyAPI.create(propertyData);
      }

      handleCloseDialog();
      loadProperties();
    } catch (error) {
      console.error('Error saving property:', error);
      setError('Failed to save property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyAPI.delete(id);
        loadProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
        setError('Failed to delete property');
      }
    }
  };

  // 🆕 NEW: Helper function to get area label dynamically
  const getAreaLabel = (areaKey) => {
    const area = areas[areaKey];
    return area ? area.name : areaKey;
  };

  // 🆕 NEW: Generate area options from loaded areas
  const getAreaOptions = () => {
    return Object.entries(areas).map(([key, area]) => ({
      value: key,
      label: area.name
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Properties...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Properties Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your property listings • Drag properties to reorder
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add Property
        </Button>
      </Box>

      {/* Saving Order Feedback */}
      {savingOrder && (
        <Alert severity="info" sx={{ mb: 2 }}>
          💾 Saving new property order...
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Properties Grid with Drag & Drop */}
      {properties.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={properties.map(p => p._id)}
            strategy={verticalListSortingStrategy}
          >
            <Grid container spacing={3}>
              {properties.map((property, index) => (
                <SortablePropertyCard
                  key={property._id}
                  property={property}
                  index={index}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                  getAreaLabel={getAreaLabel}
                />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HomeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Properties Found
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={3}>
            Start by adding your first property listing
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Your First Property
          </Button>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProperty ? 'Edit Property' : 'Add New Property'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Property Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                value={formData.price}
                onChange={handleInputChange('price')}
                placeholder="e.g., ₹85 Lakhs"
                required
              />
            </Grid>
            {/* 🆕 NEW: Property Type Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={formData.propertyType}
                  onChange={handleInputChange('propertyType')}
                  label="Property Type"
                >
                  {propertyTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Area</InputLabel>
                <Select
                  value={formData.areaKey}
                  onChange={handleInputChange('areaKey')}
                  label="Area"
                >
                  {/* 🆕 UPDATED: Dynamic area options */}
                  {getAreaOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder="e.g., Sector 62, Central Noida"
                required
              />
            </Grid>
            {/* 🆕 UPDATED: Optional Bedrooms and Bathrooms */}
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Bedrooms (Optional)"
                type="number"
                value={formData.beds}
                onChange={handleInputChange('beds')}
                helperText="Leave empty for commercial properties"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Bathrooms (Optional)"
                type="number"
                value={formData.baths}
                onChange={handleInputChange('baths')}
                helperText="Leave empty for commercial properties"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Area Size"
                value={formData.area}
                onChange={handleInputChange('area')}
                placeholder="e.g., 1250 sq ft"
                required
              />
            </Grid>

            {/* 🆕 UPDATED: Optional Property Links */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="99acres Link (Optional)"
                value={formData.links.acres99}
                onChange={handleInputChange('links.acres99')}
                placeholder="https://99acres.com/property-link"
                helperText="Optional: Link to 99acres listing"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MagicBricks Link (Optional)"
                value={formData.links.magicbricks}
                onChange={handleInputChange('links.magicbricks')}
                placeholder="https://magicbricks.com/property-link"
                helperText="Optional: Link to MagicBricks listing"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Brief description of the property..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                value={formData.features}
                onChange={handleInputChange('features')}
                placeholder="e.g., Parking, Security, Gym, Garden (comma separated)"
                helperText="Enter features separated by commas"
              />
            </Grid>
            <Grid item xs={12}>
              <ImageUpload
                images={formData.images}
                onImagesChange={handleImagesChange}
                maxImages={10}
                label="Property Images"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={
              !formData.title || 
              !formData.price || 
              !formData.location || 
              !formData.areaKey ||
              !formData.propertyType
              // 🆕 REMOVED: beds and baths are no longer required
              // 🆕 REMOVED: Links are no longer required
            }
          >
            {editingProperty ? 'Update' : 'Add'} Property
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Add Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

export default Properties;