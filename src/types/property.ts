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
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

export type PropertyType =
  | "land"
  | "flat"
  | "apartment"
  | "independent house"
  | "bungalow"
  | "villa"
  | "office"
  | "shop"
  | "warehouse"
  | "farmhouse"
  | "plot";

export interface PropertyFilters {
  search: string;
  type: PropertyType | "all";
}
