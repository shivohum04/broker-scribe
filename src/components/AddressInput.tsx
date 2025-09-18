import { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface AddressInputProps {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  onChange: (addressLine1: string, addressLine2: string, addressLine3: string, coordinates?: { lat: number; lng: number }) => void;
}

export const AddressInput = ({ addressLine1, addressLine2, addressLine3, onChange }: AddressInputProps) => {
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            onChange(address, addressLine2, addressLine3, { lat: latitude, lng: longitude });
            toast({
              title: "Location found",
              description: "Current location added to address line 1"
            });
          } else {
            // Fallback to coordinates
            const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            onChange(coords, addressLine2, addressLine3, { lat: latitude, lng: longitude });
          }
        } catch (error) {
          // Fallback to coordinates
          const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onChange(coords, addressLine2, addressLine3, { lat: latitude, lng: longitude });
          toast({
            title: "Location added",
            description: "Using coordinates as address lookup failed"
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please allow location access or enter manually",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={addressLine1}
            onChange={(e) => onChange(e.target.value, addressLine2, addressLine3)}
            placeholder="Address Line 1"
            className="pl-10 border-input-border focus:border-input-focus transition-colors"
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
      <Input
        value={addressLine2}
        onChange={(e) => onChange(addressLine1, e.target.value, addressLine3)}
        placeholder="Address Line 2"
        className="border-input-border focus:border-input-focus transition-colors"
      />
      <Input
        value={addressLine3}
        onChange={(e) => onChange(addressLine1, addressLine2, e.target.value)}
        placeholder="Address Line 3"
        className="border-input-border focus:border-input-focus transition-colors"
      />
    </div>
  );
};