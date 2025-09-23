import imageCompression from "browser-image-compression";

// Thumbnail configuration
export const THUMBNAIL_CONFIG = {
  IMAGE: {
    maxWidth: 150,
    maxHeight: 150,
    quality: 0.8,
    format: "image/webp" as const,
    maxSizeMB: 0.05, // 50KB max
  },
  VIDEO: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: "image/webp" as const,
    maxSizeMB: 0.04, // 40KB max
  },
};

// Generate thumbnail for image
export const generateImageThumbnail = async (file: File): Promise<File> => {
  try {
    const options = {
      maxSizeMB: THUMBNAIL_CONFIG.IMAGE.maxSizeMB,
      maxWidthOrHeight: Math.max(
        THUMBNAIL_CONFIG.IMAGE.maxWidth,
        THUMBNAIL_CONFIG.IMAGE.maxHeight
      ),
      useWebWorker: true,
      fileType: THUMBNAIL_CONFIG.IMAGE.format,
      initialQuality: THUMBNAIL_CONFIG.IMAGE.quality,
    };

    const thumbnail = await imageCompression(file, options);

    // Create thumbnail filename
    const originalName = file.name.split(".")[0];
    const thumbnailName = `${originalName}-thumb.webp`;

    return new File([thumbnail], thumbnailName, {
      type: THUMBNAIL_CONFIG.IMAGE.format,
    });
  } catch (error) {
    console.error("Failed to generate image thumbnail:", error);
    throw new Error("Failed to generate image thumbnail");
  }
};

// Generate thumbnail for video (first frame)
export const generateVideoThumbnail = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    video.onloadedmetadata = () => {
      // Set canvas dimensions
      const maxSize = Math.max(
        THUMBNAIL_CONFIG.VIDEO.maxWidth,
        THUMBNAIL_CONFIG.VIDEO.maxHeight
      );
      const aspectRatio = video.videoWidth / video.videoHeight;

      if (aspectRatio > 1) {
        canvas.width = maxSize;
        canvas.height = maxSize / aspectRatio;
      } else {
        canvas.height = maxSize;
        canvas.width = maxSize * aspectRatio;
      }

      // Seek to first frame
      video.currentTime = 0.1; // Small offset to ensure frame is loaded
    };

    video.onseeked = () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate video thumbnail"));
              return;
            }

            // Create thumbnail filename
            const originalName = file.name.split(".")[0];
            const thumbnailName = `${originalName}-thumb.webp`;

            const thumbnailFile = new File([blob], thumbnailName, {
              type: THUMBNAIL_CONFIG.VIDEO.format,
            });

            // Clean up
            URL.revokeObjectURL(video.src);
            resolve(thumbnailFile);
          },
          THUMBNAIL_CONFIG.VIDEO.format,
          THUMBNAIL_CONFIG.VIDEO.quality
        );
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video for thumbnail generation"));
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

// Generate thumbnail for any media file
export const generateThumbnail = async (file: File): Promise<File> => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (isImage) {
    return await generateImageThumbnail(file);
  } else if (isVideo) {
    return await generateVideoThumbnail(file);
  } else {
    throw new Error("Unsupported file type for thumbnail generation");
  }
};

// Get thumbnail URL from original URL
export const getThumbnailUrl = (originalUrl: string): string => {
  if (!originalUrl) return "";

  // Extract filename and extension
  const urlParts = originalUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const nameWithoutExt = filename.split(".")[0];

  // Replace with thumbnail filename
  const thumbnailFilename = `${nameWithoutExt}-thumb.webp`;
  urlParts[urlParts.length - 1] = thumbnailFilename;

  return urlParts.join("/");
};

// Check if thumbnail exists
export const checkThumbnailExists = async (
  thumbnailUrl: string
): Promise<boolean> => {
  try {
    const response = await fetch(thumbnailUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Fallback placeholder image
export const getPlaceholderImage = (
  type: "image" | "video" = "image"
): string => {
  if (type === "video") {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjMwIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik02MCA5MEw5MCA3NUw2MCA2MFY5MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";
  }

  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA5MEw5MCA3NUw2MCA2MFY5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==";
};

// Utility to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Media type detection
export const getMediaType = (url: string): "image" | "video" | "unknown" => {
  if (!url) return "unknown";

  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  const lowerUrl = url.toLowerCase();

  if (videoExtensions.some((ext) => lowerUrl.includes(ext))) {
    return "video";
  } else if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
    return "image";
  }

  return "unknown";
};

// Thumbnail size estimation
export const estimateThumbnailSize = (
  originalSize: number,
  type: "image" | "video"
): number => {
  // Rough estimation based on compression ratios
  if (type === "image") {
    return Math.min(originalSize * 0.05, 50 * 1024); // ~5% of original, max 50KB
  } else {
    return Math.min(originalSize * 0.02, 40 * 1024); // ~2% of original, max 40KB
  }
};
