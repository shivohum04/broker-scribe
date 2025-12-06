import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type DbUserLimitsRow = Database["public"]["Tables"]["user_limits"]["Row"];
type DbUserLimitsInsert = Database["public"]["Tables"]["user_limits"]["Insert"];
type DbUserLimitsUpdate = Database["public"]["Tables"]["user_limits"]["Update"];

export const limitsRepository = {
  /**
   * Fetch user limits by user ID
   */
  async fetchLimitsByUserId(userId: string): Promise<DbUserLimitsRow | null> {
    const { data, error } = await supabase
      .from("user_limits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

    if (error) {
      // If no row found, return null (not an error)
      // PGRST116 is the error code when no rows are returned with .single()
      // With .maybeSingle(), this shouldn't happen, but handle it anyway
      if (error.code === "PGRST116") {
        return null;
      }
      // If table doesn't exist (404), return null - migration hasn't been applied yet
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("404")) {
        console.warn("user_limits table does not exist yet. Please run the migration.");
        return null;
      }
      // Handle 406 Not Acceptable (can occur with .single() when no rows found)
      if (error.message?.includes("406") || (error as any).status === 406 || error.code === "406") {
        return null; // No row found, return null
      }
      // For other errors, check if it's a 404 HTTP status
      if (error.message?.includes("404") || (error as any).status === 404) {
        console.warn("user_limits table not found (404). Please run the migration.");
        return null;
      }
      throw error;
    }
    return data;
  },

  /**
   * Insert new user limits
   */
  async insertLimits(
    row: DbUserLimitsInsert
  ): Promise<DbUserLimitsRow> {
    const { data, error } = await supabase
      .from("user_limits")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user limits
   */
  async updateLimits(
    userId: string,
    updates: DbUserLimitsUpdate
  ): Promise<DbUserLimitsRow> {
    const { data, error } = await supabase
      .from("user_limits")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
