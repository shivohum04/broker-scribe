import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (only for images)
export const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30MB max per video
export const MAX_VIDEOS_PER_PROPERTY = 1; // 1 video max per property
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

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

  // Check file type early
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    errors.push("Only image and video files are allowed");
  }

  // Videos are stored locally; allow any size/quality with no validation
  if (isVideo) {
    return { isValid: true };
  }

  // For images, enforce size/type constraints
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size (${formatFileSize(
        file.size
      )}) exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`
    );
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

// Validate video size (no duration limits)
export const validateVideoSize = async (
  file: File
): Promise<FileValidationResult> => {
  try {
    if (file.size > MAX_VIDEO_SIZE) {
      return {
        isValid: false,
        error: `Video file size (${formatFileSize(
          file.size
        )}) exceeds maximum allowed size of ${formatFileSize(MAX_VIDEO_SIZE)}`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Failed to validate video size",
    };
  }
};

// Compress image with enforced quality and size caps
export const compressImage = async (file: File): Promise<File> => {
  try {
    const options = {
      maxSizeMB: 2, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: "image/webp", // Force WebP format
      initialQuality: 0.5, // 50% quality as required
    };

    const compressedFile = await imageCompression(file, options);

    console.log("Image compressed:", {
      original: formatFileSize(file.size),
      compressed: formatFileSize(compressedFile.size),
      reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`,
      quality: "50%",
      format: "WebP",
    });

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Return original file if compression fails
    return file;
  }
};

// Hybrid video compression: Smart bitrate + Progressive fallback
export const compressVideo = async (file: File): Promise<File> => {
  try {
    console.log("🎬 [VIDEO COMPRESSION] Starting hybrid compression:", {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
    });

    // Phase 1: Quick size check
    if (file.size <= TARGET_VIDEO_SIZE) {
      console.log(
        "✅ [VIDEO COMPRESSION] File already under target size, skipping compression"
      );
      return file;
    }

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

    // Phase 2: Smart bitrate calculation
    const metadata = await getVideoMetadata(file);
    const targetSizeBytes = TARGET_VIDEO_SIZE;
    const targetBitrate = Math.floor((targetSizeBytes * 8) / metadata.duration);

    console.log("🎯 [VIDEO COMPRESSION] Smart bitrate calculation:", {
      duration: `${Math.round(metadata.duration)}s`,
      targetSize: formatFileSize(targetSizeBytes),
      calculatedBitrate: `${Math.round(targetBitrate / 1000)}kbps`,
    });

    // Phase 3: Try smart bitrate first
    try {
      await ffmpeg.exec([
        "-i",
        inputName,
        "-c:v",
        "libx264",
        "-b:v",
        `${targetBitrate}`,
        "-maxrate",
        `${targetBitrate}`,
        "-bufsize",
        `${targetBitrate * 2}`,
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "64k",
        "-movflags",
        "+faststart",
        outputName,
      ]);

      // Check result size
      const data = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([data], { type: "video/mp4" });
      const compressedFile = new File([compressedBlob], file.name, {
        type: "video/mp4",
      });

      if (compressedFile.size <= TARGET_VIDEO_SIZE) {
        console.log("✅ [VIDEO COMPRESSION] Smart bitrate successful:", {
          original: formatFileSize(file.size),
          compressed: formatFileSize(compressedFile.size),
          reduction: `${Math.round(
            (1 - compressedFile.size / file.size) * 100
          )}%`,
          method: "smart-bitrate",
        });

        // Clean up
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return compressedFile;
      }
    } catch (error) {
      console.warn(
        "⚠️ [VIDEO COMPRESSION] Smart bitrate failed, trying progressive fallback"
      );
    }

    // Phase 4: Progressive quality fallback
    const qualityLevels = [23, 28, 33, 38, 43]; // CRF values from high to low quality

    for (const crf of qualityLevels) {
      try {
        console.log(`🔄 [VIDEO COMPRESSION] Trying CRF ${crf}...`);

        await ffmpeg.exec([
          "-i",
          inputName,
          "-c:v",
          "libx264",
          "-crf",
          `${crf}`,
          "-preset",
          "fast",
          "-c:a",
          "aac",
          "-b:a",
          "64k",
          "-movflags",
          "+faststart",
          "-vf",
          "scale=854:480:force_original_aspect_ratio=decrease",
          outputName,
        ]);

        // Check result size
        const data = await ffmpeg.readFile(outputName);
        const compressedBlob = new Blob([data], { type: "video/mp4" });
        const compressedFile = new File([compressedBlob], file.name, {
          type: "video/mp4",
        });

        if (compressedFile.size <= TARGET_VIDEO_SIZE) {
          console.log(
            `✅ [VIDEO COMPRESSION] Progressive fallback successful with CRF ${crf}:`,
            {
              original: formatFileSize(file.size),
              compressed: formatFileSize(compressedFile.size),
              reduction: `${Math.round(
                (1 - compressedFile.size / file.size) * 100
              )}%`,
              method: "progressive-fallback",
              crf,
            }
          );

          // Clean up
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);

          return compressedFile;
        }
      } catch (error) {
        console.warn(`⚠️ [VIDEO COMPRESSION] CRF ${crf} failed:`, error);
        continue;
      }
    }

    // If all methods fail, return the best attempt
    const data = await ffmpeg.readFile(outputName);
    const compressedBlob = new Blob([data], { type: "video/mp4" });
    const compressedFile = new File([compressedBlob], file.name, {
      type: "video/mp4",
    });

    console.log(
      "⚠️ [VIDEO COMPRESSION] Could not reach target size, returning best attempt:",
      {
        original: formatFileSize(file.size),
        compressed: formatFileSize(compressedFile.size),
        reduction: `${Math.round(
          (1 - compressedFile.size / file.size) * 100
        )}%`,
        method: "best-attempt",
      }
    );

    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return compressedFile;
  } catch (error) {
    console.error("❌ [VIDEO COMPRESSION] Video compression failed:", error);
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
    // Videos are uploaded directly without compression
    return file;
  }

  return file;
};

// Split large video into smaller chunks
export const splitVideo = async (file: File): Promise<File[]> => {
  try {
    console.log("✂️ [VIDEO SPLITTING] Starting video splitting:", {
      name: file.name,
      size: formatFileSize(file.size),
    });

    const metadata = await getVideoMetadata(file);
    const chunkSizeBytes = MAX_VIDEO_SIZE; // 10MB per chunk
    const totalChunks = Math.ceil(file.size / chunkSizeBytes);
    const chunkDuration = metadata.duration / totalChunks;

    console.log("📊 [VIDEO SPLITTING] Split calculation:", {
      totalChunks,
      chunkDuration: `${Math.round(chunkDuration)}s per chunk`,
      chunkSize: formatFileSize(chunkSizeBytes),
    });

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
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const chunks: File[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const startTime = i * chunkDuration;
      const outputName = `chunk_${i}.mp4`;

      console.log(
        `🔄 [VIDEO SPLITTING] Creating chunk ${i + 1}/${totalChunks}:`,
        {
          startTime: `${Math.round(startTime)}s`,
          duration: `${Math.round(chunkDuration)}s`,
        }
      );

      await ffmpeg.exec([
        "-i",
        inputName,
        "-ss",
        `${startTime}`,
        "-t",
        `${chunkDuration}`,
        "-c",
        "copy", // Copy without re-encoding for speed
        "-avoid_negative_ts",
        "make_zero",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const chunkBlob = new Blob([data], { type: "video/mp4" });
      const chunkFile = new File(
        [chunkBlob],
        `${file.name.replace(/\.[^/.]+$/, "")}_part${i + 1}.mp4`,
        {
          type: "video/mp4",
        }
      );

      chunks.push(chunkFile);
      await ffmpeg.deleteFile(outputName);

      console.log(`✅ [VIDEO SPLITTING] Chunk ${i + 1} created:`, {
        size: formatFileSize(chunkFile.size),
      });
    }

    // Clean up
    await ffmpeg.deleteFile(inputName);

    console.log("✅ [VIDEO SPLITTING] Video splitting completed:", {
      originalSize: formatFileSize(file.size),
      totalChunks: chunks.length,
      averageChunkSize: formatFileSize(
        chunks.reduce((sum, chunk) => sum + chunk.size, 0) / chunks.length
      ),
    });

    return chunks;
  } catch (error) {
    console.error("❌ [VIDEO SPLITTING] Video splitting failed:", error);
    // Return original file if splitting fails
    return [file];
  }
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
