import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Property, MediaItem } from "@/types/property";
import { propertyService } from "@/lib/supabase";
import { LazyMedia } from "./LazyMedia";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";
import {
  getCoverImage,
  getCoverThumbnailUrl,
  updateCoverImage,
  getVideoPlaceholder,
} from "@/lib/unified-media-utils";

interface CoverImageManagerProps {
  property: Property;
  onPropertyUpdate: (updatedProperty: Property) => void;
  onImageClick: (media: MediaItem[], startIndex: number) => void;
}

export const CoverImageManager: React.FC<CoverImageManagerProps> = ({
  property,
  onPropertyUpdate,
  onImageClick,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const mediaList: MediaItem[] = Array.isArray(property.media)
    ? property.media
    : [];

  const handleCoverImageChange = async (newCoverId: string) => {
    if (!mediaList || mediaList.length === 0) return;

    try {
      setIsUpdating(true);
      console.log(`Changing cover image to ${newCoverId}`);

      // Update cover image in the media array
      const updatedMedia = updateCoverImage(mediaList, newCoverId);

      // Update the property in the database
      await propertyService.updateProperty(property.id, {
        media: updatedMedia,
      });

      // Update the property in the UI
      const updatedProperty: Property = {
        ...property,
        media: updatedMedia,
      };

      onPropertyUpdate(updatedProperty);

      toast({
        title: "Cover image updated",
        description: "The cover image has been changed.",
      });
    } catch (error) {
      console.error("Failed to update cover image:", error);
      toast({
        title: "Update failed",
        description: "Failed to update cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageReorder = async (newOrder: MediaItem[]) => {
    if (!mediaList || mediaList.length === 0) return;

    try {
      setIsUpdating(true);
      console.log("Reordering images");

      // Update the property
      await propertyService.updateProperty(property.id, {
        media: newOrder,
      });

      // Update the property in the UI
      const updatedProperty: Property = {
        ...property,
        media: newOrder,
      };

      onPropertyUpdate(updatedProperty);

      toast({
        title: "Images reordered",
        description: "The image order has been updated.",
      });
    } catch (error) {
      console.error("Failed to reorder images:", error);
      toast({
        title: "Reorder failed",
        description: "Failed to reorder images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!mediaList || mediaList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No media available</p>
      </div>
    );
  }

  const coverImage = getCoverImage(mediaList);
  const coverThumbnailUrl = getCoverThumbnailUrl(mediaList);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Property Media</h3>
        <div className="text-sm text-muted-foreground">
          {mediaList.length} item{mediaList.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Cover Image</label>
        <div className="relative">
          {coverThumbnailUrl ? (
            <LazyMedia
              src={coverThumbnailUrl}
              thumbnailSrc={coverThumbnailUrl}
              alt="Cover image"
              className="w-full h-48 rounded-lg border border-card-border"
              onClick={() => onImageClick(mediaList, 0)}
              showFullSize={false}
            />
          ) : coverImage ? (
            <LazyMedia
              src={coverImage.url || ""}
              thumbnailSrc={coverImage.thumbnailUrl}
              alt="Cover image"
              className="w-full h-48 rounded-lg border border-card-border"
              onClick={() => onImageClick(mediaList, 0)}
              showFullSize={false}
            />
          ) : (
            <div className="w-full h-48 rounded-lg border border-card-border bg-muted flex items-center justify-center">
              <img
                src={getVideoPlaceholder()}
                alt="Video placeholder"
                className="w-16 h-16 opacity-50"
              />
            </div>
          )}
          {isUpdating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm">Updating...</div>
            </div>
          )}
        </div>
      </div>

      {/* All Media Grid */}
      <div className="space-y-2">
        <label className="text-sm font-medium">All Media</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {mediaList.map((mediaItem, index) => (
            <div
              key={mediaItem.id}
              className="relative group aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              {mediaItem.type === "video" ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: "10px solid currentColor",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      color: "#6b7280",
                    }}
                  />
                </div>
              ) : (
                <LazyMedia
                  src={mediaItem.url || ""}
                  thumbnailSrc={mediaItem.thumbnailUrl}
                  alt={`Property media ${index + 1}`}
                  className="w-full h-full"
                  onClick={() => onImageClick(mediaList, index)}
                  showFullSize={false}
                />
              )}

              {/* Cover image indicator */}
              {mediaItem.isCover && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  Cover
                </div>
              )}

              {/* Change cover button - only for images */}
              {mediaItem.type === "image" && !mediaItem.isCover && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCoverImageChange(mediaItem.id);
                    }}
                    disabled={isUpdating}
                  >
                    Set as Cover
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground">
        <p>• Click on any media to view it in full size</p>
        <p>• Hover over non-cover images to set them as the cover image</p>
        <p>• Videos cannot be set as cover images</p>
        <p>• Thumbnails are automatically generated for better performance</p>
      </div>
    </div>
  );
};
