import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/types/property";
import { getMediaType } from "@/lib/thumbnail-utils";
import { useState, useEffect } from "react";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  startIndex: number;
}

export const MediaViewer = ({
  isOpen,
  onClose,
  media,
  startIndex,
}: MediaViewerProps) => {
  if (!isOpen || media.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const getMediaUrl = async (mediaItem: MediaItem): Promise<string | null> => {
    if (mediaItem.type === "image" && mediaItem.url) {
      return mediaItem.url;
    } else if (mediaItem.type === "video" && mediaItem.localKey) {
      try {
        const { localVideoStorage } = await import("@/lib/media-local");
        return await localVideoStorage.getLocalVideoUrl(mediaItem.localKey);
      } catch (error) {
        console.error("Failed to get video URL:", error);
        return null;
      }
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
        {/* Close Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Scrollable Media List */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto py-8 px-4">
          <div className="space-y-4">
            {media.map((mediaItem, index) => (
              <MediaItemViewer
                key={mediaItem.id}
                mediaItem={mediaItem}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to handle individual media items
const MediaItemViewer = ({
  mediaItem,
  index,
}: {
  mediaItem: MediaItem;
  index: number;
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        if (mediaItem.type === "image" && mediaItem.url) {
          setMediaUrl(mediaItem.url);
        } else if (mediaItem.type === "video") {
          if (mediaItem.storageType === "cloud" && mediaItem.url) {
            // Cloud video - use URL directly
            setMediaUrl(mediaItem.url);
          } else if (mediaItem.storageType === "local" && mediaItem.localKey) {
            // Local video - legacy support
            const { localVideoStorage } = await import("@/lib/media-local");
            const url = await localVideoStorage.getLocalVideoUrl(
              mediaItem.localKey
            );
            if (url) {
              setMediaUrl(url);
            } else {
              console.warn(
                `⚠️ [MEDIA VIEWER] Failed to load video for key: ${mediaItem.localKey}`
              );
              // Try to reload the video data
              const blob = await localVideoStorage.getLocalVideoBlob(
                mediaItem.localKey
              );
              if (blob) {
                const newUrl = URL.createObjectURL(blob);
                setMediaUrl(newUrl);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load media:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [mediaItem]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!mediaUrl) {
    return (
      <div className="flex justify-center">
        <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-lg mb-2">📹</div>
            <div className="text-sm">
              {mediaItem.type === "video"
                ? "Video not available (may have been lost from local storage)"
                : "Failed to load media"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {mediaItem.type === "video" ? (
        <div className="relative max-w-full">
          <video
            src={mediaUrl}
            controls
            className="max-w-full rounded-lg shadow-lg"
            style={{ maxHeight: "70vh" }}
          />
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={`Property media ${index + 1}`}
          className="max-w-full rounded-lg shadow-lg"
        />
      )}
    </div>
  );
};
