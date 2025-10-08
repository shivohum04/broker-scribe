import { useState } from "react";
import { Navigation, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface CoordinatesInputProps {
  coordinates?: { lat: number; lng: number };
  onChange: (coordinates?: { lat: number; lng: number }) => void;
}

export const CoordinatesInput = ({
  coordinates,
  onChange,
}: CoordinatesInputProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
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
          description: "Coordinates have been added successfully",
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please allow location access to detect coordinates",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearCoordinates = () => {
    onChange(undefined);
    toast({
      title: "Coordinates cleared",
      description: "Location coordinates have been removed",
    });
  };

  const handleManualInput = (value: string) => {
    // Try to parse coordinates from various formats
    let lat: number | null = null;
    let lng: number | null = null;

    // Handle degree format: 21°16'54.2"N 81°45'30.5"E
    const degreeMatch = value.match(
      /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/i
    );
    if (degreeMatch) {
      const [, latDeg, latMin, latSec, latDir, lngDeg, lngMin, lngSec, lngDir] =
        degreeMatch;

      // Convert to decimal degrees
      const latDecimal =
        parseFloat(latDeg) +
        parseFloat(latMin) / 60 +
        parseFloat(latSec) / 3600;
      const lngDecimal =
        parseFloat(lngDeg) +
        parseFloat(lngMin) / 60 +
        parseFloat(lngSec) / 3600;

      lat = latDir.toUpperCase() === "N" ? latDecimal : -latDecimal;
      lng = lngDir.toUpperCase() === "E" ? lngDecimal : -lngDecimal;
    } else {
      // Handle decimal format: 28.6139, 77.2090
      const cleaned = value.replace(/[^\d.,\-\s]/g, "").trim();
      const parts = cleaned.split(/[,\s]+/).filter((part) => part.length > 0);

      if (parts.length >= 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    // Validate and apply coordinates
    if (
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      onChange({ lat, lng });
    }
  };

  const coordinatesDisplay = coordinates
    ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    : "";

  return (
    <div className="relative">
      <Input
        value={coordinatesDisplay}
        onChange={(e) => handleManualInput(e.target.value)}
        placeholder={
          coordinates ? "" : "Enter coordinates manually or tap icon to detect"
        }
        className="border-input-border focus:border-input-focus transition-colors pr-20"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        {coordinates && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearCoordinates}
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
            title="Clear coordinates"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="h-6 w-6 hover:bg-accent-hover"
          title="Detect current location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Navigation className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
};
