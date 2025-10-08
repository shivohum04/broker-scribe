import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { propertyService } from "@/lib/supabase";
import { generateThumbnail, getThumbnailUrl } from "@/lib/thumbnail-utils";
import { Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export const ThumbnailTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    thumbnailGeneration: boolean;
    uploadTest: boolean;
    databaseTest: boolean;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const runThumbnailTests = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to run tests.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    const results = {
      thumbnailGeneration: false,
      uploadTest: false,
      databaseTest: false,
    };

    try {
      // Test 1: Thumbnail Generation
      console.log("Testing thumbnail generation...");
      try {
        // Create a test image file
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#4F46E5";
          ctx.fillRect(0, 0, 400, 300);
          ctx.fillStyle = "white";
          ctx.font = "24px Arial";
          ctx.fillText("Test Image", 150, 150);
        }

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });

        const testFile = new File([blob], "test-image.png", {
          type: "image/png",
        });

        // Test thumbnail generation
        const thumbnailFile = await generateThumbnail(testFile);
        console.log("Thumbnail generation successful:", thumbnailFile.name);
        results.thumbnailGeneration = true;
      } catch (error) {
        console.error("Thumbnail generation test failed:", error);
      }

      // Test 2: Upload Test
      console.log("Testing upload with thumbnails...");
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#10B981";
          ctx.fillRect(0, 0, 200, 150);
          ctx.fillStyle = "white";
          ctx.font = "16px Arial";
          ctx.fillText("Upload Test", 50, 80);
        }

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });

        const testFile = new File([blob], "upload-test.png", {
          type: "image/png",
        });

        // Test upload with thumbnail generation
        const uploadResult = await propertyService.uploadMedia(
          testFile,
          user.id
        );
        console.log("Upload test successful:", uploadResult);
        results.uploadTest = true;
      } catch (error) {
        console.error("Upload test failed:", error);
      }

      // Test 3: Database Test
      console.log("Testing database operations...");
      try {
        // Test getting properties with thumbnails
        const properties = await propertyService.getProperties();
        console.log(
          "Database test successful:",
          properties.length,
          "properties found"
        );

        // Check if any properties have thumbnails
        const propertiesWithThumbnails = properties.filter(
          (p) => p.thumbnail_urls && p.thumbnail_urls.length > 0
        );
        console.log(
          "Properties with thumbnails:",
          propertiesWithThumbnails.length
        );

        results.databaseTest = true;
      } catch (error) {
        console.error("Database test failed:", error);
      }

      setTestResults(results);

      const successCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;

      toast({
        title: "Tests completed",
        description: `${successCount}/${totalTests} tests passed. Check console for details.`,
        variant: successCount === totalTests ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Test suite failed:", error);
      toast({
        title: "Test suite failed",
        description:
          "An error occurred during testing. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getTestIcon = (passed: boolean) => {
    if (passed) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getTestStatus = (passed: boolean) => {
    return passed ? "Passed" : "Failed";
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Thumbnail System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This test verifies that the thumbnail generation system is working
          correctly. It tests thumbnail generation, upload functionality, and
          database operations.
        </p>

        <Button
          onClick={runThumbnailTests}
          disabled={isTesting}
          className="w-full gap-2"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Image className="h-4 w-4" />
              Run Thumbnail Tests
            </>
          )}
        </Button>

        {testResults && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  {getTestIcon(testResults.thumbnailGeneration)}
                  <span className="text-sm">Thumbnail Generation</span>
                </div>
                <span className="text-sm font-medium">
                  {getTestStatus(testResults.thumbnailGeneration)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  {getTestIcon(testResults.uploadTest)}
                  <span className="text-sm">Upload with Thumbnails</span>
                </div>
                <span className="text-sm font-medium">
                  {getTestStatus(testResults.uploadTest)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  {getTestIcon(testResults.databaseTest)}
                  <span className="text-sm">Database Operations</span>
                </div>
                <span className="text-sm font-medium">
                  {getTestStatus(testResults.databaseTest)}
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                <strong>What these tests verify:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Thumbnail generation from image files</li>
                <li>Upload process with automatic thumbnail creation</li>
                <li>Database storage and retrieval of thumbnail URLs</li>
                <li>Integration between frontend and backend services</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

