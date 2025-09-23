import { Edit2, Trash2, MapPin, MoreVertical, Navigation } from "lucide-react";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyIcon } from "./PropertyIcon";
import { ShareProperty } from "./ShareProperty";
import { calculateTotal } from "@/lib/calculations";
import { LazyMedia } from "./LazyMedia";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  onView: (property: Property) => void;
  onImageClick: (images: string[], startIndex: number) => void;
}

export const PropertyCard = ({
  property,
  onEdit,
  onDelete,
  onView,
  onImageClick,
}: PropertyCardProps) => {
  const formatRate = (rate: number, rateType: Property["rateType"]) => {
    if (rate === 0) return "Not specified";

    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rate);

    switch (rateType) {
      case "per_sqft":
        return `${formatted}/sq ft`;
      case "per_acre":
        return `${formatted}/acre`;
      case "per_hectare":
        return `${formatted}/hectare`;
      default:
        return formatted;
    }
  };

  const formatRental = (rental: number) => {
    if (rental === 0) return "Not specified";

    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rental);

    return `${formatted}/month`;
  };

  const formatTotal = (total: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(total);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className="bg-card border border-card-border rounded-lg p-4 hover:border-accent-hover hover:shadow-md transition-all duration-200 animate-fade-in cursor-pointer overflow-hidden"
      onClick={() => onView(property)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 flex gap-3">
          <div
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              property.images &&
                property.images.length > 0 &&
                onImageClick(property.images, 0);
            }}
          >
            {property.images && property.images.length > 0 ? (
              <LazyMedia
                src={property.images[0]}
                thumbnailSrc={getThumbnailUrl(property.images[0])}
                alt={property.type}
                className="w-16 h-16 rounded-lg border border-card-border hover:opacity-80 transition-opacity"
                showFullSize={false}
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg border border-card-border flex items-center justify-center">
                <PropertyIcon type={property.type} className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-card-foreground capitalize hover:text-primary transition-colors truncate">
              {property.type.replace("_", " ")}
            </h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              {/* Show address lines if available */}
              {property.addressLine1 && (
                <div className="truncate">{property.addressLine1}</div>
              )}
              {property.addressLine2 && (
                <div className="truncate">{property.addressLine2}</div>
              )}
              {property.addressLine3 && (
                <div className="truncate">{property.addressLine3}</div>
              )}
              {/* Show coordinates if no address but coordinates exist */}
              {!property.addressLine1 &&
                !property.addressLine2 &&
                !property.addressLine3 &&
                property.coordinates && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      Location: {property.coordinates.lat.toFixed(4)},{" "}
                      {property.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Share on the left */}
          <ShareProperty property={property} />
          {/* Location icon - only show if coordinates exist */}
          {property.coordinates && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent-hover"
              onClick={() => {
                const { lat, lng } = property.coordinates!;
                // Open Google Maps with directions
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(mapsUrl, "_blank");
              }}
              title="Get directions"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          )}
          {/* Menu on the right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent-hover"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(property.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 min-w-0">
        {/* Size - always show if > 0 */}
        {property.size > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Size</span>
            <span className="text-sm font-medium">
              {property.size.toLocaleString()} {property.sizeUnit}
            </span>
          </div>
        )}

        {/* Rental - show if rental > 0 */}
        {property.rentalPerMonth > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Rent</span>
            <span className="text-sm font-medium">
              {formatRental(property.rentalPerMonth)}
            </span>
          </div>
        )}

        {/* Total Purchase - show if rate > 0 and size > 0 */}
        {property.rate > 0 &&
          property.size > 0 &&
          calculateTotal(
            property.rate,
            property.rateType,
            property.size,
            property.sizeUnit
          ) && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold text-primary">
                {formatTotal(
                  calculateTotal(
                    property.rate,
                    property.rateType,
                    property.size,
                    property.sizeUnit
                  )!
                )}
              </span>
            </div>
          )}

        {/* Removed owner, date and contact per simplification */}

        {property.notes && (
          <div className="pt-2 border-t border-card-border min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {property.notes}
            </p>
          </div>
        )}

        {/* Removed bottom share and image download section per requirements */}
      </div>
    </div>
  );
};
