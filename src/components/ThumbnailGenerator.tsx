import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/types/property";
import { backgroundThumbnailService } from "@/lib/background-thumbnail-service";
import { useAuth } from "@/hooks/useAuth";
import { Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ThumbnailGeneratorProps {
  properties: Property[];
  onPropertiesUpdate: (updatedProperties: Property[]) => void;
}

interface GenerationProgress {
  propertyId: string;
  totalImages: number;
  completedImages: number;
  status: "pending" | "in-progress" | "completed" | "error";
  error?: string;
}

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({
  properties,
  onPropertiesUpdate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<Map<string, GenerationProgress>>(
    new Map()
  );
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Filter properties that need thumbnails
  const propertiesNeedingThumbnails = properties.filter(
    (property) =>
      property.images &&
      property.images.length > 0 &&
      (!property.thumbnail_urls || property.thumbnail_urls.length === 0)
  );

  useEffect(() => {
    setTotalCount(propertiesNeedingThumbnails.length);
  }, [propertiesNeedingThumbnails.length]);

  const handleProgressUpdate = (progressUpdate: GenerationProgress) => {
    setProgress((prev) => {
      const newProgress = new Map(prev);
      newProgress.set(progressUpdate.propertyId, progressUpdate);
      return newProgress;
    });

    if (progressUpdate.status === "completed") {
      setCompletedCount((prev) => prev + 1);
    }
  };

  const startGeneration = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate thumbnails.",
        variant: "destructive",
      });
      return;
    }

    if (propertiesNeedingThumbnails.length === 0) {
      toast({
        title: "No thumbnails needed",
        description: "All properties already have thumbnails.",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setCompletedCount(0);
      setProgress(new Map());

      console.log(
        `Starting thumbnail generation for ${propertiesNeedingThumbnails.length} properties`
      );

      // Start background generation
      await backgroundThumbnailService.startThumbnailGeneration(user.id);

      // Monitor progress
      const progressInterval = setInterval(() => {
        const allProgress = backgroundThumbnailService.getAllProgress();
        allProgress.forEach((prog) => {
          handleProgressUpdate(prog);
        });

        // Check if generation is complete
        if (!backgroundThumbnailService.isThumbnailGenerationRunning()) {
          clearInterval(progressInterval);
          setIsGenerating(false);

          toast({
            title: "Thumbnail generation complete",
            description: `Generated thumbnails for ${completedCount} properties.`,
          });

          // Refresh properties to get updated thumbnails
          // This would typically be handled by the parent component
          window.location.reload(); // Simple refresh for now
        }
      }, 1000);
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate thumbnails. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const getProgressPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  };

  const getStatusIcon = (status: GenerationProgress["status"]) => {
    switch (status) {
      case "pending":
        return <Image className="h-4 w-4 text-muted-foreground" />;
      case "in-progress":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: GenerationProgress["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "Generating...";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  if (propertiesNeedingThumbnails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">All Thumbnails Generated</h3>
        <p>All properties already have thumbnails generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Generate Thumbnails</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate thumbnails for {propertiesNeedingThumbnails.length}{" "}
          properties to improve loading performance.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>
            {completedCount}/{totalCount} properties
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          {getProgressPercentage()}% complete
        </div>
      </div>

      {/* Individual Property Progress */}
      {progress.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Property Progress</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Array.from(progress.entries()).map(([propertyId, prog]) => {
              const property = properties.find((p) => p.id === propertyId);
              return (
                <div
                  key={propertyId}
                  className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getStatusIcon(prog.status)}
                    <span className="truncate">
                      {property?.type || "Property"} - {prog.completedImages}/
                      {prog.totalImages} images
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {getStatusText(prog.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={startGeneration}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Thumbnails...
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              Generate Thumbnails
            </>
          )}
        </Button>
      </div>

      {/* Benefits */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Benefits of thumbnails:</strong>
        </p>
        <p>• 80-90% faster image loading</p>
        <p>• Reduced bandwidth usage</p>
        <p>• Better user experience</p>
        <p>• Lower storage costs</p>
      </div>
    </div>
  );
};

