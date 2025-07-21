// backend/routes/societies.js - Enhanced with separated map and gallery image support
const express = require('express');
const router = express.Router();
const Area = require('../models/Area');

// GET /api/societies/:areaKey/:subAreaId - Get societies with separated image data
router.get('/:areaKey/:subAreaId', async (req, res) => {
  try {
    const { areaKey, subAreaId } = req.params;
    
    console.log(`🏘️ Fetching societies with separated images for area: ${areaKey}, sub-area: ${subAreaId}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    // Sort societies by order and enhance with separated image metadata
    const societies = (subArea.societies || [])
      .sort((a, b) => a.order - b.order)
      .map(society => {
        const societyObj = society.toObject();
        return {
          ...societyObj,
          // Gallery images metadata
          galleryImageCount: society.images ? society.images.length : 0,
          hasGallery: society.images && society.images.length > 0,
          primaryGalleryImage: society.images && society.images.length > 0 
            ? society.images[society.featuredImageIndex || 0] 
            : null,
          
          // Map image metadata
          hasMapImage: !!society.mapImage,
          mapImage: society.mapImage || null,
          
          // Combined metadata for backwards compatibility
          totalImages: (society.images?.length || 0) + (society.mapImage ? 1 : 0),
          primaryDisplayImage: society.images && society.images.length > 0 
            ? society.images[society.featuredImageIndex || 0] 
            : society.mapImage
        };
      });
    
    // 🔧 FIXED: Get ONLY map images for slider (not gallery images)
    const mapSliderImages = [];
    societies.forEach(society => {
      if (society.mapImage) {
        mapSliderImages.push({
          imageUrl: society.mapImage,
          societyName: society.name,
          societyId: society.id,
          type: 'map',
          description: `${society.name} - Location Map`
        });
      }
    });
    
    // 🆕 NEW: Get gallery images separately (for potential future use)
    const galleryImages = [];
    societies.forEach(society => {
      if (society.images && society.images.length > 0) {
        society.images.forEach((image, index) => {
          galleryImages.push({
            imageUrl: image,
            societyName: society.name,
            societyId: society.id,
            imageIndex: index,
            type: 'gallery',
            description: `${society.name} - Gallery Image ${index + 1}`
          });
        });
      }
    });
    
    // Statistics
    const stats = {
      totalSocieties: societies.length,
      societiesWithMaps: societies.filter(s => s.hasMapImage).length,
      societiesWithGallery: societies.filter(s => s.hasGallery).length,
      totalMapImages: mapSliderImages.length,
      totalGalleryImages: galleryImages.length
    };
    
    console.log('📊 Societies image statistics:', stats);
    
    res.json({
      success: true,
      data: {
        areaName: area.name,
        subAreaName: subArea.title,
        subAreaDescription: subArea.description,
        societies: societies,
        
        // 🔧 FIXED: Provide separated image arrays
        mapSliderImages: mapSliderImages, // For the map slider
        galleryImages: galleryImages, // For potential gallery features
        
        // Statistics
        statistics: stats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching societies with separated images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching societies',
      error: error.message
    });
  }
});

// 🆕 NEW: GET /api/societies/:areaKey/:subAreaId/maps - Get only map images for slider
router.get('/:areaKey/:subAreaId/maps', async (req, res) => {
  try {
    const { areaKey, subAreaId } = req.params;
    
    console.log(`🗺️ Fetching map images only for slider: ${areaKey}/${subAreaId}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    // Get only map images
    const mapImages = [];
    subArea.societies.forEach(society => {
      if (society.mapImage) {
        mapImages.push({
          imageUrl: society.mapImage,
          societyName: society.name,
          societyId: society.id,
          type: 'map',
          description: `${society.name} - Location Map`,
          society: {
            id: society.id,
            name: society.name,
            description: society.description
          }
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        images: mapImages,
        totalCount: mapImages.length,
        areaName: area.name,
        subAreaName: subArea.title,
        type: 'maps'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching map images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching map images',
      error: error.message
    });
  }
});

// 🆕 NEW: GET /api/societies/:areaKey/:subAreaId/gallery - Get only gallery images
router.get('/:areaKey/:subAreaId/gallery', async (req, res) => {
  try {
    const { areaKey, subAreaId } = req.params;
    
    console.log(`🖼️ Fetching gallery images only: ${areaKey}/${subAreaId}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    // Get only gallery images
    const galleryImages = [];
    subArea.societies.forEach(society => {
      if (society.images && society.images.length > 0) {
        society.images.forEach((image, index) => {
          galleryImages.push({
            imageUrl: image,
            societyName: society.name,
            societyId: society.id,
            imageIndex: index,
            type: 'gallery',
            description: `${society.name} - Gallery Image ${index + 1}`,
            society: {
              id: society.id,
              name: society.name,
              description: society.description
            }
          });
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        images: galleryImages,
        totalCount: galleryImages.length,
        areaName: area.name,
        subAreaName: subArea.title,
        type: 'gallery'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery images',
      error: error.message
    });
  }
});

// GET /api/societies/:areaKey/:subAreaId/:societyId - Get individual society details
router.get('/:areaKey/:subAreaId/:societyId', async (req, res) => {
  try {
    const { areaKey, subAreaId, societyId } = req.params;
    
    console.log(`🏘️ Fetching society details: ${areaKey}/${subAreaId}/${societyId}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    const society = subArea.societies.find(s => s.id === parseInt(societyId));
    
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }
    
    // Enhanced society data with separated image information
    const enhancedSociety = {
      ...society.toObject(),
      
      // Gallery image metadata
      galleryImageCount: society.images ? society.images.length : 0,
      hasGallery: society.images && society.images.length > 0,
      primaryGalleryImage: society.images && society.images.length > 0 
        ? society.images[society.featuredImageIndex || 0] 
        : null,
      galleryImages: society.images || [],
      
      // Map image metadata
      hasMapImage: !!society.mapImage,
      mapImage: society.mapImage || null,
      
      // Combined for modal display (gallery images first, then map)
      allImages: [
        ...(society.images || []),
        ...(society.mapImage ? [society.mapImage] : [])
      ],
      
      // Context information
      parentArea: {
        key: area.key,
        name: area.name
      },
      parentSubArea: {
        id: subArea.id,
        name: subArea.title
      }
    };
    
    res.json({
      success: true,
      data: enhancedSociety
    });
  } catch (error) {
    console.error('❌ Error fetching society details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching society details',
      error: error.message
    });
  }
});

// PUT /api/societies/:areaKey/:subAreaId/reorder - Reorder societies
router.put('/:areaKey/:subAreaId/reorder', async (req, res) => {
  try {
    const { areaKey, subAreaId } = req.params;
    const { societies } = req.body;
    
    console.log(`🔄 Reordering societies for area: ${areaKey}, sub-area: ${subAreaId}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subAreaIndex = area.subAreas.findIndex(sa => sa.id === parseInt(subAreaId));
    
    if (subAreaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    // Update societies with new order
    const updatedSocieties = societies.map((society, index) => ({
      ...society,
      order: index
    }));
    
    area.subAreas[subAreaIndex].societies = updatedSocieties;
    await area.save();
    
    console.log('✅ Societies reordered successfully');
    
    res.json({
      success: true,
      message: 'Societies reordered successfully'
    });
  } catch (error) {
    console.error('❌ Error reordering societies:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering societies',
      error: error.message
    });
  }
});

// PUT /api/societies/:areaKey/:subAreaId/:societyId/featured-image - Set featured gallery image
router.put('/:areaKey/:subAreaId/:societyId/featured-image', async (req, res) => {
  try {
    const { areaKey, subAreaId, societyId } = req.params;
    const { imageIndex } = req.body;
    
    console.log(`🖼️ Setting featured gallery image for society: ${societyId}, image index: ${imageIndex}`);
    
    const area = await Area.findOne({ key: areaKey });
    
    if (!area) {
      return res.status(404).json({
        success: false,
        message: 'Area not found'
      });
    }
    
    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    
    if (!subArea) {
      return res.status(404).json({
        success: false,
        message: 'Sub-area not found'
      });
    }
    
    const society = subArea.societies.find(s => s.id === parseInt(societyId));
    
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }
    
    // Validate image index for gallery images only
    if (imageIndex < 0 || imageIndex >= (society.images?.length || 0)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gallery image index'
      });
    }
    
    society.featuredImageIndex = imageIndex;
    await area.save();
    
    console.log('✅ Featured gallery image updated successfully');
    
    res.json({
      success: true,
      message: 'Featured gallery image updated successfully',
      data: {
        featuredImageIndex: imageIndex,
        featuredImage: society.images[imageIndex]
      }
    });
  } catch (error) {
    console.error('❌ Error setting featured gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting featured image',
      error: error.message
    });
  }
});

module.exports = router;