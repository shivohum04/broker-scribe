import localforage from "localforage";

// Configure localforage for video storage
localforage.config({
  name: "BrokerScribe",
  storeName: "videos",
  description: "Local video storage for BrokerScribe",
});

export interface LocalVideoMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  thumbnailUrl?: string;
}

export interface LocalVideoResult {
  success: boolean;
  localKey?: string;
  error?: string;
  metadata?: LocalVideoMetadata;
}

class LocalVideoStorage {
  private isIOS: boolean;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Store video file locally using localforage
   */
  async storeVideoLocally(
    file: File,
    propertyId: string,
    thumbnailUrl?: string
  ): Promise<LocalVideoResult> {
    try {
      // Check if we're on iOS and warn about potential issues
      if (this.isIOS) {
        console.warn(
          "iOS detected: Local video storage may be unreliable due to storage quotas and eviction policies."
        );
      }

      // Generate unique key for this video
      const localKey = `video_${propertyId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create metadata
      const metadata: LocalVideoMetadata = {
        id: localKey,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        thumbnailUrl,
      };

      // Store the file blob
      await localforage.setItem(localKey, file);

      // Store metadata separately for easy retrieval
      await localforage.setItem(`${localKey}_metadata`, metadata);

      console.log(`Video stored locally with key: ${localKey}`);

      return {
        success: true,
        localKey,
        metadata,
      };
    } catch (error) {
      console.error("Failed to store video locally:", error);

      let errorMessage =
        "Unable to store video locally. Try desktop or compress video.";

      if (error instanceof Error) {
        if (error.name === "QuotaExceededError") {
          errorMessage =
            "Local storage full. Please free up space or compress the video.";
        } else if (error.name === "SecurityError") {
          errorMessage =
            "Local storage blocked. Please check browser settings.";
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Retrieve video blob from local storage
   */
  async getLocalVideoBlob(localKey: string): Promise<Blob | null> {
    try {
      console.log(`📦 [LOCAL VIDEO] Retrieving blob for key: ${localKey}`);

      const videoBlob = await localforage.getItem<Blob>(localKey);

      if (videoBlob) {
        console.log(`✅ [LOCAL VIDEO] Blob retrieved successfully:`, {
          size: videoBlob.size,
          type: videoBlob.type,
          key: localKey,
        });
        return videoBlob;
      } else {
        console.warn(`⚠️ [LOCAL VIDEO] No blob found for key: ${localKey}`);
        return null;
      }
    } catch (error) {
      console.error(
        `❌ [LOCAL VIDEO] Failed to retrieve video with key ${localKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get video metadata from local storage
   */
  async getLocalVideoMetadata(
    localKey: string
  ): Promise<LocalVideoMetadata | null> {
    try {
      const metadata = await localforage.getItem<LocalVideoMetadata>(
        `${localKey}_metadata`
      );
      return metadata;
    } catch (error) {
      console.error(
        `Failed to retrieve video metadata for key ${localKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Create object URL for local video
   */
  async getLocalVideoUrl(localKey: string): Promise<string | null> {
    try {
      console.log(`🔗 [LOCAL VIDEO] Generating URL for key: ${localKey}`);

      const blob = await this.getLocalVideoBlob(localKey);
      if (!blob) {
        console.warn(
          `⚠️ [LOCAL VIDEO] No blob found for key: ${localKey} - Video data may have been lost`
        );
        return null;
      }

      console.log(`📦 [LOCAL VIDEO] Blob details:`, {
        size: blob.size,
        type: blob.type,
        key: localKey,
      });

      const url = URL.createObjectURL(blob);
      console.log(`✅ [LOCAL VIDEO] Generated URL: ${url}`);
      return url;
    } catch (error) {
      console.error(
        `❌ [LOCAL VIDEO] Failed to create object URL for video ${localKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a video exists in local storage
   */
  async hasLocalVideo(localKey: string): Promise<boolean> {
    try {
      const blob = await this.getLocalVideoBlob(localKey);
      return !!blob;
    } catch (error) {
      console.error(
        `Failed to check video existence for key ${localKey}:`,
        error
      );
      return false;
    }
  }

  /**
   * Remove video from local storage
   */
  async removeLocalVideo(localKey: string): Promise<boolean> {
    try {
      await localforage.removeItem(localKey);
      await localforage.removeItem(`${localKey}_metadata`);
      console.log(`Video removed from local storage: ${localKey}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove video ${localKey}:`, error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{
    used: number;
    quota: number;
    percentage: number;
    isIOS: boolean;
  }> {
    try {
      const estimate = await navigator.storage?.estimate();
      const used = estimate?.usage || 0;
      const quota = estimate?.quota || 0;

      return {
        used,
        quota,
        percentage: quota > 0 ? (used / quota) * 100 : 0,
        isIOS: this.isIOS,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        used: 0,
        quota: 0,
        percentage: 0,
        isIOS: this.isIOS,
      };
    }
  }

  /**
   * Check if local storage is available and has space
   */
  async checkStorageAvailability(): Promise<{
    available: boolean;
    warning?: string;
  }> {
    try {
      const info = await this.getStorageInfo();

      if (info.isIOS) {
        return {
          available: true,
          warning:
            "iOS detected: Local video storage may be unreliable due to storage quotas and eviction policies.",
        };
      }

      if (info.percentage > 80) {
        return {
          available: true,
          warning: "Local storage is nearly full. Consider freeing up space.",
        };
      }

      return { available: true };
    } catch (error) {
      return {
        available: false,
        warning: "Local storage is not available.",
      };
    }
  }

  /**
   * Clean up old videos (optional maintenance)
   */
  async cleanupOldVideos(
    maxAge: number = 30 * 24 * 60 * 60 * 1000
  ): Promise<number> {
    try {
      const keys = await localforage.keys();
      const cutoffTime = Date.now() - maxAge;
      let cleanedCount = 0;

      for (const key of keys) {
        if (key.endsWith("_metadata")) {
          const metadata = await localforage.getItem<LocalVideoMetadata>(key);
          if (
            metadata &&
            new Date(metadata.uploadedAt).getTime() < cutoffTime
          ) {
            const videoKey = key.replace("_metadata", "");
            await this.removeLocalVideo(videoKey);
            cleanedCount++;
          }
        }
      }

      console.log(`Cleaned up ${cleanedCount} old videos`);
      return cleanedCount;
    } catch (error) {
      console.error("Failed to cleanup old videos:", error);
      return 0;
    }
  }
}

// Export singleton instance
export const localVideoStorage = new LocalVideoStorage();

// Export types for use in other modules
export type { LocalVideoMetadata, LocalVideoResult };
