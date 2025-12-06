// Unified media item interface
export interface MediaItem {
  id: string;
  type: "image" | "video";
  storageType: "cloud" | "local";
  url?: string; // For cloud storage (images)
  localKey?: string; // For local storage (videos)
  thumbnailUrl?: string; // For images only
  isCover: boolean; // Explicit cover flag
  uploadedAt: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface Property {
  id: string;
  user_id: string;
  type: PropertyType;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  rate: number;
  rateType: "total" | "per_sqft" | "per_acre" | "per_hectare";
  rentalPerMonth: number;
  size: number;
  sizeUnit: "sqft" | "acres" | "hectare";
  ownerName: string;
  ownerContact: string;
  notes: string;
  dateOfEntry: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Legacy fields for backward compatibility
  images?: string[];
  media?: MediaItem[]; // New unified media array
  cover_thumbnail_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PropertyType =
  | "land"
  | "flat"
  | "independent house"
  | "commercial"
  | "warehouse";

export interface PropertyFilters {
  search: string;
  type: PropertyType | "all";
}

/**
 * Input type for creating a new property (excludes id and timestamps)
 */
export type CreatePropertyInput = Omit<
  Property,
  "id" | "created_at" | "updated_at"
>;

/**
 * Input type for updating a property (all fields optional except id)
 */
export type UpdatePropertyInput = Partial<
  Omit<Property, "id" | "created_at" | "updated_at">
>;
