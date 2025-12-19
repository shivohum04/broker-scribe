import { supabase } from "@/integrations/supabase/client";
import { MediaItem } from "@/types/property";
import { propertyService } from "../properties/property.service";
import { localVideoStorage } from "@/lib/media-local";
import { retryWithBackoff } from "@/lib/upload-utils";
import { uploadMediaFile } from "@/lib/unified-media-utils";

/**
 * Media service - handles media operations for properties
 */
export const mediaService = {
  /**
   * Get property with full media data
   * This is essentially the same as getPropertyById but ensures media is loaded
   */
  async getPropertyWithMedia(propertyId: string) {
    return propertyService.getPropertyById(propertyId);
  },

  /**
   * Add media items to a property
   */
  async addMediaToProperty(
    propertyId: string,
    mediaItems: MediaItem[]
  ): Promise<void> {
    const property = await propertyService.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const currentMedia = property.media || [];
    const updatedMedia = [...currentMedia, ...mediaItems];

    await propertyService.updateProperty(propertyId, {
      media: updatedMedia,
    });
  },

  /**
   * Remove a media item from a property
   */
  async removeMediaFromProperty(
    propertyId: string,
    mediaId: string
  ): Promise<{
    success: boolean;
    newCoverThumbnailUrl?: string;
    error?: string;
  }> {
    try {
      const property = await propertyService.getPropertyById(propertyId);
      if (!property) {
        return { success: false, error: "Property not found" };
      }

      const currentMedia = property.media || [];
      const mediaToRemove = currentMedia.find((m) => m.id === mediaId);

      if (!mediaToRemove) {
        return { success: false, error: "Media not found" };
      }

      // Remove from array
      const updatedMedia = currentMedia.filter((m) => m.id !== mediaId);

      // Handle local video cleanup
      if (
        mediaToRemove.storageType === "local" &&
        mediaToRemove.localKey
      ) {
        await localVideoStorage.removeLocalVideo(mediaToRemove.localKey);
      }

      // Determine new cover thumbnail
      let newCoverThumbnailUrl = property.cover_thumbnail_url;
      const remainingImages = updatedMedia.filter((m) => m.type === "image");

      if (remainingImages.length > 0) {
        // Promote first remaining image to cover
        newCoverThumbnailUrl = remainingImages[0].thumbnailUrl || null;
      } else {
        // No images left, clear cover thumbnail
        newCoverThumbnailUrl = null;
      }

      // Update property
      await propertyService.updateProperty(propertyId, {
        media: updatedMedia,
        cover_thumbnail_url: newCoverThumbnailUrl,
      });

      return {
        success: true,
        newCoverThumbnailUrl: newCoverThumbnailUrl || undefined,
      };
    } catch (error) {
      console.error("Failed to remove media from property:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Upload files and add them to a property
   */
  async uploadAndAddMediaToProperty(
    propertyId: string,
    files: File[],
    userId: string,
    isFirstImage: boolean = false
  ): Promise<{ success: boolean; mediaItems: MediaItem[]; error?: string }> {
    try {
      const property = await propertyService.getPropertyById(propertyId);
      if (!property) {
        return {
          success: false,
          mediaItems: [],
          error: "Property not found",
        };
      }

      const currentMedia = property.media || [];
      const hasExistingImages = currentMedia.some((m) => m.type === "image");
      const newMediaItems: MediaItem[] = [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const shouldBeFirstImage =
          !hasExistingImages && file.type.startsWith("image/") && i === 0;

        const result = await uploadMediaFile(
          file,
          propertyId,
          userId,
          shouldBeFirstImage || isFirstImage
        );

        if (result.success && result.mediaItem) {
          newMediaItems.push(result.mediaItem);
        } else {
          console.error("Failed to upload file:", result.error);
        }
      }

      if (newMediaItems.length === 0) {
        return {
          success: false,
          mediaItems: [],
          error: "No files were uploaded successfully",
        };
      }

      // Add to property
      await this.addMediaToProperty(propertyId, newMediaItems);

      return {
        success: true,
        mediaItems: newMediaItems,
      };
    } catch (error) {
      console.error("Failed to upload and add media:", error);
      return {
        success: false,
        mediaItems: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};





