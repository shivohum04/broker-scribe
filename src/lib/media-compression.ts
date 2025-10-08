import imageCompression from "browser-image-compression";

// Compression configuration
export const COMPRESSION_CONFIG = {
  IMAGE: {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.75, // 75% quality
    format: "image/webp" as const,
    maxSizeMB: 0.15, // 150KB max
  },
  VIDEO: {
    maxDuration: 180, // 3 minutes in seconds
    maxWidth: 854, // 480p width
    maxHeight: 480, // 480p height
    bitrate: 500, // 500 kbps
    format: "video/mp4" as const,
    maxSizeMB: 3, // 3MB max
  },
};

// Image compression
export const compressImage = async (file: File): Promise<File> => {
  try {
    console.log(
      `Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB)`
    );

    const options = {
      maxSizeMB: COMPRESSION_CONFIG.IMAGE.maxSizeMB,
      maxWidthOrHeight: COMPRESSION_CONFIG.IMAGE.maxWidth,
      useWebWorker: true,
      fileType: COMPRESSION_CONFIG.IMAGE.format,
      initialQuality: COMPRESSION_CONFIG.IMAGE.quality,
    };

    const compressedFile = await imageCompression(file, options);

    console.log(
      `Image compressed: ${compressedFile.name} (${(
        compressedFile.size / 1024
      ).toFixed(2)} KB)`
    );

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    throw new Error("Failed to compress image");
  }
};

// Video compression using FFmpeg.wasm
export const compressVideo = async (file: File): Promise<File> => {
  try {
    console.log(
      `Compressing video: ${file.name} (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB)`
    );

    // For now, we'll use a simple approach
    // In production, you might want to use FFmpeg.wasm for better video compression
    // This is a placeholder implementation

    // Check video duration
    const duration = await getVideoDuration(file);
    if (duration > COMPRESSION_CONFIG.VIDEO.maxDuration) {
      throw new Error(
        `Video too long: ${duration}s (max: ${COMPRESSION_CONFIG.VIDEO.maxDuration}s)`
      );
    }

    // For now, return the original file
    // TODO: Implement proper video compression with FFmpeg.wasm
    console.log(`Video compression placeholder: ${file.name}`);
    return file;
  } catch (error) {
    console.error("Video compression failed:", error);
    throw new Error("Failed to compress video");
  }
};

// Get video duration
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Generate thumbnail for cover image only
export const generateCoverThumbnail = async (file: File): Promise<File> => {
  try {
    console.log(`Generating cover thumbnail: ${file.name}`);

    const options = {
      maxSizeMB: 0.05, // 50KB max for thumbnails
      maxWidthOrHeight: 150,
      useWebWorker: true,
      fileType: "image/webp" as const,
      initialQuality: 0.8,
    };

    const thumbnail = await imageCompression(file, options);

    // Create thumbnail filename
    const originalName = file.name.split(".")[0];
    const thumbnailName = `${originalName}-cover-thumb.webp`;

    return new File([thumbnail], thumbnailName, {
      type: "image/webp",
    });
  } catch (error) {
    console.error("Cover thumbnail generation failed:", error);
    throw new Error("Failed to generate cover thumbnail");
  }
};

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/avi",
  "video/mov",
  "video/wmv",
  "video/webm",
  "video/mkv",
];

// Validate file before compression
export const validateMediaFile = (
  file: File
): { valid: boolean; error?: string } => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error:
        "Unsupported file type. Please upload images (JPEG, PNG, WebP, GIF, BMP) or videos (MP4, AVI, MOV, WMV, WebM, MKV).",
    };
  }

  // Videos: always allow (stored locally, no validation constraints)
  if (isVideo) {
    return { valid: true };
  }

  // For images only, enforce format constraints
  if (isImage && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Unsupported image format. Please use JPEG, PNG, WebP, GIF, or BMP.",
    };
  }

  if (isImage) {
    const maxSize = 10 * 1024 * 1024; // 10MB max for images before compression
    if (file.size > maxSize) {
      return { valid: false, error: "Image too large. Maximum 10MB allowed." };
    }
  }

  // No size checks for videos

  return { valid: true };
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Estimate compression ratio
export const estimateCompressionRatio = (
  originalSize: number,
  type: "image" | "video"
): number => {
  if (type === "image") {
    // Images typically compress to 5-10% of original size
    return Math.min(
      originalSize * 0.08,
      COMPRESSION_CONFIG.IMAGE.maxSizeMB * 1024 * 1024
    );
  } else {
    // Videos typically compress to 10-20% of original size
    return Math.min(
      originalSize * 0.15,
      COMPRESSION_CONFIG.VIDEO.maxSizeMB * 1024 * 1024
    );
  }
};
