export interface Property {
  id: string;
  type: PropertyType;
  location: string;
  rate: number;
  rateType: 'total' | 'per_sqft' | 'per_acre';
  size: number;
  sizeUnit: 'sqft' | 'acres' | 'sqm';
  status: PropertyStatus;
  ownerName: string;
  ownerContact: string;
  notes: string;
  dateOfEntry: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type PropertyType = 
  | 'land'
  | 'flat'
  | 'bungalow'
  | 'villa'
  | 'apartment'
  | 'office'
  | 'shop'
  | 'warehouse'
  | 'farmhouse'
  | 'plot';

export type PropertyStatus = 'available' | 'sold' | 'rented' | 'under_negotiation';

export interface PropertyFilters {
  search: string;
  type: PropertyType | 'all';
  status: PropertyStatus | 'all';
}