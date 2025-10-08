import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface BrokerProfile {
  whatsapp_name: string | null;
  whatsapp_contact: string | null;
}

export class UserProfileService {
  /**
   * Get user profile by user ID
   */
  static async getUserProfile(userId: string): Promise<BrokerProfile | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("whatsapp_name, whatsapp_contact")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No profile found, return null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(
    userId: string,
    profile: Partial<BrokerProfile>
  ): Promise<void> {
    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: userId,
          whatsapp_name: profile.whatsapp_name || null,
          whatsapp_contact: profile.whatsapp_contact || null,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error upserting user profile:", error);
      throw error;
    }
  }

  /**
   * Get user name for display (fallback to user metadata if no profile)
   */
  static async getBrokerDisplayName(user: User): Promise<string> {
    try {
      const profile = await this.getUserProfile(user.id);

      if (profile?.whatsapp_name) {
        return profile.whatsapp_name;
      }

      // Fallback to user metadata
      return user.user_metadata?.full_name || "User";
    } catch (error) {
      console.error("Error getting user display name:", error);
      return user.user_metadata?.full_name || "User";
    }
  }

  /**
   * Get WhatsApp contact for sharing
   */
  static async getWhatsappContact(user: User): Promise<string | null> {
    try {
      const profile = await this.getUserProfile(user.id);
      return profile?.whatsapp_contact || null;
    } catch (error) {
      console.error("Error getting WhatsApp contact:", error);
      return null;
    }
  }
}
