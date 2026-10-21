import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardMedia,
  GridLegacy as Grid,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import { uploadAPI } from '../../services/api';
import { fileKey, formatBytes, MAX_SOURCE_BYTES } from '../../services/imageUploader';
import { IMAGE_ACCEPT, isSupportedImage } from '../../utils/imageFormats';
import { getImageUrl, getThumbnailUrl, handleImageError } from '../../utils/imageUtils';

function ImageUpload({
  images = [],
  onImagesChange,
  maxImages = 10,
  label = "Property Images"
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [problems, setProblems] = useState([]);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);
  // The latest list, so photos that finish one after another are each added to the right list.
  const imagesRef = useRef(images);
  const mounted = useRef(true);
  const busy = useRef(false);
  imagesRef.current = images;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const handleFileSelect = (event) => {
    const chosen = Array.from(event.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (chosen.length === 0 || busy.current) return;

    const notes = [];
    const seen = new Set();
    const accepted = [];
    for (const file of chosen) {
      const key = fileKey(file);
      if (seen.has(key)) continue;
      seen.add(key);
      if (!isSupportedImage(file)) notes.push(`${file.name} is not an image type we can use.`);
      else if (file.size > MAX_SOURCE_BYTES) notes.push(`${file.name} is ${formatBytes(file.size)}; the largest photo accepted is ${formatBytes(MAX_SOURCE_BYTES)}.`);
      else accepted.push(file);
    }
    const room = Math.max(0, maxImages - imagesRef.current.length);
    if (accepted.length > room) notes.push(`Only ${room} more ${room === 1 ? 'photo fits' : 'photos fit'} (maximum ${maxImages}); the rest were skipped.`);
    setProblems(notes);
    if (room > 0 && accepted.length > 0) uploadFiles(accepted.slice(0, room));
  };

  const uploadFiles = async (files) => {
    busy.current = true;
    setUploading(true);
    setUploadProgress(0);
    setStatus(`Uploading ${files.length} ${files.length === 1 ? 'photo' : 'photos'}…`);
    let finished = 0;
    try {
      const results = await uploadAPI.uploadImages(files, {
        onProgress: (percent) => { if (mounted.current) setUploadProgress(percent); },
        onItem: (item) => {
          finished++;
          if (!mounted.current) return;
          if (item.status === 'done' && !imagesRef.current.includes(item.imageUrl)) {
            const next = [...imagesRef.current, item.imageUrl].slice(0, maxImages);
            imagesRef.current = next;
            onImagesChange(next);
          }
          setStatus(`Uploaded ${finished} of ${files.length}…`);
        },
      });
      if (!mounted.current) return;
      const failed = results.filter(result => result.status === 'failed');
      setProblems(previous => [...previous, ...failed.map(result => `${result.file.name}: ${result.error}`)]);
      setStatus(failed.length ? `${results.length - failed.length} of ${results.length} uploaded. Add the rest again to retry.` : '');
    } finally {
      busy.current = false;
      if (mounted.current) {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(updatedImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>

      {problems.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProblems([])}>
          {problems.map((problem) => <div key={problem}>{problem}</div>)}
        </Alert>
      )}

      {/* Upload Button */}
      <Box mb={2}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={IMAGE_ACCEPT}
          multiple
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          onClick={handleButtonClick}
          startIcon={<UploadIcon />}
          disabled={uploading || images.length >= maxImages}
          fullWidth
          sx={{ mb: 1 }}
        >
          {uploading ? 'Uploading...' : `Upload Images (${images.length}/${maxImages})`}
        </Button>

        {(uploading || status) && (
          <Box role="status">
            {uploading && <LinearProgress variant="determinate" value={uploadProgress} />}
            <Typography variant="caption" color="textSecondary">
              {status}{uploading ? ` ${uploadProgress}%` : ''}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Image Preview Grid */}
      {images.length > 0 ? (
        <Grid container spacing={2}>
          {images.map((imageUrl, index) => (
            <Grid item xs={6} sm={4} md={3} key={`${index}-${imageUrl}`}>
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img" loading="lazy" decoding="async"
                  height="120"
                  image={getThumbnailUrl(imageUrl)}
                  alt={`Property image ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => {
                    // Fall back to the original once, then to the placeholder.
                    if (e.target.dataset.original !== 'tried') { e.target.dataset.original = 'tried'; e.target.src = getImageUrl(imageUrl); return; }
                    handleImageError(e, imageUrl);
                  }}
                />
                <IconButton
                  size="small"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => handleRemoveImage(index)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}>
                  Original: {imageUrl}
                </Typography>
              )}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            border: '2px dashed #476252',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="textSecondary" gutterBottom>
            No images uploaded yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Click "Upload Images" to add property photos
          </Typography>
        </Box>
      )}

      {/* File format info */}
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Any photo type works: JPG, PNG, HEIC/HEIF, WebP, AVIF, GIF, TIFF, BMP and more, up to {formatBytes(MAX_SOURCE_BYTES)} each (large photos are resized automatically). Max {maxImages} images.
      </Typography>
    </Box>
  );
}

export default ImageUpload;
