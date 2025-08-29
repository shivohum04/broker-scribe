import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyForm } from '@/components/PropertyForm';
import { PropertyCard } from '@/components/PropertyCard';
import { Property, PropertyFilters, PropertyType, PropertyStatus } from '@/types/property';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export const PropertyManager = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    type: 'all',
    status: 'all'
  });
  const { toast } = useToast();

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = () => {
    const loadedProperties = storage.getProperties();
    setProperties(loadedProperties);
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
      const matchesStatus = filters.status === 'all' || property.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
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

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      storage.deleteProperty(id);
      loadProperties();
      toast({
        title: "Property deleted",
        description: "Property has been removed successfully"
      });
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProperty(undefined);
  };

  const handlePropertySaved = () => {
    loadProperties();
  };

  const getStatsCount = (status: PropertyStatus) => {
    return properties.filter(p => p.status === status).length;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Property Manager</h1>
            </div>
            <Button onClick={handleAddProperty} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-success-light rounded-lg border border-success/20">
              <div className="text-sm font-medium text-success">{getStatsCount('available')}</div>
              <div className="text-xs text-success/80">Available</div>
            </div>
            <div className="text-center p-2 bg-destructive-light rounded-lg border border-destructive/20">
              <div className="text-sm font-medium text-destructive">{getStatsCount('sold')}</div>
              <div className="text-xs text-destructive/80">Sold</div>
            </div>
            <div className="text-center p-2 bg-warning-light rounded-lg border border-warning/20">
              <div className="text-sm font-medium text-warning">{getStatsCount('rented')}</div>
              <div className="text-xs text-warning/80">Rented</div>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg border">
              <div className="text-sm font-medium">{getStatsCount('under_negotiation')}</div>
              <div className="text-xs text-muted-foreground">Negotiating</div>
            </div>
          </div>

          {/* Search and Filters */}
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

            <div className="flex gap-2">
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as PropertyType | 'all' }))}
              >
                <SelectTrigger className="flex-1 border-input-border focus:border-input-focus">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="shop">Shop</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="farmhouse">Farmhouse</SelectItem>
                  <SelectItem value="plot">Plot</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as PropertyStatus | 'all' }))}
              >
                <SelectTrigger className="flex-1 border-input-border focus:border-input-focus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="under_negotiation">Negotiating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {properties.length === 0 ? 'No properties added yet' : 'No matching properties'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {properties.length === 0 
                ? 'Start by adding your first property to manage your real estate portfolio.'
                : 'Try adjusting your search or filter criteria.'
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