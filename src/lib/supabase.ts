import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types/property";

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map((prop) => ({
      id: prop.id,
      user_id: prop.user_id,
      type: prop.type as Property["type"],
      addressLine1: prop.address_line_1 || "",
      addressLine2: prop.address_line_2 || "",
      addressLine3: prop.address_line_3 || "",
      rate: prop.rate || 0,
      rateType: prop.rate_type as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: prop.rental_per_month || 0,
      size: prop.size || 0,
      sizeUnit: prop.size_unit as "sqft" | "acres" | "hectare",
      ownerName: prop.owner_name || "",
      ownerContact: prop.owner_contact || "",
      notes: prop.notes || "",
      dateOfEntry: prop.date_of_entry || new Date().toISOString().split("T")[0],
      coordinates: prop.coordinates as Property["coordinates"],
      images: prop.images || [],
      created_at: prop.created_at,
      updated_at: prop.updated_at,
    }));
  },

  async addProperty(
    property: Omit<Property, "id" | "created_at" | "updated_at">
  ): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: property.user_id,
        type: property.type,
        address_line_1: property.addressLine1,
        address_line_2: property.addressLine2,
        address_line_3: property.addressLine3,
        rate: property.rate,
        rate_type: property.rateType,
        rental_per_month: property.rentalPerMonth,
        size: property.size,
        size_unit: property.sizeUnit,
        owner_name: property.ownerName,
        owner_contact: property.ownerContact,
        notes: property.notes,
        date_of_entry: property.dateOfEntry,
        coordinates: property.coordinates,
        images: property.images || [],
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      user_id: data.user_id,
      type: data.type as Property["type"],
      addressLine1: data.address_line_1 || "",
      addressLine2: data.address_line_2 || "",
      addressLine3: data.address_line_3 || "",
      rate: data.rate || 0,
      rateType: data.rate_type as
        | "total"
        | "per_sqft"
        | "per_acre"
        | "per_hectare",
      rentalPerMonth: data.rental_per_month || 0,
      size: data.size || 0,
      sizeUnit: data.size_unit as "sqft" | "acres" | "hectare",
      ownerName: data.owner_name || "",
      ownerContact: data.owner_contact || "",
      notes: data.notes || "",
      dateOfEntry: data.date_of_entry || new Date().toISOString().split("T")[0],
      coordinates: data.coordinates as Property["coordinates"],
      images: data.images || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .update({
        type: updates.type,
        address_line_1: updates.addressLine1,
        address_line_2: updates.addressLine2,
        address_line_3: updates.addressLine3,
        rate: updates.rate,
        rate_type: updates.rateType,
        rental_per_month: updates.rentalPerMonth,
        size: updates.size,
        size_unit: updates.sizeUnit,
        owner_name: updates.ownerName,
        owner_contact: updates.ownerContact,
        notes: updates.notes,
        date_of_entry: updates.dateOfEntry,
        coordinates: updates.coordinates,
        images: updates.images,
      })
      .eq("id", id);

    if (error) throw error;
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) throw error;
  },

  async uploadImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  },
};
