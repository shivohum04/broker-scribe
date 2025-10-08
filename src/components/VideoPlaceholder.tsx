import React from "react";
import { Play } from "lucide-react";

interface VideoPlaceholderProps {
  onClick?: () => void;
  className?: string;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  onClick,
  className = "",
}) => {
  return (
    <div
      className={`relative w-full h-24 rounded-lg border border-card-border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors ${className}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
          <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
        </div>
        <span className="text-xs font-medium">Video</span>
      </div>
    </div>
  );
};

