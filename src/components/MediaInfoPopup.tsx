import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/upload-utils";
import {
  MAX_FILE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/upload-utils";

interface MediaInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaInfoPopup = ({ isOpen, onClose }: MediaInfoPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Media Upload Guidelines</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• First image becomes cover</li>
            <li>• One video per property maximum</li>
            <li>• Maximum 30MB video</li>
            <li>• All media is stored securely in the cloud</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
