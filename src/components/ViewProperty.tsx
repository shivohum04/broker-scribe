import {
  X,
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types/property";
import { PropertyIcon } from "./PropertyIcon";
import { calculateTotal, calculateRatePerUnit } from "@/lib/calculations";

interface ViewPropertyProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onImageClick: (images: string[], startIndex: number) => void;
}

export const ViewProperty = ({
  isOpen,
  onClose,
  property,
  onImageClick,
}: ViewPropertyProps) => {
  if (!isOpen || !property) return null;

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

  const formatRatePerUnit = (ratePerUnit: { value: number; unit: string }) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(ratePerUnit.value);

    const unitLabel = ratePerUnit.unit === "sqft" ? "sq ft" : ratePerUnit.unit;
    return `${formatted}/${unitLabel}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-lg shadow-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <h2 className="text-lg font-semibold capitalize truncate">
            {property.type.replace("_", " ")} Details
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Images Section */}
          {property.images && property.images.length > 0 ? (
            <div className="p-4 border-b border-card-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Images ({property.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick(property.images!, index)}
                  >
                    <img
                      src={image}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-card-border">
              <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
                <PropertyIcon
                  type={property.type}
                  className="h-16 w-16 text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="p-4 space-y-4">
            {/* Address and Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Address
                  </p>
                  <div className="text-base space-y-1">
                    {property.addressLine1 && (
                      <div className="truncate">{property.addressLine1}</div>
                    )}
                    {property.addressLine2 && (
                      <div className="truncate">{property.addressLine2}</div>
                    )}
                    {property.addressLine3 && (
                      <div className="truncate">{property.addressLine3}</div>
                    )}
                    {!property.addressLine1 &&
                      !property.addressLine2 &&
                      !property.addressLine3 && (
                        <div className="text-muted-foreground truncate">
                          Not specified
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              {property.coordinates && (
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Coordinates
                    </p>
                    <div className="text-base">
                      <Badge variant="outline" className="text-sm">
                        {property.coordinates.lat.toFixed(6)},{" "}
                        {property.coordinates.lng.toFixed(6)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rate per Unit, Size, Total, and Rental */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rate per Unit - always show if rate > 0 */}
              {property.rate > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Rate per Unit
                  </p>
                  <Badge variant="secondary" className="text-base">
                    {property.rateType === "total" && property.size > 0
                      ? formatRatePerUnit(
                          calculateRatePerUnit(
                            property.rate,
                            property.rateType,
                            property.size,
                            property.sizeUnit
                          )!
                        )
                      : formatRate(property.rate, property.rateType)}
                  </Badge>
                </div>
              )}

              {/* Size - always show if > 0 */}
              {property.size > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Size
                  </p>
                  <Badge variant="outline" className="text-base">
                    {property.size.toLocaleString()} {property.sizeUnit}
                  </Badge>
                </div>
              )}

              {/* Total - show if rate > 0 and size > 0 */}
              {property.rate > 0 &&
                property.size > 0 &&
                calculateTotal(
                  property.rate,
                  property.rateType,
                  property.size,
                  property.sizeUnit
                ) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Total
                    </p>
                    <Badge variant="default" className="text-base">
                      {formatTotal(
                        calculateTotal(
                          property.rate,
                          property.rateType,
                          property.size,
                          property.sizeUnit
                        )!
                      )}
                    </Badge>
                  </div>
                )}

              {/* Rental - show if > 0 */}
              {property.rentalPerMonth > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Rent per Month
                  </p>
                  <Badge variant="default" className="text-base">
                    {formatRental(property.rentalPerMonth)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Owner Information */}
            {(property.ownerName || property.ownerContact) && (
              <div className="border-t border-card-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner/Broker Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.ownerName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Name</p>
                      <p className="text-base truncate">{property.ownerName}</p>
                    </div>
                  )}
                  {property.ownerContact && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Contact
                      </p>
                      <a
                        href={`tel:${property.ownerContact}`}
                        className="inline-flex items-center gap-2 text-base text-primary hover:text-primary-hover transition-colors"
                      >
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {property.ownerContact}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Created and Updated Dates */}
            <div className="border-t border-card-border pt-4">
              <div className="flex flex-col sm:flex-row gap-4 text-xs text-muted-foreground">
                {property.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created: {formatDate(property.created_at)}</span>
                  </div>
                )}
                {property.updated_at &&
                  property.updated_at !== property.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Updated: {formatDate(property.updated_at)}</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Notes */}
            {property.notes && (
              <div className="border-t border-card-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </p>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                    {property.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
