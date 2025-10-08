import { supabase } from "@/integrations/supabase/client";
import { Property, MediaItem } from "@/types/property";
import {
  retryWithBackoff,
  logUploadError,
  formatFileSize,
  compressImage,
} from "./upload-utils";
import { generateThumbnail, getThumbnailUrl } from "./thumbnail-utils";
import { localVideoStorage, LocalVideoResult } from "./media-local";
import { uploadMediaFile, getCoverThumbnailUrl } from "./unified-media-utils";

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map((prop) => ({
      id: prop.id,
      user_id: prop.user_id,
      type: prop.type as Property["type"],
      addressLine1: prop.address_line_1 || "",
      addressLine2: prop.address_line_2 || "",
      addressLine3: prop.address_line_3 || "",
      rate: prop.rate || 0,
      rateType: prop.rate_type as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: prop.rental_per_month || 0,
      size: prop.size || 0,
      sizeUnit: prop.size_unit as "sqft" | "acres" | "hectare",
      ownerName: prop.owner_name || "",
      ownerContact: prop.owner_contact || "",
      notes: prop.notes || "",
      dateOfEntry: prop.date_of_entry || new Date().toISOString().split("T")[0],
      coordinates: prop.coordinates as Property["coordinates"],
      images: prop.images || [],
      media: prop.media || [], // Include unified media array
      cover_thumbnail_url: prop.cover_thumbnail_url || null,
      created_at: prop.created_at,
      updated_at: prop.updated_at,
    }));
  },

  /**
   * Attach pre-uploaded media objects to a property without re-uploading
   */
  async attachExistingMedia(
    propertyId: string,
    items: Array<{
      kind: "image" | "video";
      url?: string;
      thumbnailUrl?: string;
      localKey?: string;
    }>
  ): Promise<void> {
    console.log("🎥 [ATTACH MEDIA] Starting attachExistingMedia:", {
      propertyId,
      itemsCount: items.length,
      items: items,
    });

    // Fetch current media and cover
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("media, cover_thumbnail_url")
      .eq("id", propertyId)
      .single();

    if (fetchError) {
      console.error("🎥 [ATTACH MEDIA] Failed to fetch property:", fetchError);
      throw fetchError;
    }

    console.log("🎥 [ATTACH MEDIA] Fetched property data:", {
      currentMedia: property?.media,
      coverThumbnailUrl: property?.cover_thumbnail_url,
    });

    const currentMedia = (property?.media as any[]) || [];
    const newMedia: any[] = [];

    for (const item of items) {
      console.log("🎥 [ATTACH MEDIA] Processing item:", item);

      if (item.kind === "image" && item.url) {
        const imageMedia = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "image",
          storageType: "cloud",
          url: item.url,
          thumbnailUrl: item.thumbnailUrl || null,
          uploadedAt: new Date().toISOString(),
        };
        newMedia.push(imageMedia);
        console.log("🎥 [ATTACH MEDIA] Added image media:", imageMedia);
      } else if (item.kind === "video" && item.localKey) {
        const videoMedia = {
          id: item.localKey,
          type: "video",
          storageType: "local",
          localKey: item.localKey,
          thumbnailUrl: item.thumbnailUrl || null,
          uploadedAt: new Date().toISOString(),
        };
        newMedia.push(videoMedia);
        console.log("🎥 [ATTACH MEDIA] Added video media:", videoMedia);
      } else {
        console.warn(
          "🎥 [ATTACH MEDIA] Skipping item - missing required fields:",
          item
        );
      }
    }

    if (newMedia.length === 0) {
      console.log("🎥 [ATTACH MEDIA] No new media to add, returning");
      return;
    }

    const updatedMedia = [...currentMedia, ...newMedia];
    console.log("🎥 [ATTACH MEDIA] Updated media array:", {
      currentMediaCount: currentMedia.length,
      newMediaCount: newMedia.length,
      totalMediaCount: updatedMedia.length,
      updatedMedia: updatedMedia,
    });

    // Determine cover thumbnail if not set and there is at least one image
    let coverThumbnailUrl = property?.cover_thumbnail_url || null;
    if (!coverThumbnailUrl) {
      const firstImage = updatedMedia.find((m: any) => m.type === "image");
      if (firstImage?.thumbnailUrl) {
        coverThumbnailUrl = firstImage.thumbnailUrl;
        console.log(
          "🎥 [ATTACH MEDIA] Set cover thumbnail from first image:",
          coverThumbnailUrl
        );
      }
    }

    console.log("🎥 [ATTACH MEDIA] Updating property with media:", {
      propertyId,
      mediaCount: updatedMedia.length,
      coverThumbnailUrl,
    });

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        media: updatedMedia,
        cover_thumbnail_url: coverThumbnailUrl,
      })
      .eq("id", propertyId);

    if (updateError) {
      console.error(
        "🎥 [ATTACH MEDIA] Failed to update property:",
        updateError
      );
      throw updateError;
    }

    console.log("🎥 [ATTACH MEDIA] Successfully updated property with media");
  },

  async addProperty(
    property: Omit<Property, "id" | "created_at" | "updated_at">
  ): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: property.user_id,
        type: property.type,
        address_line_1: property.addressLine1,
        address_line_2: property.addressLine2,
        address_line_3: property.addressLine3,
        rate: property.rate,
        rate_type: property.rateType,
        rental_per_month: property.rentalPerMonth,
        size: property.size,
        size_unit: property.sizeUnit,
        owner_name: property.ownerName,
        owner_contact: property.ownerContact,
        notes: property.notes,
        date_of_entry: property.dateOfEntry,
        coordinates: property.coordinates,
        images: property.images || [],
        media: property.media || [], // Include unified media array
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create property:", error);
      throw error;
    }

    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type as Property["type"],
      addressLine1: data.address_line_1 || "",
      addressLine2: data.address_line_2 || "",
      addressLine3: data.address_line_3 || "",
      rate: data.rate || 0,
      rateType: data.rate_type as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: data.rental_per_month || 0,
      size: data.size || 0,
      sizeUnit: data.size_unit as "sqft" | "acres" | "hectare",
      ownerName: data.owner_name || "",
      ownerContact: data.owner_contact || "",
      notes: data.notes || "",
      dateOfEntry: data.date_of_entry || new Date().toISOString().split("T")[0],
      coordinates: data.coordinates as Property["coordinates"],
      images: data.images || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .update({
        type: updates.type,
        address_line_1: updates.addressLine1,
        address_line_2: updates.addressLine2,
        address_line_3: updates.addressLine3,
        rate: updates.rate,
        rate_type: updates.rateType,
        rental_per_month: updates.rentalPerMonth,
        size: updates.size,
        size_unit: updates.sizeUnit,
        owner_name: updates.ownerName,
        owner_contact: updates.ownerContact,
        notes: updates.notes,
        date_of_entry: updates.dateOfEntry,
        coordinates: updates.coordinates,
        images: updates.images,
        media: updates.media, // Include unified media array
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update property:", error);
      throw error;
    }
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) throw error;
  },

  async uploadImage(file: File, userId: string): Promise<string> {
    const result = await this.uploadMedia(file, userId);
    return result.url;
  },

  async uploadMedia(
    file: File,
    userId: string
  ): Promise<{ url: string; thumbnailUrl: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const uploadContext = {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId,
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        `Starting upload: ${fileName} (${formatFileSize(file.size)})`
      );

      // Upload original file
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

      console.log(`Upload successful: ${fileName}`);

      // Generate and upload thumbnail
      let thumbnailUrl = "";
      try {
        console.log(`Generating thumbnail for: ${fileName}`);
        const thumbnailFile = await generateThumbnail(file);

        const thumbnailFileName = `${userId}/${Date.now()}-thumb.webp`;

        const thumbnailUploadResult = await retryWithBackoff(async () => {
          const { data, error } = await supabase.storage
            .from("property-images")
            .upload(thumbnailFileName, thumbnailFile, {
              contentType: "image/webp",
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            logUploadError(error, { ...uploadContext, type: "thumbnail" });
            throw new Error(`Thumbnail upload failed: ${error.message}`);
          }

          return data;
        });

        const { data: thumbnailUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = thumbnailUrlData.publicUrl;
        console.log(`Thumbnail upload successful: ${thumbnailFileName}`);
      } catch (thumbnailError) {
        console.warn(
          `Thumbnail generation/upload failed for ${fileName}:`,
          thumbnailError
        );
        // Don't fail the entire upload if thumbnail generation fails
        // The system will fall back to placeholder images
      }

      return {
        url: urlData.publicUrl,
        thumbnailUrl: thumbnailUrl,
      };
    } catch (error) {
      logUploadError(error, uploadContext);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("413")) {
          throw new Error("File too large. Please try a smaller file.");
        } else if (error.message.includes("timeout")) {
          throw new Error(
            "Upload timed out. Please check your connection and try again."
          );
        } else if (error.message.includes("network")) {
          throw new Error(
            "Network error. Please check your connection and try again."
          );
        }
      }

      throw error;
    }
  },

  /**
   * Upload a compressed image without generating a thumbnail
   */
  async uploadCompressedImage(
    file: File,
    userId: string
  ): Promise<{ url: string }> {
    try {
      // Compress image first
      const compressedFile = await compressImage(file);

      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const uploadContext = {
        fileName,
        fileSize: compressedFile.size,
        fileType: compressedFile.type,
        userId,
        timestamp: new Date().toISOString(),
      };

      const uploadResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, compressedFile, {
            contentType: compressedFile.type,
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

      return { url: urlData.publicUrl };
    } catch (error) {
      logUploadError(error, { fileName: file.name, fileSize: file.size });
      throw error;
    }
  },

  /**
   * Generate and upload a thumbnail for a cover image only
   */
  async uploadCoverThumbnail(file: File, userId: string): Promise<string> {
    try {
      const thumbnailFile = await generateThumbnail(file);
      const thumbnailFileName = `${userId}/${Date.now()}-thumb.webp`;

      const uploadContext = {
        fileName: thumbnailFileName,
        fileSize: thumbnailFile.size,
        fileType: thumbnailFile.type,
        userId,
        timestamp: new Date().toISOString(),
      };

      const thumbnailUploadResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(thumbnailFileName, thumbnailFile, {
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

      const { data: thumbnailUrlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(thumbnailFileName);

      return thumbnailUrlData.publicUrl;
    } catch (error) {
      logUploadError(error, { fileName: file.name, fileSize: file.size });
      throw error;
    }
  },

  /**
   * Upload compressed video to cloud storage
   */
  async uploadCompressedVideo(
    file: File,
    userId: string
  ): Promise<{ url: string }> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/videos/${Date.now()}.${fileExt}`;

      console.log("🎬 [VIDEO UPLOAD] Uploading compressed video:", {
        name: file.name,
        size: file.size,
        path: fileName,
      });

      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ [VIDEO UPLOAD] Upload failed:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-media").getPublicUrl(fileName);

      console.log("✅ [VIDEO UPLOAD] Video uploaded successfully:", publicUrl);

      return { url: publicUrl };
    } catch (error) {
      console.error("❌ [VIDEO UPLOAD] Video upload failed:", error);
      throw error;
    }
  },

  // New helper APIs for hybrid storage strategy

  /**
   * Get lightweight property list with only essential fields
   */
  async getPropertiesList(): Promise<
    Array<{
      id: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      type: string;
      rate: number;
      cover_thumbnail_url?: string;
      media_count: number;
      created_at: string;
      updated_at: string;
    }>
  > {
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, address_line_1, address_line_2, address_line_3, type, rate, cover_thumbnail_url, created_at, updated_at, media"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map((prop) => ({
      id: prop.id,
      addressLine1: prop.address_line_1 || "",
      addressLine2: prop.address_line_2 || "",
      addressLine3: prop.address_line_3 || "",
      type: prop.type,
      rate: prop.rate || 0,
      cover_thumbnail_url: prop.cover_thumbnail_url,
      media_count: Array.isArray(prop.media) ? prop.media.length : 0,
      created_at: prop.created_at,
      updated_at: prop.updated_at,
    }));
  },

  /**
   * Upload image and generate thumbnail with compression
   */
  async uploadImageAndThumbnail(
    file: File,
    userId: string
  ): Promise<{ url: string; thumbnailUrl: string }> {
    try {
      // Compress image first
      const compressedFile = await compressImage(file);

      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const uploadContext = {
        fileName,
        fileSize: compressedFile.size,
        fileType: compressedFile.type,
        userId,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `Uploading compressed image: ${fileName} (${formatFileSize(
          compressedFile.size
        )})`
      );

      // Upload compressed image
      const uploadResult = await retryWithBackoff(async () => {
        const { data, error } = await supabase.storage
          .from("property-images")
          .upload(fileName, compressedFile, {
            contentType: compressedFile.type,
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

      // Generate and upload thumbnail
      let thumbnailUrl = "";
      try {
        console.log(`Generating thumbnail for: ${fileName}`);
        const thumbnailFile = await generateThumbnail(compressedFile);

        const thumbnailFileName = `${userId}/${Date.now()}-thumb.webp`;

        const thumbnailUploadResult = await retryWithBackoff(async () => {
          const { data, error } = await supabase.storage
            .from("property-images")
            .upload(thumbnailFileName, thumbnailFile, {
              contentType: "image/webp",
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            logUploadError(error, { ...uploadContext, type: "thumbnail" });
            throw new Error(`Thumbnail upload failed: ${error.message}`);
          }

          return data;
        });

        const { data: thumbnailUrlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = thumbnailUrlData.publicUrl;
        console.log(`Thumbnail upload successful: ${thumbnailFileName}`);
      } catch (thumbnailError) {
        console.warn(
          `Thumbnail generation/upload failed for ${fileName}:`,
          thumbnailError
        );
      }

      return {
        url: urlData.publicUrl,
        thumbnailUrl: thumbnailUrl,
      };
    } catch (error) {
      logUploadError(error, { fileName: file.name, fileSize: file.size });
      throw error;
    }
  },

  // Removed uploadVideoThumbnail - no thumbnails for videos

  /**
   * Add media to property with hybrid storage strategy
   */
  async addMediaToProperty(
    propertyId: string,
    file: File,
    userId: string,
    isCover: boolean = false
  ): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    try {
      const isVideo = file.type.startsWith("video/");
      let mediaObject: any;

      if (isVideo) {
        // Store video locally - no thumbnail generation
        const localResult: LocalVideoResult =
          await localVideoStorage.storeVideoLocally(file, propertyId);

        if (!localResult.success) {
          return { success: false, error: localResult.error };
        }

        mediaObject = {
          id: localResult.localKey!,
          type: "video",
          storageType: "local",
          localKey: localResult.localKey!,
          thumbnailUrl: null, // No thumbnails for videos
          uploadedAt: new Date().toISOString(),
        };
      } else {
        // Store image in cloud with compression, only generate thumbnail if cover
        const imageResult = await this.uploadCompressedImage(file, userId);
        let thumbnailUrl: string | null = null;

        if (isCover) {
          try {
            thumbnailUrl = await this.uploadCoverThumbnail(file, userId);
          } catch (thumbnailError) {
            console.warn("Cover thumbnail generation failed:", thumbnailError);
          }
        }

        mediaObject = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: "image",
          storageType: "cloud",
          url: imageResult.url,
          thumbnailUrl: thumbnailUrl,
          uploadedAt: new Date().toISOString(),
        };
      }

      // Get current media array
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("media, cover_thumbnail_url")
        .eq("id", propertyId)
        .single();

      if (fetchError) throw fetchError;

      const currentMedia = property.media || [];
      const updatedMedia = [...currentMedia, mediaObject];

      // Update cover thumbnail only for images (not videos)
      let coverThumbnailUrl = property.cover_thumbnail_url;
      if (isCover && !isVideo && mediaObject.thumbnailUrl) {
        coverThumbnailUrl = mediaObject.thumbnailUrl;
      } else if (
        currentMedia.length === 0 &&
        !isVideo &&
        mediaObject.thumbnailUrl
      ) {
        // First image becomes cover automatically
        coverThumbnailUrl = mediaObject.thumbnailUrl;
      }

      // Update property with new media
      const { error: updateError } = await retryWithBackoff(async () => {
        const { error } = await supabase
          .from("properties")
          .update({
            media: updatedMedia,
            cover_thumbnail_url: coverThumbnailUrl,
          })
          .eq("id", propertyId);

        if (error) throw error;
        return { error: null };
      });

      if (updateError) throw updateError;

      return { success: true, mediaId: mediaObject.id };
    } catch (error) {
      console.error("Failed to add media to property:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Remove media from property
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
      // Get current media array
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("media, cover_thumbnail_url")
        .eq("id", propertyId)
        .single();

      if (fetchError) throw fetchError;

      const currentMedia = property.media || [];
      const mediaToRemove = currentMedia.find((m: any) => m.id === mediaId);

      if (!mediaToRemove) {
        return { success: false, error: "Media not found" };
      }

      // Remove from array
      const updatedMedia = currentMedia.filter((m: any) => m.id !== mediaId);

      // Handle local video cleanup
      if (mediaToRemove.storageType === "local" && mediaToRemove.localKey) {
        await localVideoStorage.removeLocalVideo(mediaToRemove.localKey);
      }

      // Determine new cover thumbnail
      let newCoverThumbnailUrl = property.cover_thumbnail_url;
      const remainingImages = updatedMedia.filter(
        (m: any) => m.type === "image"
      );

      if (remainingImages.length > 0) {
        // Promote first remaining image to cover
        newCoverThumbnailUrl = remainingImages[0].thumbnailUrl;
      } else {
        // No images left, clear cover thumbnail
        newCoverThumbnailUrl = null;
      }

      // Update property
      const { error: updateError } = await retryWithBackoff(async () => {
        const { error } = await supabase
          .from("properties")
          .update({
            media: updatedMedia,
            cover_thumbnail_url: newCoverThumbnailUrl,
          })
          .eq("id", propertyId);

        if (error) throw error;
        return { error: null };
      });

      if (updateError) throw updateError;

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
   * Get full property with media
   */
  async getPropertyWithMedia(propertyId: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type as Property["type"],
      addressLine1: data.address_line_1 || "",
      addressLine2: data.address_line_2 || "",
      addressLine3: data.address_line_3 || "",
      rate: data.rate || 0,
      rateType: data.rate_type as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: data.rental_per_month || 0,
      size: data.size || 0,
      sizeUnit: data.size_unit as "sqft" | "acres" | "hectare",
      ownerName: data.owner_name || "",
      ownerContact: data.owner_contact || "",
      notes: data.notes || "",
      dateOfEntry: data.date_of_entry || new Date().toISOString().split("T")[0],
      coordinates: data.coordinates as Property["coordinates"],
      images: data.images || [], // Keep for backward compatibility
      media: data.media || [], // New media array
      cover_thumbnail_url: data.cover_thumbnail_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  /**
   * Add unified media to property
   */
  async addUnifiedMediaToProperty(
    propertyId: string,
    files: File[],
    userId: string
  ): Promise<{ success: boolean; mediaItems: MediaItem[]; error?: string }> {
    try {
      // Get current media
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("media")
        .eq("id", propertyId)
        .single();

      if (fetchError) throw fetchError;

      const currentMedia: MediaItem[] = property.media || [];
      const newMediaItems: MediaItem[] = [];
      let hasExistingImages = currentMedia.some((m) => m.type === "image");

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isFirstImage =
          !hasExistingImages && file.type.startsWith("image/") && i === 0;

        const result = await uploadMediaFile(
          file,
          propertyId,
          userId,
          isFirstImage
        );

        if (result.success && result.mediaItem) {
          newMediaItems.push(result.mediaItem);
          if (result.mediaItem.type === "image") {
            hasExistingImages = true;
          }
        } else {
          console.error(`Failed to upload ${file.name}:`, result.error);
        }
      }

      if (newMediaItems.length === 0) {
        return {
          success: false,
          mediaItems: [],
          error: "No files were uploaded successfully",
        };
      }

      // Update property with new media
      const updatedMedia = [...currentMedia, ...newMediaItems];

      const { error: updateError } = await supabase
        .from("properties")
        .update({ media: updatedMedia })
        .eq("id", propertyId);

      if (updateError) throw updateError;

      return { success: true, mediaItems: newMediaItems };
    } catch (error) {
      console.error("Failed to add unified media:", error);
      return {
        success: false,
        mediaItems: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Remove media item from property
   */
  async removeUnifiedMediaFromProperty(
    propertyId: string,
    mediaId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current media
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("media")
        .eq("id", propertyId)
        .single();

      if (fetchError) throw fetchError;

      const currentMedia: MediaItem[] = property.media || [];
      const mediaToRemove = currentMedia.find((m) => m.id === mediaId);

      if (!mediaToRemove) {
        return { success: false, error: "Media not found" };
      }

      // Handle local video cleanup
      if (mediaToRemove.type === "video" && mediaToRemove.localKey) {
        await localVideoStorage.removeLocalVideo(mediaToRemove.localKey);
      }

      // Remove from array
      const updatedMedia = currentMedia.filter((m) => m.id !== mediaId);

      // Update property
      const { error: updateError } = await supabase
        .from("properties")
        .update({ media: updatedMedia })
        .eq("id", propertyId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error("Failed to remove unified media:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
