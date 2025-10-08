import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { MediaInfoPopup } from "./MediaInfoPopup";
import { useAuth } from "@/hooks/useAuth";
import { propertyService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  validateFile,
  validateVideoSize,
  formatFileSize,
  logUploadError,
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_VIDEOS_PER_PROPERTY,
} from "@/lib/upload-utils";
import { LazyMedia } from "./LazyMedia";
import { localVideoStorage } from "@/lib/media-local";
import { MediaItem } from "@/types/property";
import {
  uploadMediaFile,
  getMediaUrls,
  getVideoPlaceholder,
  hasImages,
} from "@/lib/unified-media-utils";

interface MediaUploadProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxFiles?: number;
  propertyId?: string; // Required for hybrid storage
  onPreUploadedMedia?: (items: MediaItem[]) => void; // Callback to report pre-uploaded media when no propertyId
}

export const MediaUpload = ({
  media,
  onChange,
  maxFiles = 10,
  propertyId,
  onPreUploadedMedia,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, "pending" | "processing" | "uploading" | "success" | "error">
  >({});
  const [showInfo, setShowInfo] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !user) return;

    const remainingSlots = maxFiles - media.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload up to ${maxFiles} files per property.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedMedia: MediaItem[] = [];
    const failedUploads: string[] = [];

    // Initialize upload status for all files
    const initialStatus: Record<
      string,
      "pending" | "processing" | "uploading" | "success" | "error"
    > = {};
    filesToUpload.forEach((file) => {
      initialStatus[file.name] = "pending";
    });
    setUploadStatus(initialStatus);

    try {
      // Check if we have any images to determine if this is the first image
      const hasExistingImages = hasImages(media);

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileId = file.name;

        try {
          // Step 1: Validate file
          setUploadStatus((prev) => ({ ...prev, [fileId]: "processing" }));

          const validation = await validateFile(file);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // Step 2: Validate video size and limits if it's a video
          if (file.type.startsWith("video/")) {
            const videoValidation = await validateVideoSize(file);
            if (!videoValidation.isValid) {
              throw new Error(videoValidation.error);
            }

            // Check video count limit (only 1 video allowed)
            const currentVideoCount = media.filter(
              (m) => m.type === "video"
            ).length;
            if (currentVideoCount >= MAX_VIDEOS_PER_PROPERTY) {
              throw new Error(
                `Only ${MAX_VIDEOS_PER_PROPERTY} video allowed per property`
              );
            }
          }

          setUploadProgress((prev) => ({ ...prev, [fileId]: 25 }));

          // Step 3: Upload file
          setUploadStatus((prev) => ({ ...prev, [fileId]: "uploading" }));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }));

          // Determine if this is the first image
          const isFirstImage =
            !hasExistingImages && file.type.startsWith("image/") && i === 0;

          const result = await uploadMediaFile(
            file,
            propertyId || "temp",
            user.id,
            isFirstImage
          );

          if (result.success && result.mediaItem) {
            uploadedMedia.push(result.mediaItem);
            setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
            setUploadStatus((prev) => ({ ...prev, [fileId]: "success" }));
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          logUploadError(error, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });

          setUploadStatus((prev) => ({ ...prev, [fileId]: "error" }));
          failedUploads.push(file.name);

          toast({
            title: `Upload failed: ${file.name}`,
            description:
              error instanceof Error
                ? error.message
                : "Failed to upload file. Please try again.",
            variant: "destructive",
          });
        }
      }

      // Update media list with successful uploads
      if (uploadedMedia.length > 0) {
        const newMedia = [...media, ...uploadedMedia];
        onChange(newMedia);

        // If no propertyId, we're in creation mode - report pre-uploaded media
        if (!propertyId && onPreUploadedMedia) {
          onPreUploadedMedia(uploadedMedia);
        }

        toast({
          title: "Upload completed",
          description: `${uploadedMedia.length} file(s) uploaded successfully${
            failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ""
          }.`,
          variant: failedUploads.length > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      console.error("Upload process failed:", error);
      logUploadError(error, { totalFiles: filesToUpload.length });

      toast({
        title: "Upload process failed",
        description:
          "An unexpected error occurred during upload. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({});
      setUploadStatus({});
      event.target.value = "";
    }
  };

  const removeMedia = async (index: number) => {
    try {
      const mediaToRemove = media[index];

      // Handle local video cleanup
      if (mediaToRemove.type === "video" && mediaToRemove.localKey) {
        await localVideoStorage.removeLocalVideo(mediaToRemove.localKey);
      }

      // Update local state
      const newMedia = media.filter((_, i) => i !== index);
      onChange(newMedia);

      toast({
        title: "Media removed",
        description: "Media has been removed from the property.",
      });
    } catch (error) {
      console.error("Failed to remove media:", error);
      toast({
        title: "Remove failed",
        description:
          error instanceof Error ? error.message : "Failed to remove media.",
        variant: "destructive",
      });
    }
  };

  const isVideoUrl = (url: string) => {
    return (
      url.includes(".mp4") ||
      url.includes(".webm") ||
      url.includes(".mov") ||
      url.startsWith("local-video-")
    );
  };

  const isLocalVideo = (url: string) => {
    return url.startsWith("local-video-");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Property Media ({media.length}/{maxFiles})
        </label>
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
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload Progress Indicator */}
      {Object.keys(uploadStatus).length > 0 && (
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium">Upload Progress</h4>
          {Object.entries(uploadStatus).map(([fileName, status]) => (
            <div key={fileName} className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {status === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {status === "error" && (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                {(status === "processing" || status === "uploading") && (
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                )}
                <span className="truncate">{fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                {uploadProgress[fileName] && (
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[fileName]}%` }}
                    />
                  </div>
                )}
                <span className="text-xs text-muted-foreground capitalize">
                  {status === "processing" && "Processing..."}
                  {status === "uploading" && "Uploading..."}
                  {status === "success" && "Complete"}
                  {status === "error" && "Failed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((mediaItem, index) => (
            <div key={mediaItem.id} className="relative group">
              {mediaItem.type === "video" ? (
                <div className="w-full h-24 rounded-lg border border-card-border bg-muted flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground ml-2">
                    Video
                  </span>
                </div>
              ) : (
                <LazyMedia
                  src={mediaItem.url || ""}
                  thumbnailSrc={mediaItem.thumbnailUrl}
                  alt={`Property media ${index + 1}`}
                  className="w-full h-24 rounded-lg border border-card-border"
                  showFullSize={true}
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {mediaItem.isCover && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                  Cover
                </div>
              )}
            </div>
          ))}
          {media.length < maxFiles && (
            <div
              className="aspect-square bg-muted rounded-lg border-2 border-dashed border-card-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => document.getElementById("media-upload")?.click()}
            >
              <div className="text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <span className="text-xs text-muted-foreground">Add Media</span>
              </div>
            </div>
          )}
        </div>
      )}

      {media.length === 0 && (
        <div
          className="border-2 border-dashed border-card-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => document.getElementById("media-upload")?.click()}
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

      <MediaInfoPopup isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
};
