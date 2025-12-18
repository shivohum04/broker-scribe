import { useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
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
import { PropertyType } from "@/types/property";
import { UserProfileService } from "@/lib/user-profile-service";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProperties,
  setFilters,
  setEditingProperty,
  setViewingProperty,
} from "@/store/slices/propertiesSlice";
import {
  openMediaViewer,
  closeMediaViewer,
} from "@/store/slices/mediaSlice";
import {
  openPropertyForm,
  closePropertyForm,
  openProfilePopup,
  closeProfilePopup,
  setLoading,
  setError,
  clearError,
} from "@/store/slices/uiSlice";
import {
  setAuthState,
  setBrokerProfile,
} from "@/store/slices/authSlice";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const PropertyManager = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Redux state
  const {
    properties,
    filteredProperties,
    filters,
    loading,
    editingProperty,
    viewingProperty,
    error,
  } = useAppSelector((state) => state.properties);

  const { brokerProfile } = useAppSelector((state) => state.auth);
  const { mediaViewer } = useAppSelector((state) => state.media);
  const {
    isPropertyFormOpen,
    isProfilePopupOpen,
  } = useAppSelector((state) => state.ui);

  // Load properties and broker name on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchProperties());
      loadBrokerName();
    }
  }, [user, dispatch]);

  const loadBrokerName = async () => {
    if (!user) return;

    try {
      const displayName = await UserProfileService.getBrokerDisplayName(user);
      const whatsappContact = await UserProfileService.getWhatsappContact(user);
      
      dispatch(setBrokerProfile({
        whatsappName: displayName,
        whatsappContact,
      }));
    } catch (error) {
      console.error("Error loading user name:", error);
      dispatch(setBrokerProfile({
        whatsappName: user.user_metadata?.full_name || "User",
        whatsappContact: null,
      }));
    }
  };

  const handleSearchChange = (value: string) => {
    dispatch(setFilters({ ...filters, search: value }));
  };

  const handleTypeFilterChange = (type: "all" | PropertyType) => {
    dispatch(setFilters({ ...filters, type }));
  };

  const handleAddProperty = () => {
    dispatch(setEditingProperty(null));
    dispatch(openPropertyForm());
  };

  const handleEditProperty = (property: any) => {
    dispatch(setEditingProperty(property));
    dispatch(openPropertyForm());
  };

  const handleViewProperty = (property: any) => {
    dispatch(setViewingProperty(property));
  };

  const handleCloseForm = () => {
    dispatch(closePropertyForm());
    dispatch(setEditingProperty(null));
  };

  const handleCloseView = () => {
    dispatch(setViewingProperty(null));
  };

  const handlePropertyAdded = () => {
    dispatch(fetchProperties()); // Refresh properties list
    dispatch(closePropertyForm());
    dispatch(setEditingProperty(null));
  };

  const handleMediaClick = (media: any[], startIndex: number) => {
    dispatch(openMediaViewer({ media, startIndex }));
  };

  const handleCloseMediaViewer = () => {
    dispatch(closeMediaViewer());
  };

  const handleProfileClick = () => {
    dispatch(openProfilePopup());
  };

  const handleCloseProfile = () => {
    dispatch(closeProfilePopup());
  };

  const handleHelp = () => {
    const text = encodeURIComponent("Hi Shiv, I need help with BrokerLog.");
    const url = `https://wa.me/7999774231?text=${text}`;
    window.open(url, "_blank");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      dispatch(setAuthState({ user: null, session: null, loading: false }));
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error toasts
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const brokerDisplayName = brokerProfile?.whatsappName || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">BrokerLog</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>

              {/* Add Property Button */}
              <Button onClick={handleAddProperty} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User2 className="h-4 w-4" />
                    {brokerDisplayName}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfileClick}>
                    <User2 className="mr-2 h-4 w-4" />
                    <span>Your Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHelp}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <select
                value={filters.type}
                onChange={(e) => handleTypeFilterChange(e.target.value as "all" | PropertyType)}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="land">Land</option>
                <option value="flat">Flat</option>
                <option value="independent house">Independent House</option>
                <option value="commercial">Commercial</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No properties found</h3>
            <p className="text-muted-foreground">
              {filters.search || filters.type !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first property"}
            </p>
            {!filters.search && filters.type === "all" && (
              <Button onClick={handleAddProperty} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onView={handleViewProperty}
                onMediaClick={handleMediaClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isPropertyFormOpen && (
        <PropertyForm
          isOpen={isPropertyFormOpen}
          onClose={handleCloseForm}
          onPropertyAdded={handlePropertyAdded}
          editProperty={editingProperty}
        />
      )}

      {viewingProperty && (
        <ViewProperty
          property={viewingProperty}
          onClose={handleCloseView}
          onEdit={handleEditProperty}
          onMediaClick={handleMediaClick}
        />
      )}

      {mediaViewer.isOpen && (
        <MediaViewer
          isOpen={mediaViewer.isOpen}
          onClose={handleCloseMediaViewer}
          media={mediaViewer.media}
          startIndex={mediaViewer.startIndex}
        />
      )}

      {isProfilePopupOpen && user && (
        <BrokerProfilePopup
          isOpen={isProfilePopupOpen}
          onClose={handleCloseProfile}
          user={user}
        />
      )}
    </div>
  );
};









