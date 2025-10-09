import { Edit2, Trash2, MapPin, MoreVertical, Navigation } from "lucide-react";
import { localVideoStorage } from "@/lib/media-local";
import { Property, MediaItem } from "@/types/property";
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
import {
  getCoverThumbnailUrl,
  getVideoPlaceholder,
  getMediaUrls,
} from "@/lib/unified-media-utils";
import {
  formatRateWithType,
  formatRateInLakhsCrores,
} from "@/lib/rate-formatter";
import { User } from "@supabase/supabase-js";

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  onView: (property: Property) => void;
  onImageClick: (media: MediaItem[], startIndex: number) => void;
  user?: User | null;
}

export const PropertyCard = ({
  property,
  onEdit,
  onDelete,
  onView,
  onImageClick,
  user,
}: PropertyCardProps) => {
  console.log(
    "🔍 [PROPERTY CARD] Component rendered for property:",
    property.id,
    "rate:",
    property.rate,
    "rateType:",
    property.rateType
  );

  const formatRate = (rate: number, rateType: Property["rateType"]) => {
    console.log("🔍 [PROPERTY CARD] formatRate called with:", {
      rate,
      rateType,
      propertyId: property.id,
    });
    if (rate === 0) return "Not specified";
    const result = formatRateWithType(rate, rateType);
    console.log("🔍 [PROPERTY CARD] formatRate result:", result);
    return result;
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
    console.log("🔍 [PROPERTY CARD] formatTotal called with total:", total);
    const result = formatRateInLakhsCrores(total);
    console.log("🔍 [PROPERTY CARD] formatTotal result:", result);
    return result;
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
      {/* Main content: Cover image on left, property details on right */}
      <div className="flex gap-4 mb-4">
        {/* Left: Cover Image - Bigger size to match content height */}
        <div
          className="flex-shrink-0"
          onClick={async (e) => {
            e.stopPropagation();
            const mediaList: MediaItem[] = Array.isArray(property.media)
              ? property.media
              : [];
            if (mediaList.length > 0) {
              onImageClick(mediaList, 0);
              return;
            }
            // Fallback to legacy images array
            if (property.images && property.images.length > 0) {
              // Convert legacy images to MediaItem format for compatibility
              const legacyMedia: MediaItem[] = property.images.map(
                (url, index) => ({
                  id: `legacy-${index}`,
                  type: "image" as const,
                  storageType: "cloud" as const,
                  url,
                  isCover: index === 0,
                  uploadedAt: new Date().toISOString(),
                  fileName: `image-${index}`,
                  fileSize: 0,
                  fileType: "image/jpeg",
                })
              );
              onImageClick(legacyMedia, 0);
            }
          }}
        >
          {(() => {
            const mediaList: MediaItem[] = Array.isArray(property.media)
              ? property.media
              : [];

            // Try to get cover thumbnail from unified media system
            if (mediaList.length > 0) {
              const coverThumbnail = getCoverThumbnailUrl(mediaList);
              if (coverThumbnail) {
                return (
                  <LazyMedia
                    src={coverThumbnail}
                    thumbnailSrc={coverThumbnail}
                    alt={property.type}
                    className="w-24 h-32 rounded-lg border border-card-border hover:opacity-80 transition-opacity"
                    showFullSize={false}
                  />
                );
              }

              // If no cover thumbnail but has videos, show video placeholder
              if (mediaList.some((m) => m.type === "video")) {
                return (
                  <div className="w-24 h-32 bg-muted rounded-lg border border-card-border flex items-center justify-center">
                    <div
                      className="w-0 h-0"
                      style={{
                        borderLeft: "10px solid currentColor",
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        color: "#6b7280",
                      }}
                    />
                  </div>
                );
              }
            }

            // Fallback to legacy cover_thumbnail_url
            if (property.cover_thumbnail_url) {
              return (
                <LazyMedia
                  src={property.cover_thumbnail_url}
                  thumbnailSrc={property.cover_thumbnail_url}
                  alt={property.type}
                  className="w-24 h-32 rounded-lg border border-card-border hover:opacity-80 transition-opacity"
                  showFullSize={false}
                />
              );
            }

            // Fallback to legacy images array
            if (property.images && property.images.length > 0) {
              return (
                <LazyMedia
                  src={property.images[0]}
                  thumbnailSrc={getThumbnailUrl(property.images[0])}
                  alt={property.type}
                  className="w-24 h-32 rounded-lg border border-card-border hover:opacity-80 transition-opacity"
                  showFullSize={false}
                />
              );
            }

            // Default placeholder
            return (
              <div className="w-24 h-32 bg-muted rounded-lg border border-card-border flex items-center justify-center">
                <PropertyIcon type={property.type} className="h-8 w-8" />
              </div>
            );
          })()}
        </div>

        {/* Right: Property Details */}
        <div className="flex-1 min-w-0">
          {/* Top row: Property type + Icons */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-card-foreground capitalize hover:text-primary transition-colors truncate flex-1 min-w-0">
              {property.type.replace("_", " ")}
            </h3>
            <div
              className="flex gap-1 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Share on the left */}
              <ShareProperty property={property} user={user} />
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

          {/* Address section */}
          {(property.addressLine1 ||
            property.addressLine2 ||
            property.addressLine3) && (
            <div className="text-sm text-muted-foreground space-y-1">
              {property.addressLine1 && (
                <div className="truncate">{property.addressLine1}</div>
              )}
              {property.addressLine2 && (
                <div className="truncate">{property.addressLine2}</div>
              )}
              {property.addressLine3 && (
                <div className="truncate">{property.addressLine3}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom metrics: Only show sections with data */}
      {(property.size > 0 ||
        property.rentalPerMonth > 0 ||
        (property.rate > 0 &&
          property.size > 0 &&
          calculateTotal(
            property.rate,
            property.rateType,
            property.size,
            property.sizeUnit
          ))) && (
        <div className="flex justify-between items-center py-3 border-t border-card-border">
          {/* Size - only show if size > 0 */}
          {property.size > 0 && (
            <div className="flex flex-col items-center text-center flex-1">
              <span className="text-sm font-medium">
                {property.size.toLocaleString()} {property.sizeUnit}
              </span>
              <span className="text-xs text-muted-foreground">Size</span>
            </div>
          )}

          {/* Rental - only show if rental > 0 */}
          {property.rentalPerMonth > 0 && (
            <div className="flex flex-col items-center text-center flex-1">
              <span className="text-sm font-medium">
                {formatRental(property.rentalPerMonth)}
              </span>
              <span className="text-xs text-muted-foreground">Rental</span>
            </div>
          )}

          {/* Total - only show if rate > 0 and size > 0 and valid calculation */}
          {property.rate > 0 &&
            property.size > 0 &&
            calculateTotal(
              property.rate,
              property.rateType,
              property.size,
              property.sizeUnit
            ) && (
              <div className="flex flex-col items-center text-center flex-1">
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
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            )}
        </div>
      )}

      {/* Notes section */}
      {property.notes && property.notes.trim() && (
        <div className="mt-3 pt-3 border-t border-card-border">
          <div className="text-sm text-muted-foreground">
            {property.notes.trim()}
          </div>
        </div>
      )}
    </div>
  );
};
