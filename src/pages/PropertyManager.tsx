import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Building,
  LogOut,
  User2,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyForm } from "@/components/PropertyForm";
import { PropertyCard } from "@/components/PropertyCard";
import { ViewProperty } from "@/components/ViewProperty";
import { MediaViewer } from "@/components/MediaViewer";
import { BrokerProfilePopup } from "@/components/BrokerProfilePopup";
import {
  Property,
  PropertyFilters,
  PropertyType,
  MediaItem,
} from "@/types/property";
import { UserProfileService } from "@/lib/user-profile-service";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { shareToWhatsAppContact } from "@/lib/whatsapp-utils";
import {
  useProperties,
  useDeleteProperty,
} from "@/hooks/useProperties";
import { useUserLimits } from "@/hooks/useUserLimits";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const PropertyManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<
    Property | undefined
  >();
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [mediaViewer, setMediaViewer] = useState<{
    isOpen: boolean;
    media: MediaItem[];
    startIndex: number;
  }>({ isOpen: false, media: [], startIndex: 0 });
  const [filters, setFilters] = useState<PropertyFilters>({
    search: "",
    type: "all",
  });
  const [brokerName, setBrokerName] = useState<string>("User");
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Use React Query hooks for properties
  const {
    data: properties = [],
    isLoading: loading,
    error: propertiesError,
  } = useProperties(user?.id);

  // Get user limits
  const {
    data: userLimits,
    isLoading: limitsLoading,
  } = useUserLimits(user?.id);

  // Delete property mutation
  const deletePropertyMutation = useDeleteProperty();

  // Compute property count and limit status
  const propertyCount = properties.length;
  const maxProperties = userLimits?.maxProperties ?? 70;
  const canCreateProperty = propertyCount < maxProperties;

  // Load broker name on mount
  useEffect(() => {
    loadBrokerName();
  }, [user]);

  const loadBrokerName = async () => {
    if (!user) return;

    try {
      const displayName = await UserProfileService.getBrokerDisplayName(user);
      setBrokerName(displayName);
    } catch (error) {
      console.error("Error loading user name:", error);
      setBrokerName(user.user_metadata?.full_name || "User");
    }
  };

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        filters.search === "" ||
        property.addressLine1
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        property.addressLine2
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        property.addressLine3
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        property.ownerName
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        property.notes.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.type.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType =
        filters.type === "all" || property.type === filters.type;

      return matchesSearch && matchesType;
    });
  }, [properties, filters]);

  const handleAddProperty = () => {
    if (!canCreateProperty) {
      toast({
        title: "Property limit reached",
        description: `You've reached the maximum of ${maxProperties} properties. Contact support for more capacity.`,
        variant: "destructive",
      });
      return;
    }
    setEditingProperty(undefined);
    setIsFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleViewProperty = (property: Property) => {
    setViewingProperty(property);
  };

  const handleMediaClick = (media: MediaItem[], startIndex: number) => {
    setMediaViewer({ isOpen: true, media, startIndex });
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      // Show loading toast
      toast({
        title: "Deleting property...",
        description: "Please wait while we remove your property",
      });

      deletePropertyMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProperty(undefined);
  };

  const handlePropertySaved = () => {
    // React Query will automatically refetch properties after mutations
    // No need to manually reload
    setIsFormOpen(false);
    setEditingProperty(undefined);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      setSigningOut(false);
    }
  };

  const handleHelp = () => {
    const text = "Hi Shiv, I need help with BrokerLog.";
    shareToWhatsAppContact("7999774231", text);
  };

  const handleProfileClick = () => {
    setIsProfilePopupOpen(true);
  };

  const handleProfileClose = () => {
    setIsProfilePopupOpen(false);
    // Reload user name after profile update
    loadBrokerName();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sign Out Loader Overlay */}
      {signingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Signing out...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            {/* Left: User dropdown */}
            <div className="shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{brokerName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium truncate">
                        {brokerName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleProfileClick}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Your Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleHelp} className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Get Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={handleSignOut} 
                    className="gap-2"
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                        Signing Out...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Right: Add Property */}
            <div className="shrink-0">
              <Button
                size="sm"
                onClick={handleAddProperty}
                disabled={!canCreateProperty || limitsLoading}
                className="gap-2 whitespace-nowrap"
                title={
                  !canCreateProperty
                    ? `Property limit reached (${propertyCount}/${maxProperties})`
                    : undefined
                }
              >
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, owner, or notes..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10 border-input-border focus:border-input-focus"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        ) : propertiesError ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading properties</h3>
            <p className="text-muted-foreground mb-6">
              {propertiesError instanceof Error
                ? propertiesError.message
                : "Failed to load properties. Please try again."}
            </p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {properties.length === 0
                ? "No properties added yet"
                : "No matching properties"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0
                ? "Start by adding your first property to manage your real estate portfolio."
                : "Try adjusting your search criteria."}
            </p>
            {properties.length === 0 && (
              <Button onClick={handleAddProperty} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Property
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onView={handleViewProperty}
                onImageClick={handleMediaClick}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Form Modal */}
      <PropertyForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onPropertyAdded={handlePropertySaved}
        editProperty={editingProperty}
      />

      {/* View Property Modal */}
      <ViewProperty
        isOpen={!!viewingProperty}
        onClose={() => setViewingProperty(null)}
        property={viewingProperty}
        onImageClick={handleMediaClick}
      />

      {/* Media Viewer */}
      <MediaViewer
        isOpen={mediaViewer.isOpen}
        onClose={() =>
          setMediaViewer({ isOpen: false, media: [], startIndex: 0 })
        }
        media={mediaViewer.media}
        startIndex={mediaViewer.startIndex}
      />

      {/* Broker Profile Popup */}
      <BrokerProfilePopup
        isOpen={isProfilePopupOpen}
        onClose={handleProfileClose}
        user={user}
      />
    </div>
  );
};
