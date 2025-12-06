import { limitsRepository } from "./limits.repository";

/**
 * Domain model for user limits (camelCase)
 */
export interface UserLimits {
  maxProperties: number;
  maxMediaPerProperty: number;
  maxVideosPerProperty: number;
}

/**
 * Default limits used when no user-specific limits exist
 */
const DEFAULT_LIMITS: UserLimits = {
  maxProperties: 70,
  maxMediaPerProperty: 10,
  maxVideosPerProperty: 1,
};

/**
 * Maps database row (snake_case) to domain model (camelCase)
 */
function mapDbRowToLimits(row: {
  max_properties: number;
  max_media_per_property: number;
  max_videos_per_property: number;
}): UserLimits {
  return {
    maxProperties: row.max_properties,
    maxMediaPerProperty: row.max_media_per_property,
    maxVideosPerProperty: row.max_videos_per_property,
  };
}

/**
 * Limits service - business logic layer
 * Handles user limits retrieval and default values
 */
export const limitsService = {
  /**
   * Get user limits for a given user ID
   * If no limits exist, returns defaults and optionally creates a row
   * @param userId - The user ID
   * @param createIfMissing - Whether to create a limits row if it doesn't exist (default: true)
   */
  async getUserLimits(
    userId: string,
    createIfMissing: boolean = true
  ): Promise<UserLimits> {
    let limitsRow: { max_properties: number; max_media_per_property: number; max_videos_per_property: number } | null = null;
    
    try {
      limitsRow = await limitsRepository.fetchLimitsByUserId(userId);
    } catch (error) {
      // If table doesn't exist or other error, return defaults
      console.warn("Failed to fetch user limits, using defaults:", error);
      return DEFAULT_LIMITS;
    }

    // If no limits exist, return defaults and optionally create a row
    if (!limitsRow) {
      if (createIfMissing) {
        try {
          limitsRow = await limitsRepository.insertLimits({
            user_id: userId,
            max_properties: DEFAULT_LIMITS.maxProperties,
            max_media_per_property: DEFAULT_LIMITS.maxMediaPerProperty,
            max_videos_per_property: DEFAULT_LIMITS.maxVideosPerProperty,
          });
        } catch (error) {
          // If insert fails (e.g., table doesn't exist, race condition), return defaults
          console.warn("Failed to create user limits row, using defaults:", error);
          return DEFAULT_LIMITS;
        }
      } else {
        return DEFAULT_LIMITS;
      }
    }

    return mapDbRowToLimits(limitsRow);
  },

  /**
   * Get default limits (for reference/documentation)
   */
  getDefaultLimits(): UserLimits {
    return { ...DEFAULT_LIMITS };
  },
};
