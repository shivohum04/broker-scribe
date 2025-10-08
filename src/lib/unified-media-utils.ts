import { MediaItem } from "@/types/property";
import { localVideoStorage } from "./media-local";
import { propertyService } from "./supabase";
import { generateThumbnail } from "./thumbnail-utils";
import { formatFileSize } from "./upload-utils";

/**
 * Unified media utilities for handling both images and videos
 */

export interface MediaUploadResult {
  success: boolean;
  mediaItem?: MediaItem;
  mediaItems?: MediaItem[]; // For split videos
  error?: string;
}

/**
 * Upload a single media file and return a MediaItem
 */
export const uploadMediaFile = async (
  file: File,
  propertyId: string,
  userId: string,
  isFirstImage: boolean = false
): Promise<MediaUploadResult> => {
  try {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return {
        success: false,
        error: "Unsupported file type. Only images and videos are allowed.",
      };
    }

    const mediaId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadedAt = new Date().toISOString();

    if (isImage) {
      // Handle image upload
      try {
        // Compress and upload image
        const { url } = await propertyService.uploadCompressedImage(
          file,
          userId
        );

        let thumbnailUrl: string | undefined;

        // Generate thumbnail only for the first image (cover)
        if (isFirstImage) {
          try {
            thumbnailUrl = await propertyService.uploadCoverThumbnail(
              file,
              userId
            );
          } catch (thumbnailError) {
            console.warn("Cover thumbnail generation failed:", thumbnailError);
          }
        }

        const mediaItem: MediaItem = {
          id: mediaId,
          type: "image",
          storageType: "cloud",
          url,
          thumbnailUrl,
          isCover: isFirstImage,
          uploadedAt,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };

        return {
          success: true,
          mediaItem,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Image upload failed",
        };
      }
    } else {
      // Handle video upload to cloud storage (no compression)
      try {
        console.log(
          "🎬 [VIDEO UPLOAD] Uploading video directly without compression:",
          {
            name: file.name,
            size: formatFileSize(file.size),
          }
        );

        // Upload video directly to cloud storage
        const { url } = await propertyService.uploadCompressedVideo(
          file,
          userId
        );

        const mediaItem: MediaItem = {
          id: mediaId,
          type: "video",
          storageType: "cloud",
          url: url,
          isCover: false, // Videos are never cover images
          uploadedAt,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        };

        return {
          success: true,
          mediaItem,
        };
      } catch (error) {
        console.error("Video upload failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Video upload failed",
        };
      }
    }
  } catch (error) {
    console.error("Media upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Media upload failed",
    };
  }
};

/**
 * Get the cover image from a media array
 */
export const getCoverImage = (media: MediaItem[]): MediaItem | null => {
  // First, try to find an image marked as cover
  const coverImage = media.find(
    (item) => item.type === "image" && item.isCover
  );
  if (coverImage) return coverImage;

  // If no cover image, find the first image
  const firstImage = media.find((item) => item.type === "image");
  if (firstImage) return firstImage;

  // If no images, return null (will use placeholder)
  return null;
};

/**
 * Get the cover thumbnail URL for display
 */
export const getCoverThumbnailUrl = (media: MediaItem[]): string | null => {
  const coverImage = getCoverImage(media);
  if (coverImage && coverImage.thumbnailUrl) {
    return coverImage.thumbnailUrl;
  }
  return null;
};

/**
 * Get all media URLs for the media viewer
 */
export const getMediaUrls = async (media: MediaItem[]): Promise<string[]> => {
  const urls: string[] = [];

  for (const item of media) {
    if (item.type === "image" && item.url) {
      urls.push(item.url);
    } else if (item.type === "video") {
      if (item.storageType === "cloud" && item.url) {
        // Cloud video - use URL directly
        urls.push(item.url);
      } else if (item.storageType === "local" && item.localKey) {
        // Local video - try to get from local storage (legacy support)
        try {
          const videoUrl = await localVideoStorage.getLocalVideoUrl(
            item.localKey
          );
          if (videoUrl) {
            urls.push(videoUrl);
          }
        } catch (error) {
          console.warn(`Failed to get video URL for ${item.localKey}:`, error);
        }
      }
    }
  }

  return urls;
};

/**
 * Check if a property has any images
 */
export const hasImages = (media: MediaItem[]): boolean => {
  return media.some((item) => item.type === "image");
};

/**
 * Check if a property has any videos
 */
export const hasVideos = (media: MediaItem[]): boolean => {
  return media.some((item) => item.type === "video");
};

/**
 * Get media count by type
 */
export const getMediaCounts = (
  media: MediaItem[]
): { images: number; videos: number; total: number } => {
  const images = media.filter((item) => item.type === "image").length;
  const videos = media.filter((item) => item.type === "video").length;
  return { images, videos, total: media.length };
};

/**
 * Create a placeholder for video-only properties
 */
export const getVideoPlaceholder = (): string => {
  return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iNzUiIHI9IjMwIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik02MCA5MEw5MCA3NUw2MCA2MFY5MFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";
};

/**
 * Update cover image selection
 */
export const updateCoverImage = (
  media: MediaItem[],
  newCoverId: string
): MediaItem[] => {
  return media.map((item) => ({
    ...item,
    isCover: item.id === newCoverId && item.type === "image",
  }));
};

/**
 * Remove media item and update cover if needed
 */
export const removeMediaItem = (
  media: MediaItem[],
  itemId: string
): MediaItem[] => {
  const updatedMedia = media.filter((item) => item.id !== itemId);

  // If we removed the cover image, promote the first remaining image to cover
  const hasCover = updatedMedia.some((item) => item.isCover);
  if (!hasCover) {
    const firstImage = updatedMedia.find((item) => item.type === "image");
    if (firstImage) {
      firstImage.isCover = true;
    }
  }

  return updatedMedia;
};
