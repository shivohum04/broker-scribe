import { propertyService } from "./supabase";

/**
 * Handles cover image changes and thumbnail replacement
 * When a user changes the cover image, we need to:
 * 1. Generate a new thumbnail for the new cover image
 * 2. Update the property with the new thumbnail URLs
 * 3. Ensure the thumbnail array matches the images array
 */

export interface CoverImageUpdate {
  propertyId: string;
  userId: string;
  newImages: string[];
  newThumbnailUrls: string[];
}

/**
 * Updates the cover image and generates thumbnails for all images
 */
export const updateCoverImageWithThumbnails = async (
  propertyId: string,
  userId: string,
  newImages: string[]
): Promise<CoverImageUpdate> => {
  try {
    console.log(`Updating cover image for property ${propertyId}`);

    // Generate thumbnails for all images
    const thumbnailUrls: string[] = [];

    for (const imageUrl of newImages) {
      try {
        // Download the original image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch image: ${imageUrl}`);
          thumbnailUrls.push(""); // Empty string for failed thumbnails
          continue;
        }

        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: blob.type });

        // Generate thumbnail
        const thumbnailUrl = await propertyService.generateAndUploadThumbnail(
          file,
          userId,
          {
            fileName: imageUrl.split("/").pop() || "image",
            fileSize: file.size,
            fileType: file.type,
            userId,
            timestamp: new Date().toISOString(),
          }
        );

        thumbnailUrls.push(thumbnailUrl);
      } catch (error) {
        console.warn(`Failed to generate thumbnail for ${imageUrl}:`, error);
        thumbnailUrls.push(""); // Empty string for failed thumbnails
      }
    }

    // Update the property with new images and thumbnails
    await propertyService.updatePropertyImages(
      propertyId,
      newImages,
      thumbnailUrls
    );

    console.log(`Successfully updated cover image for property ${propertyId}`);

    return {
      propertyId,
      userId,
      newImages,
      newThumbnailUrls: thumbnailUrls,
    };
  } catch (error) {
    console.error(
      `Failed to update cover image for property ${propertyId}:`,
      error
    );
    throw error;
  }
};

/**
 * Reorders images and updates thumbnails accordingly
 * This is useful when a user drags to reorder images
 */
export const reorderImagesWithThumbnails = async (
  propertyId: string,
  userId: string,
  reorderedImages: string[],
  existingThumbnailUrls: string[]
): Promise<CoverImageUpdate> => {
  try {
    // Create a mapping of image URLs to their thumbnail URLs
    const imageToThumbnailMap = new Map<string, string>();

    // Get the current property to match existing thumbnails
    const { data: property } = await propertyService.getProperties();
    const currentProperty = property.find((p) => p.id === propertyId);

    if (currentProperty?.images && currentProperty?.thumbnail_urls) {
      currentProperty.images.forEach((imageUrl, index) => {
        const thumbnailUrl = currentProperty.thumbnail_urls?.[index] || "";
        imageToThumbnailMap.set(imageUrl, thumbnailUrl);
      });
    }

    // Reorder thumbnails to match the new image order
    const reorderedThumbnailUrls = reorderedImages.map(
      (imageUrl) => imageToThumbnailMap.get(imageUrl) || ""
    );

    // Update the property
    await propertyService.updatePropertyImages(
      propertyId,
      reorderedImages,
      reorderedThumbnailUrls
    );

    return {
      propertyId,
      userId,
      newImages: reorderedImages,
      newThumbnailUrls: reorderedThumbnailUrls,
    };
  } catch (error) {
    console.error(
      `Failed to reorder images for property ${propertyId}:`,
      error
    );
    throw error;
  }
};

/**
 * Adds new images to existing property and generates thumbnails
 */
export const addImagesWithThumbnails = async (
  propertyId: string,
  userId: string,
  newImageUrls: string[],
  existingImages: string[] = [],
  existingThumbnailUrls: string[] = []
): Promise<CoverImageUpdate> => {
  try {
    const allImages = [...existingImages, ...newImageUrls];
    const allThumbnailUrls = [...existingThumbnailUrls];

    // Generate thumbnails for new images
    for (const imageUrl of newImageUrls) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          allThumbnailUrls.push("");
          continue;
        }

        const blob = await response.blob();
        const file = new File([blob], "image.jpg", { type: blob.type });

        const thumbnailUrl = await propertyService.generateAndUploadThumbnail(
          file,
          userId,
          {
            fileName: imageUrl.split("/").pop() || "image",
            fileSize: file.size,
            fileType: file.type,
            userId,
            timestamp: new Date().toISOString(),
          }
        );

        allThumbnailUrls.push(thumbnailUrl);
      } catch (error) {
        console.warn(`Failed to generate thumbnail for ${imageUrl}:`, error);
        allThumbnailUrls.push("");
      }
    }

    // Update the property
    await propertyService.updatePropertyImages(
      propertyId,
      allImages,
      allThumbnailUrls
    );

    return {
      propertyId,
      userId,
      newImages: allImages,
      newThumbnailUrls: allThumbnailUrls,
    };
  } catch (error) {
    console.error(`Failed to add images for property ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Removes an image and its corresponding thumbnail
 */
export const removeImageWithThumbnail = async (
  propertyId: string,
  userId: string,
  imageIndexToRemove: number,
  existingImages: string[],
  existingThumbnailUrls: string[]
): Promise<CoverImageUpdate> => {
  try {
    // Remove the image and its thumbnail at the same index
    const newImages = existingImages.filter(
      (_, index) => index !== imageIndexToRemove
    );
    const newThumbnailUrls = existingThumbnailUrls.filter(
      (_, index) => index !== imageIndexToRemove
    );

    // Update the property
    await propertyService.updatePropertyImages(
      propertyId,
      newImages,
      newThumbnailUrls
    );

    return {
      propertyId,
      userId,
      newImages,
      newThumbnailUrls,
    };
  } catch (error) {
    console.error(`Failed to remove image for property ${propertyId}:`, error);
    throw error;
  }
};

