import { supabase } from "@/integrations/supabase/client";
import {
  compressImage,
  compressVideo,
  generateCoverThumbnail,
  validateMediaFile,
} from "./media-compression";
import {
  retryWithBackoff,
  logUploadError,
  formatFileSize,
} from "./upload-utils";

export interface MediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
  isCover: boolean;
}

export interface CompressedMediaResult {
  originalUrl: string;
  compressedUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export const compressedMediaService = {
  // Upload and compress all media files
  async uploadAndCompressMedia(
    mediaFiles: MediaFile[],
    userId: string
  ): Promise<{
    images: string[];
    coverThumbnailUrl: string;
    results: CompressedMediaResult[];
  }> {
    try {
      console.log(
        `Starting compression and upload for ${mediaFiles.length} files`
      );

      const results: CompressedMediaResult[] = [];
      const imageUrls: string[] = [];
      let coverThumbnailUrl = "";

      // Process each media file
      for (const mediaFile of mediaFiles) {
        try {
          // Validate file
          const validation = validateMediaFile(mediaFile.file);
          if (!validation.valid) {
            throw new Error(validation.error);
          }

          console.log(`Processing ${mediaFile.type}: ${mediaFile.file.name}`);

          let finalFile: File;
          let compressionSuccess = true;
          let compressionError: string | null = null;

          try {
            // Try to compress the file
            finalFile =
              mediaFile.type === "image"
                ? await compressImage(mediaFile.file)
                : await compressVideo(mediaFile.file);

            console.log(`Compression successful for ${mediaFile.file.name}`);
          } catch (compressionErr) {
            console.warn(
              `Compression failed for ${mediaFile.file.name}, using original file:`,
              compressionErr
            );
            finalFile = mediaFile.file;
            compressionSuccess = false;
            compressionError =
              compressionErr instanceof Error
                ? compressionErr.message
                : "Compression failed";
          }

          // Upload the file (compressed or original)
          const uploadResult = await this.uploadCompressedFile(
            finalFile,
            userId
          );

          // Generate thumbnail for cover image only (always from original for best quality)
          let thumbnailUrl = "";
          if (mediaFile.isCover && mediaFile.type === "image") {
            try {
              const thumbnailFile = await generateCoverThumbnail(
                mediaFile.file
              );
              thumbnailUrl = await this.uploadThumbnail(thumbnailFile, userId);
              coverThumbnailUrl = thumbnailUrl;
            } catch (thumbnailErr) {
              console.warn(
                `Thumbnail generation failed for ${mediaFile.file.name}:`,
                thumbnailErr
              );
              // Continue without thumbnail
            }
          }

          // Store result
          const result: CompressedMediaResult = {
            originalUrl: uploadResult.url,
            compressedUrl: uploadResult.url, // Same URL since we upload the final file
            thumbnailUrl,
            fileSize: mediaFile.file.size,
            compressedSize: finalFile.size,
            compressionRatio: compressionSuccess
              ? (finalFile.size / mediaFile.file.size) * 100
              : 100, // 100% if compression failed
          };

          results.push(result);
          imageUrls.push(uploadResult.url);

          console.log(
            `Successfully processed ${mediaFile.type}: ${mediaFile.file.name}`
          );

          if (compressionSuccess) {
            console.log(
              `Compression: ${formatFileSize(
                mediaFile.file.size
              )} → ${formatFileSize(
                finalFile.size
              )} (${result.compressionRatio.toFixed(1)}%)`
            );
          } else {
            console.log(
              `Compression failed, using original: ${formatFileSize(
                finalFile.size
              )} (${compressionError})`
            );
          }
        } catch (error) {
          console.error(`Failed to process ${mediaFile.file.name}:`, error);
          throw new Error(
            `Failed to process ${mediaFile.file.name}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      console.log(`Successfully processed ${results.length} files`);
      return {
        images: imageUrls,
        coverThumbnailUrl,
        results,
      };
    } catch (error) {
      console.error("Media compression and upload failed:", error);
      throw error;
    }
  },

  // Upload compressed file to storage
  async uploadCompressedFile(
    file: File,
    userId: string
  ): Promise<{ url: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/compressed/${Date.now()}.${fileExt}`;

    const uploadContext = {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        `Uploading compressed file: ${fileName} (${formatFileSize(file.size)})`
      );

      const uploadResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          logUploadError(error, uploadContext);
          throw new Error(`Upload failed: ${error.message}`);
        }

        return data;
      });

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      console.log(`Compressed file uploaded successfully: ${fileName}`);
      return { url: urlData.publicUrl };
    } catch (error) {
      logUploadError(error, uploadContext);
      throw error;
    }
  },

  // Upload thumbnail to storage
  async uploadThumbnail(thumbnailFile: File, userId: string): Promise<string> {
    const fileName = `${userId}/thumbnails/${Date.now()}-cover-thumb.webp`;

    const uploadContext = {
      fileName,
      fileSize: thumbnailFile.size,
      fileType: thumbnailFile.type,
      userId,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        `Uploading thumbnail: ${fileName} (${formatFileSize(
          thumbnailFile.size
        )})`
      );

      const uploadResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, thumbnailFile, {
            contentType: "image/webp",
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          logUploadError(error, uploadContext);
          throw new Error(`Thumbnail upload failed: ${error.message}`);
        }

        return data;
      });

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      console.log(`Thumbnail uploaded successfully: ${fileName}`);
      return urlData.publicUrl;
    } catch (error) {
      logUploadError(error, uploadContext);
      throw error;
    }
  },

  // Get compression statistics
  getCompressionStats(results: CompressedMediaResult[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageCompressionRatio: number;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.fileSize, 0);
    const totalCompressedSize = results.reduce(
      (sum, r) => sum + r.compressedSize,
      0
    );
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio =
      results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

    return {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio,
    };
  },

  // Format compression statistics for display
  formatCompressionStats(
    stats: ReturnType<typeof compressedMediaService.getCompressionStats>
  ): string {
    const originalMB = (stats.totalOriginalSize / 1024 / 1024).toFixed(2);
    const compressedMB = (stats.totalCompressedSize / 1024 / 1024).toFixed(2);
    const savingsMB = (stats.totalSavings / 1024 / 1024).toFixed(2);
    const ratio = stats.averageCompressionRatio.toFixed(1);

    return `Compressed ${originalMB}MB → ${compressedMB}MB (saved ${savingsMB}MB, ${ratio}% of original)`;
  },
};
