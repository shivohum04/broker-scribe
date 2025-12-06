import { propertyRepository } from "./property.repository";
import {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
  MediaItem,
} from "@/types/property";
import { Database } from "@/integrations/supabase/types";

type DbPropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type DbPropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type DbPropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// Extended type to include JSONB fields that may exist in the database
type ExtendedDbPropertyRow = DbPropertyRow & {
  media?: MediaItem[] | null;
  cover_thumbnail_url?: string | null;
};

/**
 * Maps database row (snake_case) to domain model (camelCase)
 * Exported for testing purposes
 */
export function mapDbRowToProperty(row: DbPropertyRow): Property {
  const extendedRow = row as ExtendedDbPropertyRow;

  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as Property["type"],
    addressLine1: row.address_line_1 || "",
    addressLine2: row.address_line_2 || "",
    addressLine3: row.address_line_3 || "",
    rate: row.rate || 0,
    rateType: (row.rate_type as Property["rateType"]) || "total",
    rentalPerMonth: row.rental_per_month || 0,
    size: row.size || 0,
    sizeUnit: (row.size_unit as Property["sizeUnit"]) || "sqft",
    ownerName: row.owner_name || "",
    ownerContact: row.owner_contact || "",
    notes: row.notes || "",
    dateOfEntry: row.date_of_entry || new Date().toISOString().split("T")[0],
    coordinates: row.coordinates as Property["coordinates"],
    images: row.images || [],
    // Handle media and cover_thumbnail_url if they exist in the row (JSONB fields)
    media: extendedRow.media || [],
    cover_thumbnail_url: extendedRow.cover_thumbnail_url || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Maps domain model (camelCase) to database insert (snake_case)
 */
function mapPropertyToDbInsert(input: CreatePropertyInput): DbPropertyInsert & {
  media?: Database["public"]["Tables"]["properties"]["Row"]["coordinates"];
  cover_thumbnail_url?: string | null;
} {
  return {
    user_id: input.user_id,
    type: input.type,
    address_line_1: input.addressLine1 || null,
    address_line_2: input.addressLine2 || null,
    address_line_3: input.addressLine3 || null,
    rate: input.rate || null,
    rate_type: input.rateType || null,
    rental_per_month: input.rentalPerMonth || null,
    size: input.size || null,
    size_unit: input.sizeUnit || null,
    owner_name: input.ownerName || null,
    owner_contact: input.ownerContact || null,
    notes: input.notes || null,
    date_of_entry: input.dateOfEntry || null,
    coordinates:
      (input.coordinates as Database["public"]["Tables"]["properties"]["Row"]["coordinates"]) ||
      null,
    images: input.images || null,
    // JSONB fields - cast to match database schema (Json type)
    media:
      (input.media as unknown as Database["public"]["Tables"]["properties"]["Row"]["coordinates"]) ||
      null,
    cover_thumbnail_url: input.cover_thumbnail_url || null,
  };
}

/**
 * Maps domain model updates (camelCase) to database update (snake_case)
 */
function mapPropertyToDbUpdate(input: UpdatePropertyInput): DbPropertyUpdate & {
  media?: Database["public"]["Tables"]["properties"]["Row"]["coordinates"];
  cover_thumbnail_url?: string | null;
} {
  const update: DbPropertyUpdate & {
    media?: Database["public"]["Tables"]["properties"]["Row"]["coordinates"];
    cover_thumbnail_url?: string | null;
  } = {};

  if (input.type !== undefined) update.type = input.type;
  if (input.addressLine1 !== undefined)
    update.address_line_1 = input.addressLine1 || null;
  if (input.addressLine2 !== undefined)
    update.address_line_2 = input.addressLine2 || null;
  if (input.addressLine3 !== undefined)
    update.address_line_3 = input.addressLine3 || null;
  if (input.rate !== undefined) update.rate = input.rate || null;
  if (input.rateType !== undefined) update.rate_type = input.rateType || null;
  if (input.rentalPerMonth !== undefined)
    update.rental_per_month = input.rentalPerMonth || null;
  if (input.size !== undefined) update.size = input.size || null;
  if (input.sizeUnit !== undefined) update.size_unit = input.sizeUnit || null;
  if (input.ownerName !== undefined)
    update.owner_name = input.ownerName || null;
  if (input.ownerContact !== undefined)
    update.owner_contact = input.ownerContact || null;
  if (input.notes !== undefined) update.notes = input.notes || null;
  if (input.dateOfEntry !== undefined)
    update.date_of_entry = input.dateOfEntry || null;
  if (input.coordinates !== undefined)
    update.coordinates =
      (input.coordinates as Database["public"]["Tables"]["properties"]["Row"]["coordinates"]) ||
      null;
  if (input.images !== undefined) update.images = input.images || null;
  // JSONB fields - cast to Json type
  if (input.media !== undefined) {
    update.media =
      (input.media as unknown as Database["public"]["Tables"]["properties"]["Row"]["coordinates"]) ||
      null;
  }
  if (input.cover_thumbnail_url !== undefined)
    update.cover_thumbnail_url = input.cover_thumbnail_url || null;

  return update;
}

/**
 * Property service - business logic layer
 * Handles domain model transformations and delegates to repository
 */
export const propertyService = {
  /**
   * Fetch all properties for the current user
   * Note: In a real app, you'd get userId from auth context
   */
  async getProperties(userId?: string): Promise<Property[]> {
    const rows = userId
      ? await propertyRepository.fetchPropertiesByUserId(userId)
      : await propertyRepository.fetchAllProperties();
    return rows.map(mapDbRowToProperty);
  },

  /**
   * Fetch a single property by ID
   */
  async getPropertyById(id: string): Promise<Property | null> {
    const row = await propertyRepository.fetchPropertyById(id);
    if (!row) return null;
    return mapDbRowToProperty(row);
  },

  /**
   * Create a new property
   */
  async createProperty(input: CreatePropertyInput): Promise<Property> {
    const dbInsert = mapPropertyToDbInsert(input);
    const row = await propertyRepository.insertProperty(dbInsert);
    return mapDbRowToProperty(row);
  },

  /**
   * Update an existing property
   * Returns void to match existing API, but can be changed to return Property if needed
   */
  async updateProperty(
    id: string,
    updates: UpdatePropertyInput
  ): Promise<void> {
    const dbUpdate = mapPropertyToDbUpdate(updates);
    await propertyRepository.updatePropertyById(id, dbUpdate);
  },

  /**
   * Delete a property
   */
  async deleteProperty(id: string): Promise<void> {
    await propertyRepository.deletePropertyById(id);
  },

  /**
   * Get properties list with simplified data for listing views
   */
  async getPropertiesList(): Promise<
    Array<{
      id: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      type: string;
      rate: number;
      cover_thumbnail_url?: string;
      media_count: number;
      created_at: string;
      updated_at: string;
    }>
  > {
    const rows = await propertyRepository.fetchAllProperties();
    return rows.map((row) => {
      const extendedRow = row as ExtendedDbPropertyRow;
      return {
        id: row.id,
        addressLine1: row.address_line_1 || "",
        addressLine2: row.address_line_2 || undefined,
        addressLine3: row.address_line_3 || undefined,
        type: row.type,
        rate: row.rate || 0,
        cover_thumbnail_url: extendedRow.cover_thumbnail_url || undefined,
        media_count: Array.isArray(extendedRow.media)
          ? extendedRow.media.length
          : 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });
  },
};
