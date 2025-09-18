import { Edit2, Trash2, Phone, MapPin, Calendar, Share2, MoreVertical } from "lucide-react";
import { Property } from "@/types/property";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PropertyIcon } from "./PropertyIcon";
import { ShareProperty } from "./ShareProperty";

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
      default:
        return formatted;
    }
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
      className="bg-card border border-card-border rounded-lg p-4 hover:border-accent-hover hover:shadow-md transition-all duration-200 animate-fade-in cursor-pointer"
      onClick={() => onView(property)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 flex gap-3">
          <div 
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              property.images && property.images.length > 0 && onImageClick(property.images, 0);
            }}
          >
            {property.images && property.images.length > 0 ? (
              <img
                src={property.images[0]}
                alt={property.type}
                className="w-16 h-16 object-cover rounded-lg border border-card-border hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-lg border border-card-border flex items-center justify-center">
                <PropertyIcon type={property.type} className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-card-foreground capitalize hover:text-primary transition-colors">
              {property.type.replace("_", " ")}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <div className="line-clamp-2 text-left">
                {property.addressLine1 && <div>{property.addressLine1}</div>}
                {property.addressLine2 && <div>{property.addressLine2}</div>}
                {property.addressLine3 && <div>{property.addressLine3}</div>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
          <ShareProperty property={property} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Rate</span>
          <span className="text-sm font-medium">
            {formatRate(property.rate, property.rateType)}
          </span>
        </div>

        {property.size > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Size</span>
            <span className="text-sm font-medium">
              {property.size.toLocaleString()} {property.sizeUnit}
            </span>
          </div>
        )}

        {property.ownerName && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Owner</span>
            <span className="text-sm font-medium line-clamp-1">
              {property.ownerName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(property.dateOfEntry)}</span>
          </div>
          {property.ownerContact && (
            <a
              href={`tel:${property.ownerContact}`}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span className="line-clamp-1">{property.ownerContact}</span>
            </a>
          )}
        </div>

        {property.notes && (
          <div className="pt-2 border-t border-card-border">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {property.notes}
            </p>
          </div>
        )}

        {/* Removed bottom share and image download section per requirements */}
      </div>
    </div>
  );
};
