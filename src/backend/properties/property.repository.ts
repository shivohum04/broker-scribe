import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type DbPropertyRow = Database["public"]["Tables"]["properties"]["Row"];
type DbPropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type DbPropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export const propertyRepository = {
  /**
   * Fetch all properties for a given user ID
   */
  async fetchPropertiesByUserId(userId: string): Promise<DbPropertyRow[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Fetch all properties (no user filter - for admin or when user context is handled elsewhere)
   */
  async fetchAllProperties(): Promise<DbPropertyRow[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Fetch a single property by ID
   */
  async fetchPropertyById(id: string): Promise<DbPropertyRow | null> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }
    return data ?? null;
  },

  /**
   * Insert a new property
   */
  async insertProperty(
    row: DbPropertyInsert & {
      media?: Database["public"]["Tables"]["properties"]["Row"]["coordinates"];
      cover_thumbnail_url?: string | null;
    }
  ): Promise<DbPropertyRow> {
    const { data, error } = await supabase
      .from("properties")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to insert property: no data returned");
    return data;
  },

  /**
   * Update a property by ID
   */
  async updatePropertyById(
    id: string,
    updates: DbPropertyUpdate & {
      media?: Database["public"]["Tables"]["properties"]["Row"]["coordinates"];
      cover_thumbnail_url?: string | null;
    }
  ): Promise<DbPropertyRow> {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update property: no data returned");
    return data;
  },

  /**
   * Delete a property by ID
   */
  async deletePropertyById(id: string): Promise<void> {
    const { error } = await supabase.from("properties").delete().eq("id", id);

    if (error) throw error;
  },
};
