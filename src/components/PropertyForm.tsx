import { useEffect, useState } from "react";
import { Plus, X, Info, Upload, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressInput } from "./AddressInput";
import { LazyMedia } from "./LazyMedia";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";
import { localVideoStorage } from "@/lib/media-local";
import { VideoPlaceholder } from "./VideoPlaceholder";
import { CoordinatesInput } from "./CoordinatesInput";
import { MediaUpload } from "./MediaUpload";
import { MediaInfoPopup } from "./MediaInfoPopup";
import { Property, PropertyType, MediaItem } from "@/types/property";
import { propertyService } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: () => void;
  editProperty?: Property;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "land", label: "Land" },
  { value: "flat", label: "Flat" },
  { value: "independent house", label: "Independent House" },
  { value: "commercial", label: "Commercial (Office/Shop)" },
  { value: "warehouse", label: "Warehouse" },
];

export const PropertyForm = ({
  isOpen,
  onClose,
  onPropertyAdded,
  editProperty,
}: PropertyFormProps) => {
  const [formData, setFormData] = useState<Partial<Property>>({
    type: "land",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    rate: 0,
    rateType: "total",
    rentalPerMonth: 0,
    size: 0,
    sizeUnit: "sqft",
    ownerName: "",
    ownerContact: "",
    notes: "",
    coordinates: undefined,
    images: [],
    media: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [localVideoUrls, setLocalVideoUrls] = useState<Record<string, string>>(
    {}
  );
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    // Reset or populate when modal opens
    if (editProperty) {
      setFormData({
        type: editProperty.type,
        addressLine1: editProperty.addressLine1 || "",
        addressLine2: editProperty.addressLine2 || "",
        addressLine3: editProperty.addressLine3 || "",
        rate: editProperty.rate || 0,
        rateType: editProperty.rateType,
        rentalPerMonth: editProperty.rentalPerMonth || 0,
        size: editProperty.size || 0,
        sizeUnit: editProperty.sizeUnit,
        ownerName: editProperty.ownerName || "",
        ownerContact: editProperty.ownerContact || "",
        notes: editProperty.notes || "",
        coordinates: editProperty.coordinates,
        images: editProperty.images || [],
      });
      // Load full media for edit flow
      (async () => {
        try {
          setLoadingMedia(true);
          const full = await propertyService.getPropertyWithMedia(
            editProperty.id
          );
          const list = (full && (full as any).media) || [];
          setMediaItems(list);
          const entries = await Promise.all(
            list
              .filter(
                (m: any) =>
                  m?.type === "video" &&
                  m?.storageType === "local" &&
                  m?.localKey
              )
              .map(async (m: any) => {
                const url = await localVideoStorage.getLocalVideoUrl(
                  m.localKey
                );
                return [m.id, url] as const;
              })
          );
          const map: Record<string, string> = {};
          for (const [id, url] of entries) {
            if (url) map[id] = url;
          }
          setLocalVideoUrls(map);
        } finally {
          setLoadingMedia(false);
        }
      })();
    } else {
      setFormData({
        type: "land",
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
        rate: 0,
        rateType: "total",
        rentalPerMonth: 0,
        size: 0,
        sizeUnit: "sqft",
        ownerName: "",
        ownerContact: "",
        notes: "",
        coordinates: undefined,
        images: [],
        media: [], // Add media field for new properties
      });
    }
  }, [isOpen, editProperty]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add properties",
        variant: "destructive",
      });
      return;
    }

    const propertyData = {
      user_id: user.id,
      type: formData.type as PropertyType,
      addressLine1: formData.addressLine1 || "",
      addressLine2: formData.addressLine2 || "",
      addressLine3: formData.addressLine3 || "",
      rate: formData.rate || 0,
      rateType: formData.rateType as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: formData.rentalPerMonth || 0,
      size: formData.size || 0,
      sizeUnit: formData.sizeUnit as "sqft" | "acres" | "hectare",
      ownerName: formData.ownerName || "",
      ownerContact: formData.ownerContact || "",
      notes: formData.notes || "",
      dateOfEntry:
        formData.dateOfEntry || new Date().toISOString().split("T")[0],
      coordinates: formData.coordinates,
      images: (formData.images || []).filter(
        (img) => !img.startsWith("local-video-")
      ),
      media: formData.media || [], // Include unified media array
    };

    try {
      setSubmitting(true);
      let createdProperty: Property | null = null;

      if (editProperty) {
        await propertyService.updateProperty(editProperty.id, propertyData);
        toast({
          title: "Property updated",
          description: "Property details have been updated successfully",
        });
      } else {
        createdProperty = await propertyService.addProperty(propertyData);
        toast({
          title: "Property added",
          description: "New property has been added successfully",
        });
      }

      // Handle media upload for new properties
      if (createdProperty && formData.media && formData.media.length > 0) {
        try {
          // The media is already uploaded and stored in formData.media
          // We just need to update the property with the media array
          await propertyService.updateProperty(createdProperty.id, {
            media: formData.media,
          });
        } catch (mediaError) {
          console.error("Failed to save media:", mediaError);
          toast({
            title: "Media save failed",
            description:
              "Property was created but media may not have been saved. You can add media later.",
            variant: "destructive",
          });
        }
      }

      onPropertyAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMediaItem = async (mediaId: string) => {
    if (!editProperty) return;
    try {
      const result = await propertyService.removeMediaFromProperty(
        editProperty.id,
        mediaId
      );
      if (result.success) {
        const full = await propertyService.getPropertyWithMedia(
          editProperty.id
        );
        const list = (full && (full as any).media) || [];
        setMediaItems(list);
        const entries = await Promise.all(
          list
            .filter(
              (m: any) =>
                m?.type === "video" && m?.storageType === "local" && m?.localKey
            )
            .map(async (m: any) => {
              const url = await localVideoStorage.getLocalVideoUrl(m.localKey);
              return [m.id, url] as const;
            })
        );
        const map: Record<string, string> = {};
        for (const [id, url] of entries) {
          if (url) map[id] = url;
        }
        setLocalVideoUrls(map);
        const removed = mediaItems.find((m) => m.id === mediaId);
        if (removed && removed.type === "image" && removed.url) {
          setFormData((prev) => ({
            ...prev,
            images: (prev.images || []).filter((u) => u !== removed.url),
          }));
        }
      }
    } catch (err) {
      console.error("Failed to remove media:", err);
    }
  };

  const handleAddressChange = (
    addressLine1: string,
    addressLine2: string,
    addressLine3: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      addressLine1,
      addressLine2,
      addressLine3,
    }));
  };

  const handleCoordinatesChange = (coordinates?: {
    lat: number;
    lng: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      coordinates,
    }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload media",
        variant: "destructive",
      });
      return;
    }

    if (!editProperty) {
      toast({
        title: "Property not found",
        description: "Cannot upload media without a property",
        variant: "destructive",
      });
      return;
    }

    try {
      const { uploadMediaFile } = await import("@/lib/unified-media-utils");

      // Collect all successful uploads
      const newMediaItems: MediaItem[] = [];
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadMediaFile(
          file,
          editProperty.id,
          user.id,
          false // Not first image since we're adding to existing
        );

        if (result.success && result.mediaItem) {
          newMediaItems.push(result.mediaItem);
          return { success: true, mediaItem: result.mediaItem };
        } else {
          return { success: false, error: result.error };
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Check if we have any successful uploads
      const successfulUploads = results.filter((r) => r.success);
      const failedUploads = results.filter((r) => !r.success);

      if (successfulUploads.length > 0) {
        // Create the updated media array with all new items
        const updatedMedia = [...mediaItems, ...newMediaItems];

        // Update both local state and form data with the complete array
        setMediaItems(updatedMedia);
        setFormData((prev) => ({
          ...prev,
          media: updatedMedia,
        }));

        // Update the property in the database with all new media
        try {
          await propertyService.updateProperty(editProperty.id, {
            media: updatedMedia,
          });
        } catch (dbError) {
          console.error("Failed to save media to database:", dbError);
          toast({
            title: "Database update failed",
            description: "Media uploaded but may not be saved permanently",
            variant: "destructive",
          });
        }

        // Show success message
        toast({
          title: "Media uploaded",
          description: `${successfulUploads.length} media item(s) have been added to the property`,
        });
      }

      // Show any failed uploads
      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedUploads.length} file(s) could not be uploaded`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload media files",
        variant: "destructive",
      });
    }

    // Reset the file input
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card w-full max-w-md max-h-[90vh] rounded-lg shadow-lg animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <h2 className="text-lg font-semibold truncate">
            {editProperty ? "Edit Property" : "Add New Property"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as PropertyType,
                }))
              }
            >
              <SelectTrigger className="border-input-border focus:border-input-focus">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <AddressInput
              addressLine1={formData.addressLine1 || ""}
              addressLine2={formData.addressLine2 || ""}
              addressLine3={formData.addressLine3 || ""}
              onChange={handleAddressChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinates">Location Coordinates</Label>
            <CoordinatesInput
              coordinates={formData.coordinates}
              onChange={handleCoordinatesChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                type="number"
                value={formData.size || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    size: Number(e.target.value),
                  }))
                }
                placeholder="0"
                className="border-input-border focus:border-input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizeUnit">Unit</Label>
              <Select
                value={formData.sizeUnit}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, sizeUnit: value as any }))
                }
              >
                <SelectTrigger className="border-input-border focus:border-input-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Sq Ft</SelectItem>
                  <SelectItem value="acres">Acres</SelectItem>
                  <SelectItem value="hectare">Hectare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                type="number"
                value={formData.rate || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rate: Number(e.target.value),
                  }))
                }
                placeholder="0"
                className="border-input-border focus:border-input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateType">Rate Type</Label>
              <Select
                value={formData.rateType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, rateType: value as any }))
                }
              >
                <SelectTrigger className="border-input-border focus:border-input-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                  <SelectItem value="per_acre">Per Acre</SelectItem>
                  <SelectItem value="per_hectare">Per Hectare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalPerMonth">Rent per Month</Label>
            <Input
              type="number"
              value={formData.rentalPerMonth || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  rentalPerMonth: Number(e.target.value),
                }))
              }
              placeholder="0"
              className="border-input-border focus:border-input-focus"
            />
          </div>

          {!editProperty && (
            <MediaUpload
              media={formData.media || []}
              onChange={(media) => setFormData((prev) => ({ ...prev, media }))}
              propertyId={editProperty?.id}
              onPreUploadedMedia={(items) => {
                console.log(
                  "🎥 [PROPERTY FORM] onPreUploadedMedia callback triggered:",
                  {
                    itemsCount: items.length,
                    items: items,
                  }
                );

                // Cache pre-uploaded media so they can be attached after creation
                setSelectedFiles([]); // files are already uploaded/prepared
                (window as any).__preUploadedMedia = items;

                console.log(
                  "🎥 [PROPERTY FORM] Stored pre-uploaded media in window:",
                  {
                    storedCount: (window as any).__preUploadedMedia?.length,
                    storedItems: (window as any).__preUploadedMedia,
                  }
                );
              }}
            />
          )}

          {editProperty && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Media</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfo(!showInfo)}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  Info
                </Button>
              </div>

              <input
                id="media-upload-edit"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              {loadingMedia ? (
                <div className="text-sm text-muted-foreground">
                  Loading media…
                </div>
              ) : mediaItems && mediaItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaItems.map((mediaItem, index) => (
                    <div
                      key={mediaItem.id}
                      className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                    >
                      {mediaItem.type === "video" ? (
                        <VideoPlaceholder className="w-full h-full" />
                      ) : (
                        <LazyMedia
                          src={mediaItem.url || ""}
                          thumbnailSrc={mediaItem.thumbnailUrl}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full"
                          showFullSize={true}
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => handleRemoveMediaItem(mediaItem.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {mediaItems.length < 10 && (
                    <div
                      className="aspect-square bg-muted rounded-lg border-2 border-dashed border-card-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                      onClick={() =>
                        document.getElementById("media-upload-edit")?.click()
                      }
                    >
                      <div className="text-center">
                        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                        <span className="text-xs text-muted-foreground">
                          Add Media
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-card-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() =>
                    document.getElementById("media-upload-edit")?.click()
                  }
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click here to upload photos and videos
                  </p>
                </div>
              )}
            </div>
          )}

          <MediaInfoPopup
            isOpen={showInfo}
            onClose={() => setShowInfo(false)}
          />

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner/Broker Name</Label>
            <Input
              value={formData.ownerName || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
              }
              placeholder="Enter owner name"
              className="border-input-border focus:border-input-focus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerContact">Owner/Broker Contact</Label>
            <Input
              value={formData.ownerContact || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ownerContact: e.target.value,
                }))
              }
              placeholder="Phone number or email"
              className="border-input-border focus:border-input-focus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setFormData((prev) => ({ ...prev, notes: value }));
                }
              }}
              placeholder="Additional notes... (max 500 characters)"
              rows={3}
              maxLength={500}
              className="border-input-border focus:border-input-focus resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {(formData.notes || "").length}/500 characters
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  {editProperty ? "Updating..." : "Adding..."}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editProperty ? "Update" : "Add"} Property
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
