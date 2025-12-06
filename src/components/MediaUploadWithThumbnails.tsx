import React, { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { propertyService } from "@/backend/properties/property.service";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadWithThumbnailsProps {
  onUploadComplete: (urls: string[], thumbnailUrls: string[]) => void;
  onClose: () => void;
  existingImages?: string[];
  existingThumbnails?: string[];
  propertyId?: string; // Required for hybrid storage
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "generating-thumbnail" | "completed" | "error";
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export const MediaUploadWithThumbnails: React.FC<
  MediaUploadWithThumbnailsProps
> = ({
  onUploadComplete,
  onClose,
  existingImages = [],
  existingThumbnails = [],
  propertyId,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/")
      );

      if (newFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please select image or video files only.",
          variant: "destructive",
        });
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [toast]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = useCallback(async () => {
    if (!user || files.length === 0 || !propertyId) return;

    setIsUploading(true);
    const progress: UploadProgress[] = files.map((file) => ({
      file,
      progress: 0,
      status: "uploading",
    }));
    setUploadProgress(progress);

    try {
      const allUrls: string[] = [...existingImages];
      const allThumbnailUrls: string[] = [...existingThumbnails];

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Update progress to uploading
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? { ...item, progress: 10, status: "uploading" }
                : item
            )
          );

          // Use hybrid storage strategy
          const result = await propertyService.addMediaToProperty(
            propertyId,
            file,
            user.id,
            existingImages.length === 0 && i === 0 // First image becomes cover
          );

          if (result.success) {
            // Get the property to get the updated media
            const property = await propertyService.getPropertyWithMedia(
              propertyId
            );
            if (property && property.media) {
              const newMedia = property.media.find(
                (m: any) => m.id === result.mediaId
              );
              if (newMedia) {
                if (newMedia.storageType === "cloud" && newMedia.url) {
                  allUrls.push(newMedia.url);
                } else if (newMedia.storageType === "local") {
                  allUrls.push(`local-video-${result.mediaId}`);
                }

                if (newMedia.thumbnailUrl) {
                  allThumbnailUrls.push(newMedia.thumbnailUrl);
                }
              }
            }

            // Update progress
            setUploadProgress((prev) =>
              prev.map((item, index) =>
                index === i
                  ? {
                      ...item,
                      progress: 100,
                      status: "completed",
                      url: allUrls[allUrls.length - 1],
                      thumbnailUrl:
                        allThumbnailUrls[allThumbnailUrls.length - 1],
                    }
                  : item
              )
            );
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          setUploadProgress((prev) =>
            prev.map((item, index) =>
              index === i
                ? {
                    ...item,
                    progress: 0,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : item
            )
          );
        }
      }

      // Call completion callback
      onUploadComplete(allUrls, allThumbnailUrls);

      toast({
        title: "Upload completed",
        description: `${files.length} files uploaded successfully.`,
      });
    } catch (error) {
      console.error("Upload process failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [
    user,
    files,
    existingImages,
    existingThumbnails,
    onUploadComplete,
    toast,
    propertyId,
  ]);

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse" />;
      case "generating-thumbnail":
        return <ImageIcon className="h-4 w-4 animate-spin" />;
      case "completed":
        return <ImageIcon className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: UploadProgress["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "generating-thumbnail":
        return "Generating thumbnail...";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Pending";
    }
  };

  return (
    <div className="space-y-4">
      {/* File Selection */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="media-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="media-upload"
          className={`cursor-pointer ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : "Click to select images or videos"}
          </p>
        </label>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusIcon(uploadProgress[index]?.status || "pending")}
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getStatusText(uploadProgress[index]?.status || "pending")}
                  </span>
                </div>
                {uploadProgress[index]?.status === "error" && (
                  <span className="text-xs text-red-500">
                    {uploadProgress[index]?.error}
                  </span>
                )}
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upload Progress</h4>
          {uploadProgress.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{item.file.name}</span>
                <span>{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || isUploading}
          className="gap-2"
        >
          {isUploading ? "Uploading..." : `Upload ${files.length} files`}
        </Button>
      </div>
    </div>
  );
};
