import { Property } from "@/types/property";

/**
 * Utility functions to handle backward compatibility between old and new property systems
 */

// Check if a property is using the new system (has cover_thumbnail_url)
export const isNewPropertySystem = (property: Property): boolean => {
  return (
    property.cover_thumbnail_url !== undefined &&
    property.cover_thumbnail_url !== ""
  );
};

// Check if a property is using the old system (no cover_thumbnail_url)
export const isOldPropertySystem = (property: Property): boolean => {
  return !isNewPropertySystem(property);
};

// Get the effective thumbnail URL for a property (handles both old and new systems)
export const getEffectiveThumbnailUrl = (property: Property): string => {
  // For new system, use cover_thumbnail_url
  if (isNewPropertySystem(property)) {
    return property.cover_thumbnail_url || "";
  }

  // For old system, generate thumbnail URL from first image
  if (property.images && property.images.length > 0) {
    return getThumbnailUrlFromImageUrl(property.images[0]);
  }

  return "";
};

// Generate thumbnail URL from image URL (for backward compatibility)
export const getThumbnailUrlFromImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return "";

  // Extract filename and extension
  const urlParts = imageUrl.split("/");
  const filename = urlParts[urlParts.length - 1];
  const nameWithoutExt = filename.split(".")[0];

  // Replace with thumbnail filename
  const thumbnailFilename = `${nameWithoutExt}-cover-thumb.webp`;
  urlParts[urlParts.length - 1] = thumbnailFilename;

  return urlParts.join("/");
};

// Get the effective cover image URL for a property
export const getEffectiveCoverImageUrl = (property: Property): string => {
  if (property.images && property.images.length > 0) {
    return property.images[0];
  }
  return "";
};

// Check if a property has media
export const hasMedia = (property: Property): boolean => {
  return property.images && property.images.length > 0;
};

// Get media count for a property
export const getMediaCount = (property: Property): number => {
  return property.images ? property.images.length : 0;
};

// Get image count for a property
export const getImageCount = (property: Property): number => {
  if (!property.images) return 0;

  // For new system, we can't easily determine image vs video count from URLs
  // This is a limitation of the current implementation
  // In a full implementation, you might want to store media types separately
  return property.images.length;
};

// Get video count for a property
export const getVideoCount = (property: Property): number => {
  if (!property.images) return 0;

  // For new system, we can't easily determine image vs video count from URLs
  // This is a limitation of the current implementation
  // In a full implementation, you might want to store media types separately
  return 0; // Placeholder - would need proper media type tracking
};

// Check if a property needs thumbnail generation (old system)
export const needsThumbnailGeneration = (property: Property): boolean => {
  return isOldPropertySystem(property) && hasMedia(property);
};

// Get compression status for a property
export const getCompressionStatus = (
  property: Property
): {
  isCompressed: boolean;
  system: "old" | "new";
  hasThumbnail: boolean;
} => {
  const isNew = isNewPropertySystem(property);
  const hasThumbnail = isNew ? !!property.cover_thumbnail_url : false;

  return {
    isCompressed: isNew, // New system always uses compressed media
    system: isNew ? "new" : "old",
    hasThumbnail,
  };
};

// Format property system info for display
export const formatPropertySystemInfo = (property: Property): string => {
  const status = getCompressionStatus(property);
  const mediaCount = getMediaCount(property);

  if (status.system === "new") {
    return `New system • ${mediaCount} media • ${
      status.hasThumbnail ? "Thumbnail" : "No thumbnail"
    }`;
  } else {
    return `Legacy system • ${mediaCount} media • No compression`;
  }
};













