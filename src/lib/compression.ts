/**
 * Media Compression Utilities
 * Provides robust compression for images and videos to reduce storage costs
 */

// Image compression settings
const IMAGE_COMPRESSION_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8, // 80% quality
  format: 'image/webp' // WebP provides better compression than JPEG
};

// Video compression settings
const VIDEO_COMPRESSION_OPTIONS = {
  maxWidth: 1280,
  maxHeight: 720,
  videoBitrate: '1000k', // 1 Mbps
  audioBitrate: '128k',
  fps: 30,
  format: 'mp4'
};

/**
 * Compresses an image file using Canvas API
 * @param file - Original image file
 * @returns Promise<{compressedFile: File, originalSize: number, compressedSize: number, compressionRatio: number}>
 */
export const compressImage = async (file: File): Promise<{
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxWidth = IMAGE_COMPRESSION_OPTIONS.maxWidth;
      const maxHeight = IMAGE_COMPRESSION_OPTIONS.maxHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }

          const originalSize = file.size;
          const compressedSize = blob.size;
          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.webp'),
            { type: IMAGE_COMPRESSION_OPTIONS.format }
          );

          resolve({
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio
          });
        },
        IMAGE_COMPRESSION_OPTIONS.format,
        IMAGE_COMPRESSION_OPTIONS.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compresses a video file using FFmpeg
 * @param file - Original video file
 * @returns Promise<{compressedFile: File, originalSize: number, compressedSize: number, compressionRatio: number}>
 */
export const compressVideo = async (file: File): Promise<{
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> => {
  // Dynamic import to avoid loading FFmpeg unless needed
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();
  
  // Load FFmpeg
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  const inputFileName = 'input.mp4';
  const outputFileName = 'output.mp4';

  // Write input file to FFmpeg filesystem
  await ffmpeg.writeFile(inputFileName, await fetchFile(file));

  // Compress video with optimized settings
  await ffmpeg.exec([
    '-i', inputFileName,
    '-vcodec', 'libx264',
    '-acodec', 'aac',
    '-b:v', VIDEO_COMPRESSION_OPTIONS.videoBitrate,
    '-b:a', VIDEO_COMPRESSION_OPTIONS.audioBitrate,
    '-vf', `scale='min(${VIDEO_COMPRESSION_OPTIONS.maxWidth},iw)':'min(${VIDEO_COMPRESSION_OPTIONS.maxHeight},ih)':force_original_aspect_ratio=decrease`,
    '-r', VIDEO_COMPRESSION_OPTIONS.fps.toString(),
    '-preset', 'fast',
    '-crf', '28', // Constant Rate Factor for good quality/size balance
    outputFileName
  ]);

  // Read compressed video
  const compressedData = await ffmpeg.readFile(outputFileName);
  
  const originalSize = file.size;
  const compressedSize = (compressedData as Uint8Array).length;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

  const compressedFile = new File(
    [compressedData],
    file.name.replace(/\.[^/.]+$/, '.mp4'),
    { type: 'video/mp4' }
  );

  return {
    compressedFile,
    originalSize,
    compressedSize,
    compressionRatio
  };
};

/**
 * Determines if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Determines if a file is a video
 */
export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

/**
 * Formats file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Compresses media file (image or video) based on file type
 */
export const compressMediaFile = async (file: File): Promise<{
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  fileType: 'image' | 'video';
}> => {
  if (isImageFile(file)) {
    const result = await compressImage(file);
    return { ...result, fileType: 'image' };
  } else if (isVideoFile(file)) {
    const result = await compressVideo(file);
    return { ...result, fileType: 'video' };
  } else {
    throw new Error('Unsupported file type. Only images and videos are supported.');
  }
};