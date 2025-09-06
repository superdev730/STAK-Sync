/**
 * Compresses an image file to reduce size while maintaining quality
 */
export const compressImage = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Create object URL and load image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
  });
};

/**
 * Checks if a file is an image and validates size
 */
export const validateImageFile = (file: File, maxSizeBytes = 50 * 1024 * 1024): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select an image file' };
  }
  
  // Check file size (50MB limit)
  if (file.size > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    return { isValid: false, error: `Image size must be less than ${maxSizeMB}MB` };
  }
  
  return { isValid: true };
};

/**
 * Handles image upload with automatic compression
 */
export const handleImageUpload = async (
  file: File, 
  onSuccess: (compressedImage: string) => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      onError(validation.error!);
      return;
    }
    
    // Compress image
    const compressedImage = await compressImage(file);
    onSuccess(compressedImage);
    
  } catch (error) {
    console.error('Image upload error:', error);
    onError('Failed to process image. Please try a different photo.');
  }
};