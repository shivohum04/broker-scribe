import { useQuery } from "@tanstack/react-query";
import { limitsService } from "@/backend/limits/limits.service";
import { UserLimits } from "@/backend/limits/limits.service";

/**
 * Query keys for user limits
 */
export const userLimitsKeys = {
  all: ["user-limits"] as const,
  user: (userId?: string) => [...userLimitsKeys.all, userId] as const,
};

/**
 * Hook to fetch user limits
 * Returns the limits for the current authenticated user
 */
export function useUserLimits(userId?: string) {
  return useQuery({
    queryKey: userLimitsKeys.user(userId),
    queryFn: () => limitsService.getUserLimits(userId!),
    enabled: !!userId, // Only run when userId is available
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    // Don't retry on error - if table doesn't exist, we'll use defaults
    retry: false,
    // Return defaults on error instead of throwing
    onError: (error) => {
      console.warn("Failed to fetch user limits, using defaults:", error);
    },
  });
}
