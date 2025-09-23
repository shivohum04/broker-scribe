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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { propertyService } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  validateFile,
  validateVideoDuration,
  processFile,
  formatFileSize,
  logUploadError,
  MAX_FILE_SIZE,
  MAX_VIDEO_DURATION,
} from "@/lib/upload-utils";
import { LazyMedia } from "./LazyMedia";

interface MediaUploadProps {
  media: string[];
  onChange: (media: string[]) => void;
  maxFiles?: number;
}

export const MediaUpload = ({
  media,
  onChange,
  maxFiles = 10,
}: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, "pending" | "processing" | "uploading" | "success" | "error">
  >({});
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
    const uploadedUrls: string[] = [];
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
      for (const file of filesToUpload) {
        const fileId = file.name;

        try {
          // Step 1: Validate file
          setUploadStatus((prev) => ({ ...prev, [fileId]: "processing" }));

          const validation = validateFile(file);
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // Step 2: Validate video duration if it's a video
          if (file.type.startsWith("video/")) {
            const videoValidation = await validateVideoDuration(file);
            if (!videoValidation.isValid) {
              throw new Error(videoValidation.error);
            }
          }

          // Step 3: Process file (compress if needed)
          setUploadProgress((prev) => ({ ...prev, [fileId]: 25 }));
          const processedFile = await processFile(file);

          // Step 4: Upload file
          setUploadStatus((prev) => ({ ...prev, [fileId]: "uploading" }));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 50 }));

          const result = await propertyService.uploadMedia(
            processedFile,
            user.id
          );
          uploadedUrls.push(result.url);

          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
          setUploadStatus((prev) => ({ ...prev, [fileId]: "success" }));
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
      if (uploadedUrls.length > 0) {
        onChange([...media, ...uploadedUrls]);

        toast({
          title: "Upload completed",
          description: `${uploadedUrls.length} file(s) uploaded successfully${
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

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    onChange(newMedia);
  };

  const isVideoUrl = (url: string) => {
    return (
      url.includes(".mp4") || url.includes(".webm") || url.includes(".mov")
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Property Media ({media.length}/{maxFiles})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("media-upload")?.click()}
          disabled={uploading || media.length >= maxFiles}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Add Media
            </>
          )}
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
          {media.map((url, index) => (
            <div key={index} className="relative group">
              <LazyMedia
                src={url}
                alt={`Property media ${index + 1}`}
                className="w-full h-24 rounded-lg border border-card-border"
                showFullSize={true}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center">
          <div className="flex justify-center gap-2 mb-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            No media uploaded yet. Click "Add Media" to upload photos and
            videos.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
            <p>• Maximum video duration: {MAX_VIDEO_DURATION} seconds</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP, MP4, WebM, MOV</p>
          </div>
        </div>
      )}
    </div>
  );
};
