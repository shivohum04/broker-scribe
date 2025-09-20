import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: string[];
  startIndex: number;
}

export const MediaViewer = ({ isOpen, onClose, media }: MediaViewerProps) => {
  if (!isOpen || media.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
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
            {media.map((url, index) => (
              <div key={index} className="flex justify-center">
                {isVideoUrl(url) ? (
                  <div className="relative max-w-full">
                    <video
                      src={url}
                      controls
                      className="max-w-full rounded-lg shadow-lg"
                      style={{ maxHeight: '70vh' }}
                    />
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Property media ${index + 1}`}
                    className="max-w-full rounded-lg shadow-lg"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
