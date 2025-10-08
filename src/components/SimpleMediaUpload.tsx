import React, { useState, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  validateMediaFile,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
} from "@/lib/media-compression";

interface MediaFile {
  id: string;
  file: File;
  type: "image" | "video";
  preview: string;
  isCover: boolean;
}

interface SimpleMediaUploadProps {
  onMediaChange: (media: MediaFile[]) => void;
  maxImages?: number;
  maxVideos?: number;
}

export const SimpleMediaUpload: React.FC<SimpleMediaUploadProps> = ({
  onMediaChange,
  maxImages = 9,
  maxVideos = 1,
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles: MediaFile[] = [];
      const currentImages = mediaFiles.filter((m) => m.type === "image").length;
      const currentVideos = mediaFiles.filter((m) => m.type === "video").length;

      Array.from(selectedFiles).forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (isImage && currentImages >= maxImages) {
          toast({
            title: "Image limit reached",
            description: `Maximum ${maxImages} images allowed.`,
            variant: "destructive",
          });
          return;
        }

        if (isVideo && currentVideos >= maxVideos) {
          toast({
            title: "Video limit reached",
            description: `Maximum ${maxVideos} video allowed.`,
            variant: "destructive",
          });
          return;
        }

        // Validate file type and format
        const validation = validateMediaFile(file);
        if (!validation.valid) {
          toast({
            title: "Invalid file type",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: isImage ? "image" : "video",
          preview: URL.createObjectURL(file),
          isCover: mediaFiles.length === 0 && isImage, // First image becomes cover
        };

        newFiles.push(mediaFile);
      });

      if (newFiles.length > 0) {
        const updatedFiles = [...mediaFiles, ...newFiles];
        setMediaFiles(updatedFiles);
        onMediaChange(updatedFiles);
      }
    },
    [mediaFiles, maxImages, maxVideos, onMediaChange, toast]
  );

  const removeMedia = useCallback(
    (id: string) => {
      const updatedFiles = mediaFiles.filter((file) => file.id !== id);

      // If we removed the cover image, make the first remaining image the cover
      const removedFile = mediaFiles.find((f) => f.id === id);
      if (removedFile?.isCover && updatedFiles.length > 0) {
        const firstImage = updatedFiles.find((f) => f.type === "image");
        if (firstImage) {
          firstImage.isCover = true;
        }
      }

      setMediaFiles(updatedFiles);
      onMediaChange(updatedFiles);
    },
    [mediaFiles, onMediaChange]
  );

  const setAsCover = useCallback(
    (id: string) => {
      const updatedFiles = mediaFiles.map((file) => ({
        ...file,
        isCover: file.id === id,
      }));

      setMediaFiles(updatedFiles);
      onMediaChange(updatedFiles);
    },
    [mediaFiles, onMediaChange]
  );

  const getFileSize = (file: File): string => {
    const sizeInMB = file.size / (1024 * 1024);
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          const duration = video.duration;
          const minutes = Math.floor(duration / 60);
          const seconds = Math.floor(duration % 60);
          resolve(`${minutes}:${seconds.toString().padStart(2, "0")}`);
          URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
      } else {
        resolve("");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.mp4,.avi,.mov,.wmv,.webm,.mkv"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="media-upload"
        />
        <label htmlFor="media-upload" className="cursor-pointer block">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-1">
            Click to select images or videos
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxImages} images, {maxVideos} video • Supported: JPEG, PNG,
            WebP, GIF, BMP, MP4, AVI, MOV, WMV, WebM, MKV
          </p>
        </label>
      </div>

      {/* Media Grid */}
      {mediaFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Media ({mediaFiles.length}/10)
            </h4>
            <div className="text-xs text-muted-foreground">
              {mediaFiles.filter((m) => m.type === "image").length} images,{" "}
              {mediaFiles.filter((m) => m.type === "video").length} video
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaFiles.map((media) => (
              <div
                key={media.id}
                className="relative group aspect-square bg-muted rounded-lg overflow-hidden"
              >
                {/* Media Preview */}
                {media.type === "image" ? (
                  <img
                    src={media.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={media.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}

                {/* Cover Badge */}
                {media.isCover && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Cover
                  </div>
                )}

                {/* Media Type Icon */}
                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded">
                  {media.type === "image" ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <Video className="h-3 w-3" />
                  )}
                </div>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1">
                  <div className="truncate">{media.file.name}</div>
                  <div>{getFileSize(media.file)}</div>
                </div>

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-1">
                  {/* Make Cover Button (images only) */}
                  {media.type === "image" && !media.isCover && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsCover(media.id);
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Cover
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(media.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Upload Guidelines:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>First image automatically becomes cover image</li>
          <li>Click "Cover" button on any image to change cover</li>
          <li>All media will be compressed before storage</li>
          <li>Images: WebP format, max 1280px width, ~150KB</li>
          <li>Videos: MP4 format, max 3min, 480p, ~2-3MB</li>
        </ul>
      </div>
    </div>
  );
};
