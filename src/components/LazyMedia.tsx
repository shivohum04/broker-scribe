import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Image as ImageIcon, AlertTriangle } from "lucide-react";
import {
  getThumbnailUrl,
  getPlaceholderImage,
  getMediaType,
  checkThumbnailExists,
} from "@/lib/thumbnail-utils";

interface LazyImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  loading?: "lazy" | "eager";
  showFullSize?: boolean;
}

interface LazyVideoProps {
  src: string;
  thumbnailSrc?: string;
  className?: string;
  onClick?: () => void;
  loading?: "lazy" | "eager";
  showFullSize?: boolean;
}

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

// Lazy Image Component
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  thumbnailSrc,
  alt,
  className = "",
  onClick,
  loading = "lazy",
  showFullSize = false,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === "eager");

  const loadImage = useCallback(async () => {
    if (!src) return;

    try {
      // If we have a thumbnail and not showing full size, use thumbnail
      if (thumbnailSrc && !showFullSize) {
        const thumbnailExists = await checkThumbnailExists(thumbnailSrc);
        if (thumbnailExists) {
          setImageSrc(thumbnailSrc);
          return;
        }
      }

      // Fallback to original image or placeholder
      setImageSrc(src);
    } catch (error) {
      console.warn("Failed to load image:", error);
      setImageSrc(getPlaceholderImage("image"));
      setHasError(true);
    }
  }, [src, thumbnailSrc, showFullSize]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setImageSrc(getPlaceholderImage("image"));
  };

  const targetRef = useIntersectionObserver(() => {
    setIsInView(true);
  });

  useEffect(() => {
    if (isInView) {
      loadImage();
    }
  }, [isInView, loadImage]);

  return (
    <div
      ref={targetRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
    >
      {!isInView ? (
        // Placeholder while not in view
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : (
        <>
          {!isLoaded && !hasError && (
            // Loading state
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {hasError && (
            // Error state
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          )}

          <img
            src={imageSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

// Lazy Video Component
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  thumbnailSrc,
  className = "",
  onClick,
  loading = "lazy",
  showFullSize = false,
}) => {
  const [showVideo, setShowVideo] = useState(false);
  const [thumbnailImageSrc, setThumbnailImageSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === "eager");

  const loadThumbnail = useCallback(async () => {
    if (!src) return;

    try {
      // If we have a thumbnail, use it
      if (thumbnailSrc) {
        const thumbnailExists = await checkThumbnailExists(thumbnailSrc);
        if (thumbnailExists) {
          setThumbnailImageSrc(thumbnailSrc);
          return;
        }
      }

      // Fallback to placeholder
      setThumbnailImageSrc(getPlaceholderImage("video"));
    } catch (error) {
      console.warn("Failed to load video thumbnail:", error);
      setThumbnailImageSrc(getPlaceholderImage("video"));
      setHasError(true);
    }
  }, [src, thumbnailSrc]);

  const handleThumbnailLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleThumbnailError = () => {
    setHasError(true);
    setThumbnailImageSrc(getPlaceholderImage("video"));
  };

  const handlePlayClick = () => {
    setShowVideo(true);
    if (onClick) {
      onClick();
    }
  };

  const targetRef = useIntersectionObserver(() => {
    setIsInView(true);
  });

  useEffect(() => {
    if (isInView && !showVideo) {
      loadThumbnail();
    }
  }, [isInView, showVideo, loadThumbnail]);

  return (
    <div ref={targetRef} className={`relative overflow-hidden ${className}`}>
      {!isInView ? (
        // Placeholder while not in view
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
      ) : showVideo ? (
        // Video player
        <video
          src={src}
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          playsInline
        />
      ) : (
        // Thumbnail with play button
        <>
          {!isLoaded && !hasError && (
            // Loading state
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {hasError && (
            // Error state
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          )}

          <img
            src={thumbnailImageSrc}
            alt="Video thumbnail"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleThumbnailLoad}
            onError={handleThumbnailError}
            loading={loading}
          />

          {/* Play button overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-200 cursor-pointer"
            onClick={handlePlayClick}
          >
            <div className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all duration-200">
              <Play className="h-6 w-6 text-black fill-black" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main Lazy Media Component that automatically detects type
interface LazyMediaProps {
  src: string;
  thumbnailSrc?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  loading?: "lazy" | "eager";
  showFullSize?: boolean;
}

export const LazyMedia: React.FC<LazyMediaProps> = ({
  src,
  thumbnailSrc,
  alt = "",
  className = "",
  onClick,
  loading = "lazy",
  showFullSize = false,
}) => {
  const mediaType = getMediaType(src);

  if (mediaType === "video") {
    return (
      <LazyVideo
        src={src}
        thumbnailSrc={thumbnailSrc}
        className={className}
        onClick={onClick}
        loading={loading}
        showFullSize={showFullSize}
      />
    );
  } else {
    return (
      <LazyImage
        src={src}
        thumbnailSrc={thumbnailSrc}
        alt={alt}
        className={className}
        onClick={onClick}
        loading={loading}
        showFullSize={showFullSize}
      />
    );
  }
};

// Hook for managing media loading states
export const useLazyMedia = (src: string, thumbnailSrc?: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");

  const loadMedia = useCallback(async () => {
    if (!src) return;

    try {
      // Try thumbnail first
      if (thumbnailSrc) {
        const thumbnailExists = await checkThumbnailExists(thumbnailSrc);
        if (thumbnailExists) {
          setCurrentSrc(thumbnailSrc);
          return;
        }
      }

      // Fallback to original
      setCurrentSrc(src);
    } catch (error) {
      console.warn("Failed to load media:", error);
      setHasError(true);
      const mediaType = getMediaType(src);
      setCurrentSrc(getPlaceholderImage(mediaType === "unknown" ? "image" : mediaType));
    }
  }, [src, thumbnailSrc]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return {
    src: currentSrc,
    isLoaded,
    hasError,
    loadMedia,
  };
};
