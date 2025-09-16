import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationInput } from "./LocationInput";
import { ImageUpload } from "./ImageUpload";
import { Property, PropertyType } from "@/types/property";
import { propertyService } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: () => void;
  editProperty?: Property;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "land", label: "Land" },
  { value: "flat", label: "Flat" },
  { value: "bungalow", label: "Bungalow" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "warehouse", label: "Warehouse" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "plot", label: "Plot" },
];

export const PropertyForm = ({
  isOpen,
  onClose,
  onPropertyAdded,
  editProperty,
}: PropertyFormProps) => {
  const [formData, setFormData] = useState<Partial<Property>>({
    type: "land",
    location: "",
    rate: 0,
    rateType: "total",
    size: 0,
    sizeUnit: "sqft",
    ownerName: "",
    ownerContact: "",
    notes: "",
    dateOfEntry: new Date().toISOString().split("T")[0],
    coordinates: undefined,
    images: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    // Reset or populate when modal opens
    if (editProperty) {
      setFormData({
        type: editProperty.type,
        location: editProperty.location || "",
        rate: editProperty.rate || 0,
        rateType: editProperty.rateType,
        size: editProperty.size || 0,
        sizeUnit: editProperty.sizeUnit,
        ownerName: editProperty.ownerName || "",
        ownerContact: editProperty.ownerContact || "",
        notes: editProperty.notes || "",
        dateOfEntry:
          editProperty.dateOfEntry || new Date().toISOString().split("T")[0],
        coordinates: editProperty.coordinates,
        images: editProperty.images || [],
      });
    } else {
      setFormData({
        type: "land",
        location: "",
        rate: 0,
        rateType: "total",
        size: 0,
        sizeUnit: "sqft",
        ownerName: "",
        ownerContact: "",
        notes: "",
        dateOfEntry: new Date().toISOString().split("T")[0],
        coordinates: undefined,
        images: [],
      });
    }
  }, [isOpen, editProperty]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add properties",
        variant: "destructive",
      });
      return;
    }

    const propertyData = {
      user_id: user.id,
      type: formData.type as PropertyType,
      location: formData.location || "",
      rate: formData.rate || 0,
      rateType: formData.rateType as "total" | "per_sqft" | "per_acre",
      size: formData.size || 0,
      sizeUnit: formData.sizeUnit as "sqft" | "acres" | "sqm",
      ownerName: formData.ownerName || "",
      ownerContact: formData.ownerContact || "",
      notes: formData.notes || "",
      dateOfEntry:
        formData.dateOfEntry || new Date().toISOString().split("T")[0],
      coordinates: formData.coordinates,
      images: formData.images || [],
    };

    try {
      setSubmitting(true);
      if (editProperty) {
        await propertyService.updateProperty(editProperty.id, propertyData);
        toast({
          title: "Property updated",
          description: "Property details have been updated successfully",
        });
      } else {
        await propertyService.addProperty(propertyData);
        toast({
          title: "Property added",
          description: "New property has been added successfully",
        });
      }

      onPropertyAdded();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLocationChange = (
    location: string,
    coordinates?: { lat: number; lng: number }
  ) => {
    setFormData((prev) => ({
      ...prev,
      location,
      coordinates,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card w-full max-w-md max-h-[90vh] rounded-lg shadow-lg animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <h2 className="text-lg font-semibold">
            {editProperty ? "Edit Property" : "Add New Property"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as PropertyType,
                }))
              }
            >
              <SelectTrigger className="border-input-border focus:border-input-focus">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationInput
              value={formData.location || ""}
              onChange={handleLocationChange}
              placeholder="Enter or detect location"
            />
          </div>

          <ImageUpload
            images={formData.images || []}
            onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                type="number"
                value={formData.rate || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rate: Number(e.target.value),
                  }))
                }
                placeholder="0"
                className="border-input-border focus:border-input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateType">Rate Type</Label>
              <Select
                value={formData.rateType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, rateType: value as any }))
                }
              >
                <SelectTrigger className="border-input-border focus:border-input-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="per_sqft">Per Sq Ft</SelectItem>
                  <SelectItem value="per_acre">Per Acre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                type="number"
                value={formData.size || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    size: Number(e.target.value),
                  }))
                }
                placeholder="0"
                className="border-input-border focus:border-input-focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizeUnit">Unit</Label>
              <Select
                value={formData.sizeUnit}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, sizeUnit: value as any }))
                }
              >
                <SelectTrigger className="border-input-border focus:border-input-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqft">Sq Ft</SelectItem>
                  <SelectItem value="acres">Acres</SelectItem>
                  <SelectItem value="sqm">Sq M</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              value={formData.ownerName || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
              }
              placeholder="Enter owner name"
              className="border-input-border focus:border-input-focus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerContact">Owner Contact</Label>
            <Input
              value={formData.ownerContact || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ownerContact: e.target.value,
                }))
              }
              placeholder="Phone number or email"
              className="border-input-border focus:border-input-focus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfEntry">Date of Entry</Label>
            <Input
              type="date"
              value={formData.dateOfEntry || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dateOfEntry: e.target.value,
                }))
              }
              className="border-input-border focus:border-input-focus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes..."
              rows={3}
              className="border-input-border focus:border-input-focus resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  {editProperty ? "Updating..." : "Adding..."}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {editProperty ? "Update" : "Add"} Property
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
