import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyMedia } from "./LazyMedia";
import {
  getThumbnailUrl,
  formatFileSize,
  estimateThumbnailSize,
} from "@/lib/thumbnail-utils";

interface PerformanceTestProps {
  properties: Array<{
    id: string;
    images: string[];
  }>;
}

export const PerformanceTest: React.FC<PerformanceTestProps> = ({
  properties,
}) => {
  const [bandwidthStats, setBandwidthStats] = useState({
    totalImages: 0,
    totalVideos: 0,
    originalSize: 0,
    thumbnailSize: 0,
    savings: 0,
    savingsPercentage: 0,
  });

  const [testResults, setTestResults] = useState<{
    thumbnailLoadTime: number;
    fullImageLoadTime: number;
    performanceGain: number;
  } | null>(null);

  // Calculate bandwidth statistics
  useEffect(() => {
    let totalImages = 0;
    let totalVideos = 0;
    let originalSize = 0;
    let thumbnailSize = 0;

    properties.forEach((property) => {
      if (property.images) {
        property.images.forEach((imageUrl) => {
          // Estimate original file sizes (this would normally come from metadata)
          const isVideo =
            imageUrl.includes(".mp4") ||
            imageUrl.includes(".webm") ||
            imageUrl.includes(".mov");

          if (isVideo) {
            totalVideos++;
            // Estimate 15MB average for 30-second videos
            originalSize += 15 * 1024 * 1024;
            thumbnailSize += estimateThumbnailSize(15 * 1024 * 1024, "video");
          } else {
            totalImages++;
            // Estimate 3MB average for images
            originalSize += 3 * 1024 * 1024;
            thumbnailSize += estimateThumbnailSize(3 * 1024 * 1024, "image");
          }
        });
      }
    });

    const savings = originalSize - thumbnailSize;
    const savingsPercentage =
      originalSize > 0 ? (savings / originalSize) * 100 : 0;

    setBandwidthStats({
      totalImages,
      totalVideos,
      originalSize,
      thumbnailSize,
      savings,
      savingsPercentage,
    });
  }, [properties]);

  const runPerformanceTest = async () => {
    const startTime = performance.now();

    // Simulate loading thumbnails
    const thumbnailPromises = properties
      .slice(0, 5)
      .map((property) =>
        property.images?.[0]
          ? fetch(getThumbnailUrl(property.images[0]), { method: "HEAD" })
          : Promise.resolve()
      );

    await Promise.all(thumbnailPromises);
    const thumbnailLoadTime = performance.now() - startTime;

    // Simulate loading full images
    const fullImageStartTime = performance.now();
    const fullImagePromises = properties
      .slice(0, 5)
      .map((property) =>
        property.images?.[0]
          ? fetch(property.images[0], { method: "HEAD" })
          : Promise.resolve()
      );

    await Promise.all(fullImagePromises);
    const fullImageLoadTime = performance.now() - fullImageStartTime;

    const performanceGain =
      ((fullImageLoadTime - thumbnailLoadTime) / fullImageLoadTime) * 100;

    setTestResults({
      thumbnailLoadTime,
      fullImageLoadTime,
      performanceGain,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lazy Loading Performance Analysis</CardTitle>
          <CardDescription>
            Analysis of bandwidth savings and performance improvements with
            thumbnail-based lazy loading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {bandwidthStats.totalImages}
              </div>
              <div className="text-sm text-muted-foreground">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {bandwidthStats.totalVideos}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatFileSize(bandwidthStats.savings)}
              </div>
              <div className="text-sm text-muted-foreground">
                Bandwidth Saved
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {bandwidthStats.savingsPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Reduction</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Without Lazy Loading</h4>
              <div className="text-sm text-muted-foreground">
                Total size: {formatFileSize(bandwidthStats.originalSize)}
              </div>
              <div className="text-sm text-muted-foreground">
                All media loads immediately
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">With Lazy Loading</h4>
              <div className="text-sm text-muted-foreground">
                Thumbnail size: {formatFileSize(bandwidthStats.thumbnailSize)}
              </div>
              <div className="text-sm text-muted-foreground">
                Full media loads on demand
              </div>
            </div>
          </div>

          <Button onClick={runPerformanceTest} className="w-full">
            Run Performance Test
          </Button>

          {testResults && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Test Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Thumbnail Load Time</div>
                  <div className="text-muted-foreground">
                    {testResults.thumbnailLoadTime.toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <div className="font-medium">Full Image Load Time</div>
                  <div className="text-muted-foreground">
                    {testResults.fullImageLoadTime.toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <div className="font-medium">Performance Gain</div>
                  <div className="text-green-600 font-medium">
                    {testResults.performanceGain.toFixed(1)}% faster
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lazy Loading Demo</CardTitle>
          <CardDescription>
            Compare thumbnail loading vs full image loading behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                Thumbnail Loading
                <Badge variant="secondary">Optimized</Badge>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {properties.slice(0, 4).map((property, index) => (
                  <div key={property.id} className="aspect-square">
                    {property.images?.[0] ? (
                      <LazyMedia
                        src={property.images[0]}
                        thumbnailSrc={getThumbnailUrl(property.images[0])}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full rounded-lg border"
                        showFullSize={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-lg border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Only thumbnails load initially (~40KB each)
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                Full Image Loading
                <Badge variant="destructive">Heavy</Badge>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {properties.slice(0, 4).map((property, index) => (
                  <div key={property.id} className="aspect-square">
                    {property.images?.[0] ? (
                      <LazyMedia
                        src={property.images[0]}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full rounded-lg border"
                        showFullSize={true}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted rounded-lg border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Full images load immediately (~3MB each)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">
                Performance Improvements
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 70-80% reduction in initial page load</li>
                <li>• Faster property list rendering</li>
                <li>• Reduced mobile data usage</li>
                <li>• Better user experience on slow connections</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Technical Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic thumbnail generation</li>
                <li>• Intersection Observer for lazy loading</li>
                <li>• WebP format for optimal compression</li>
                <li>• Graceful fallbacks for missing thumbnails</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
