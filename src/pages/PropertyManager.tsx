import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Building, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyForm } from '@/components/PropertyForm';
import { PropertyCard } from '@/components/PropertyCard';
import { Property, PropertyFilters, PropertyType } from '@/types/property';
import { propertyService } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const PropertyManager = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    type: 'all'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const loadedProperties = await propertyService.getProperties();
      setProperties(loadedProperties);
    } catch (error) {
      toast({
        title: "Error loading properties",
        description: "Failed to load your properties. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      const matchesSearch = filters.search === '' || 
        property.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.notes.toLowerCase().includes(filters.search.toLowerCase()) ||
        property.type.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = filters.type === 'all' || property.type === filters.type;

      return matchesSearch && matchesType;
    });
  }, [properties, filters]);

  const handleAddProperty = () => {
    setEditingProperty(undefined);
    setIsFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await propertyService.deleteProperty(id);
        loadProperties();
        toast({
          title: "Property deleted",
          description: "Property has been removed successfully"
        });
      } catch (error) {
        toast({
          title: "Error deleting property",
          description: "Failed to delete property. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProperty(undefined);
  };

  const handlePropertySaved = () => {
    loadProperties();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Property Ledger</h1>
              {user && (
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddProperty} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Property
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location, owner, or notes..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {properties.length === 0 ? 'No properties added yet' : 'No matching properties'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0 
                ? 'Start by adding your first property to manage your real estate portfolio.'
                : 'Try adjusting your search criteria.'
              }
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
    </div>
  );
};