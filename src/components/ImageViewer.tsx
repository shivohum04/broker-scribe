import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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
  startIndex,
}: ImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  if (!isOpen || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
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

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
          <img
            src={images[currentIndex]}
            alt={`Property image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-sm text-foreground">
              {currentIndex + 1} of {images.length}
            </p>
          </div>
        )}

        {/* Thumbnail Strip for mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-lg max-w-xs overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-80"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};