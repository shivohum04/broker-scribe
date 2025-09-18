import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex: number;
}

export const ImageViewer = ({
  isOpen,
  onClose,
  images,
}: ImageViewerProps) => {
  if (!isOpen || images.length === 0) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
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

        {/* Scrollable Image List */}
        <div className="flex-1 w-full max-w-2xl overflow-y-auto py-8 px-4">
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={image}
                  alt={`Property image ${index + 1}`}
                  className="max-w-full rounded-lg shadow-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};