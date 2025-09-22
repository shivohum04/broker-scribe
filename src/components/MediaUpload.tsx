import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { propertyService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  media: string[];
  onChange: (media: string[]) => void;
  maxFiles?: number;
}

export const MediaUpload = ({ media, onChange, maxFiles = 10 }: MediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
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

    try {
      for (const file of filesToUpload) {
        const url = await propertyService.uploadMedia(file, user.id);
        uploadedUrls.push(url);
      }

      onChange([...media, ...uploadedUrls]);
      
      if (uploadedUrls.length > 0) {
        toast({
          title: "Files uploaded successfully",
          description: `${uploadedUrls.length} file(s) uploaded successfully.`,
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