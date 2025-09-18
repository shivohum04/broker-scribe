import { X, MapPin, Calendar, User, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/types/property";
import { PropertyIcon } from "./PropertyIcon";

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
      default:
        return formatted;
    }
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
          <h2 className="text-lg font-semibold capitalize">
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
                <PropertyIcon type={property.type} className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="p-4 space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-base">{property.location || "Not specified"}</p>
              </div>
            </div>

            {/* Rate and Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Rate</p>
                <Badge variant="secondary" className="text-base">
                  {formatRate(property.rate, property.rateType)}
                </Badge>
              </div>
              {property.size > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Size</p>
                  <Badge variant="outline" className="text-base">
                    {property.size.toLocaleString()} {property.sizeUnit}
                  </Badge>
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Property Type</p>
              <Badge variant="default" className="text-base capitalize">
                {property.type.replace("_", " ")}
              </Badge>
            </div>

            {/* Owner Information */}
            {(property.ownerName || property.ownerContact) && (
              <div className="border-t border-card-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h4>
                <div className="space-y-2">
                  {property.ownerName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="text-base">{property.ownerName}</p>
                    </div>
                  )}
                  {property.ownerContact && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <a
                        href={`tel:${property.ownerContact}`}
                        className="inline-flex items-center gap-2 text-base text-primary hover:text-primary-hover transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        {property.ownerContact}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date of Entry */}
            <div className="border-t border-card-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Entry
              </p>
              <p className="text-base">{formatDate(property.dateOfEntry)}</p>
            </div>

            {/* Notes */}
            {property.notes && (
              <div className="border-t border-card-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </p>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
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