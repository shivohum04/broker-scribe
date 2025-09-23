import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_DURATION = 30; // 30 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second base delay

// File validation types
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
}

// File validation functions
export const validateFile = (file: File): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size (${formatFileSize(
        file.size
      )}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    );
  }

  // Check file type
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    errors.push("Only image and video files are allowed");
  }

  // Additional video checks
  if (isVideo) {
    if (file.size > 20 * 1024 * 1024) {
      // 20MB warning for videos
      warnings.push("Large video file detected. Upload may take longer.");
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join("; ") : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// Get video metadata
export const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Validate video duration
export const validateVideoDuration = async (
  file: File
): Promise<FileValidationResult> => {
  try {
    const metadata = await getVideoMetadata(file);

    if (metadata.duration > MAX_VIDEO_DURATION) {
      return {
        isValid: false,
        error: `Video duration (${Math.round(
          metadata.duration
        )}s) exceeds maximum allowed duration of ${MAX_VIDEO_DURATION} seconds`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Failed to validate video duration",
    };
  }
};

// Compress image
export const compressImage = async (file: File): Promise<File> => {
  try {
    const options = {
      maxSizeMB: 2, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);

    console.log("Image compressed:", {
      original: formatFileSize(file.size),
      compressed: formatFileSize(compressedFile.size),
      reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`,
    });

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return original file if compression fails
    return file;
  }
};

// Compress video using FFmpeg.wasm
export const compressVideo = async (file: File): Promise<File> => {
  try {
    const ffmpeg = new FFmpeg();

    // Load FFmpeg
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    const inputName = "input.mp4";
    const outputName = "output.mp4";

    // Write input file
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Compress video
    await ffmpeg.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-crf",
      "28", // Quality setting (lower = better quality, higher = smaller file)
      "-preset",
      "fast",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease", // Scale to max 720p
      outputName,
    ]);

    // Read output file
    const data = await ffmpeg.readFile(outputName);
    const compressedBlob = new Blob([data], { type: "video/mp4" });

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const compressedFile = new File([compressedBlob], file.name, {
      type: "video/mp4",
    });

    console.log("Video compressed:", {
      original: formatFileSize(file.size),
      compressed: formatFileSize(compressedFile.size),
      reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`,
    });

    return compressedFile;
  } catch (error) {
    console.error("Video compression failed:", error);
    // Return original file if compression fails
    return file;
  }
};

// Process file (compress if needed)
export const processFile = async (file: File): Promise<File> => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (isImage) {
    return await compressImage(file);
  } else if (isVideo) {
    // Only compress video if it's larger than 10MB
    if (file.size > 10 * 1024 * 1024) {
      return await compressVideo(file);
    }
  }

  return file;
};

// Retry logic with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = RETRY_DELAY_BASE
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `Upload attempt ${attempt} failed, retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv", "m4v"];
  const extension = getFileExtension(filename);
  return videoExtensions.includes(extension);
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

// Error logging
export const logUploadError = (
  error: any,
  context: Record<string, any> = {}
) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      name: error?.name,
      status: error?.status,
      details: error?.details,
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.error("Upload Error:", errorInfo);

  // In a real app, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or your own logging endpoint
  if (typeof window !== "undefined" && (window as any).lovable?.log) {
    (window as any).lovable.log("upload_error", errorInfo);
  }
};
