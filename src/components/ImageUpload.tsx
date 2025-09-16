import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { propertyService } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload = ({ images, onChange, maxImages = 10 }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      toast({
        title: "Upload limit reached",
        description: `You can only upload up to ${maxImages} images per property.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        if (file.type.startsWith('image/')) {
          const url = await propertyService.uploadImage(file, user.id);
          uploadedUrls.push(url);
        }
      }

      onChange([...images, ...uploadedUrls]);
      
      if (uploadedUrls.length > 0) {
        toast({
          title: "Images uploaded",
          description: `${uploadedUrls.length} image(s) uploaded successfully.`
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Property Images ({images.length}/{maxImages})
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading || images.length >= maxImages}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Add Images'}
        </Button>
      </div>

      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Property image ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-card-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
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

      {images.length === 0 && (
        <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No images uploaded yet. Click "Add Images" to upload photos.
          </p>
        </div>
      )}
    </div>
  );
};