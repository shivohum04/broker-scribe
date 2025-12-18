import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyService } from "@/backend/properties/property.service";
import { Property, CreatePropertyInput, UpdatePropertyInput } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

/**
 * Query keys for properties
 */
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (userId?: string) => [...propertyKeys.lists(), userId] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};

/**
 * Hook to fetch all properties for a user
 */
export function useProperties(userId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: propertyKeys.list(userId),
    queryFn: () => propertyService.getProperties(userId),
    enabled: !!userId, // Only run when userId is available
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    onError: (error) => {
      console.error("Error loading properties:", error);
      toast({
        title: "Error loading properties",
        description: "Failed to load your properties. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to fetch a single property by ID
 */
export function useProperty(propertyId: string | null) {
  return useQuery({
    queryKey: propertyKeys.detail(propertyId || ""),
    queryFn: () => propertyService.getPropertyById(propertyId!),
    enabled: !!propertyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a new property
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreatePropertyInput) => propertyService.createProperty(input),
    onSuccess: (newProperty) => {
      // Invalidate and refetch properties list
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      
      toast({
        title: "Property added",
        description: "New property has been added successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating property:", error);
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update an existing property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePropertyInput }) =>
      propertyService.updateProperty(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
      
      toast({
        title: "Property updated",
        description: "Property details have been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => propertyService.deleteProperty(id),
    onSuccess: (_, deletedId) => {
      // Invalidate list queries and remove the detail query
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.removeQueries({ queryKey: propertyKeys.detail(deletedId) });
      
      toast({
        title: "Property deleted",
        description: "Property has been removed successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting property:", error);
      toast({
        title: "Error deleting property",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    },
  });
}


