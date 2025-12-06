import { propertyService } from "@/backend/properties/property.service";

/**
 * Background service to generate thumbnails for existing properties
 * This runs in the background and doesn't block the UI
 */

interface ThumbnailGenerationProgress {
  propertyId: string;
  totalImages: number;
  completedImages: number;
  status: "pending" | "in-progress" | "completed" | "error";
  error?: string;
}

class BackgroundThumbnailService {
  private isRunning = false;
  private progress: Map<string, ThumbnailGenerationProgress> = new Map();
  private onProgressUpdate?: (progress: ThumbnailGenerationProgress) => void;

  constructor(
    onProgressUpdate?: (progress: ThumbnailGenerationProgress) => void
  ) {
    this.onProgressUpdate = onProgressUpdate;
  }

  /**
   * Start generating thumbnails for all properties that don't have them
   */
  async startThumbnailGeneration(userId: string): Promise<void> {
    if (this.isRunning) {
      console.log("Thumbnail generation already in progress");
      return;
    }

    this.isRunning = true;
    console.log("Starting background thumbnail generation...");

    try {
      const properties = await propertyService.getProperties();

      // Filter properties that need thumbnails
      const propertiesNeedingThumbnails = properties.filter(
        (property) =>
          property.images &&
          property.images.length > 0 &&
          (!property.thumbnail_urls || property.thumbnail_urls.length === 0)
      );

      console.log(
        `Found ${propertiesNeedingThumbnails.length} properties needing thumbnails`
      );

      // Process each property
      for (const property of propertiesNeedingThumbnails) {
        await this.generateThumbnailsForProperty(
          property.id,
          userId,
          property.images || []
        );
      }

      console.log("Background thumbnail generation completed");
    } catch (error) {
      console.error("Background thumbnail generation failed:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Generate thumbnails for a specific property
   */
  async generateThumbnailsForProperty(
    propertyId: string,
    userId: string,
    images: string[]
  ): Promise<void> {
    const progress: ThumbnailGenerationProgress = {
      propertyId,
      totalImages: images.length,
      completedImages: 0,
      status: "in-progress",
    };

    this.progress.set(propertyId, progress);
    this.onProgressUpdate?.(progress);

    try {
      console.log(
        `Generating thumbnails for property ${propertyId} (${images.length} images)`
      );

      const thumbnailUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];

        try {
          // Download the original image
          const response = await fetch(imageUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch image: ${imageUrl}`);
            thumbnailUrls.push("");
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

          // Update progress
          progress.completedImages = i + 1;
          this.progress.set(propertyId, progress);
          this.onProgressUpdate?.(progress);
        } catch (error) {
          console.warn(`Failed to generate thumbnail for ${imageUrl}:`, error);
          thumbnailUrls.push("");

          // Update progress even on error
          progress.completedImages = i + 1;
          this.progress.set(propertyId, progress);
          this.onProgressUpdate?.(progress);
        }
      }

      // Update property with thumbnail URLs
      await propertyService.updatePropertyImages(
        propertyId,
        images,
        thumbnailUrls
      );

      // Mark as completed
      progress.status = "completed";
      this.progress.set(propertyId, progress);
      this.onProgressUpdate?.(progress);

      console.log(
        `Successfully generated thumbnails for property ${propertyId}`
      );
    } catch (error) {
      console.error(
        `Failed to generate thumbnails for property ${propertyId}:`,
        error
      );
      progress.status = "error";
      progress.error = error instanceof Error ? error.message : "Unknown error";
      this.progress.set(propertyId, progress);
      this.onProgressUpdate?.(progress);
    }
  }

  /**
   * Get current progress for a property
   */
  getProgress(propertyId: string): ThumbnailGenerationProgress | undefined {
    return this.progress.get(propertyId);
  }

  /**
   * Get all progress
   */
  getAllProgress(): ThumbnailGenerationProgress[] {
    return Array.from(this.progress.values());
  }

  /**
   * Check if thumbnail generation is running
   */
  isThumbnailGenerationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Stop thumbnail generation
   */
  stopThumbnailGeneration(): void {
    this.isRunning = false;
    console.log("Thumbnail generation stopped");
  }
}

// Export singleton instance
export const backgroundThumbnailService = new BackgroundThumbnailService();

// Export the class for testing
export { BackgroundThumbnailService };

