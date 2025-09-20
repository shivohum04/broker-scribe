import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { propertyService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { compressMediaFile, formatFileSize, isImageFile, isVideoFile } from '@/lib/compression';

interface MediaUploadProps {
  media: string[];
  onChange: (media: string[]) => void;
  maxFiles?: number;
}

export const MediaUpload = ({ media, onChange, maxFiles = 10 }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    totalOriginalSize: number;
    totalCompressedSize: number;
    filesProcessed: number;
  }>({ totalOriginalSize: 0, totalCompressedSize: 0, filesProcessed: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    const remainingSlots = maxFiles - media.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload up to ${maxFiles} files per property.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {
      for (const file of filesToUpload) {
        if (isImageFile(file) || isVideoFile(file)) {
          // Compress the file
          toast({
            title: "Compressing file",
            description: `Compressing ${file.name}...`,
          });

          const { compressedFile, originalSize, compressedSize, compressionRatio, fileType } = 
            await compressMediaFile(file);

          totalOriginalSize += originalSize;
          totalCompressedSize += compressedSize;

          // Upload compressed file
          const url = await propertyService.uploadMedia(compressedFile, user.id);
          uploadedUrls.push(url);

          toast({
            title: `${fileType === 'image' ? 'Image' : 'Video'} compressed`,
            description: `${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (${compressionRatio.toFixed(1)}% reduction)`,
          });
        }
      }

      onChange([...media, ...uploadedUrls]);
      
      // Update compression stats
      setCompressionStats(prev => ({
        totalOriginalSize: prev.totalOriginalSize + totalOriginalSize,
        totalCompressedSize: prev.totalCompressedSize + totalCompressedSize,
        filesProcessed: prev.filesProcessed + filesToUpload.length
      }));
      
      if (uploadedUrls.length > 0) {
        const totalReduction = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
        toast({
          title: "Files uploaded successfully",
          description: `${uploadedUrls.length} file(s) uploaded. Total size reduction: ${totalReduction.toFixed(1)}%`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    onChange(newMedia);
  };

  const isVideoUrl = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Property Media ({media.length}/{maxFiles})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('media-upload')?.click()}
          disabled={uploading || media.length >= maxFiles}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Add Media
            </>
          )}
        </Button>
      </div>

      <input
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {compressionStats.filesProcessed > 0 && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Compression Stats: {formatFileSize(compressionStats.totalOriginalSize)} → {formatFileSize(compressionStats.totalCompressedSize)} 
          ({(((compressionStats.totalOriginalSize - compressionStats.totalCompressedSize) / compressionStats.totalOriginalSize) * 100).toFixed(1)}% reduction)
        </div>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((url, index) => (
            <div key={index} className="relative group">
              {isVideoUrl(url) ? (
                <div className="relative">
                  <video
                    src={url}
                    className="w-full h-24 object-cover rounded-lg border border-card-border"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Property media ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-card-border"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center">
          <div className="flex justify-center gap-2 mb-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No media uploaded yet. Click "Add Media" to upload photos and videos.
          </p>
        </div>
      )}
    </div>
  );
};