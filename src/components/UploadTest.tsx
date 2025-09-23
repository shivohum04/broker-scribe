import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaUpload } from "./MediaUpload";
import {
  formatFileSize,
  MAX_FILE_SIZE,
  MAX_VIDEO_DURATION,
} from "@/lib/upload-utils";

export const UploadTest: React.FC = () => {
  const [media, setMedia] = useState<string[]>([]);

  const createTestFile = (
    type: "image" | "video",
    size: number,
    name: string
  ): File => {
    const blob = new Blob(["test content"], {
      type: type === "image" ? "image/jpeg" : "video/mp4",
    });
    // Create a file with the specified size by padding with zeros
    const padding = new Array(size).fill(0).join("");
    const fullBlob = new Blob([blob, padding], {
      type: type === "image" ? "image/jpeg" : "video/mp4",
    });
    return new File([fullBlob], name, {
      type: type === "image" ? "image/jpeg" : "video/mp4",
    });
  };

  const testLargeFile = () => {
    const largeFile = createTestFile(
      "image",
      MAX_FILE_SIZE + 1024 * 1024,
      "large-image.jpg"
    );
    console.log("Created test large file:", {
      name: largeFile.name,
      size: formatFileSize(largeFile.size),
      type: largeFile.type,
    });
  };

  const testValidFile = () => {
    const validFile = createTestFile("image", 1024 * 1024, "valid-image.jpg");
    console.log("Created test valid file:", {
      name: validFile.name,
      size: formatFileSize(validFile.size),
      type: validFile.type,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Upload Test</CardTitle>
          <CardDescription>
            Test the improved media upload functionality with various file types
            and sizes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={testLargeFile} variant="outline">
              Test Large File ({formatFileSize(MAX_FILE_SIZE + 1024 * 1024)})
            </Button>
            <Button onClick={testValidFile} variant="outline">
              Test Valid File (1MB)
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Upload Limits</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</li>
              <li>• Maximum video duration: {MAX_VIDEO_DURATION} seconds</li>
              <li>• Supported formats: JPG, PNG, GIF, WebP, MP4, WebM, MOV</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Upload Component</CardTitle>
          <CardDescription>
            The improved MediaUpload component with validation, compression, and
            error handling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaUpload media={media} onChange={setMedia} maxFiles={5} />
        </CardContent>
      </Card>

      {media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Media ({media.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {media.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded"
                >
                  <span className="text-sm font-mono">{index + 1}.</span>
                  <span className="text-sm truncate flex-1">{url}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
