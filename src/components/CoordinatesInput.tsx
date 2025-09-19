import { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CoordinatesInputProps {
  coordinates?: { lat: number; lng: number };
  onChange: (coordinates?: { lat: number; lng: number }) => void;
}

export const CoordinatesInput = ({ coordinates, onChange }: CoordinatesInputProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({ lat: latitude, lng: longitude });
        toast({
          title: "Location detected",
          description: "Coordinates have been added successfully"
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please allow location access to detect coordinates",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const coordinatesDisplay = coordinates 
    ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    : "";

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          value={coordinatesDisplay}
          placeholder="Click button to detect location"
          readOnly
          className="border-input-border focus:border-input-focus transition-colors"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        className="shrink-0 border-input-border hover:border-input-focus transition-colors"
      >
        {isGettingLocation ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Navigation className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
