import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, DollarSign, Calendar } from "lucide-react";
import { propertyService } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LazyMedia } from "@/components/LazyMedia";

interface PropertyListItem {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  type: string;
  rate: number;
  cover_thumbnail_url?: string;
  media_count: number;
  created_at: string;
  updated_at: string;
}

export const PropertyList: React.FC = () => {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getPropertiesList();
      setProperties(data);
    } catch (err) {
      console.error("Failed to load properties:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (property: PropertyListItem) => {
    const parts = [
      property.addressLine1,
      property.addressLine2,
      property.addressLine3,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadProperties}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            Manage your property portfolio
          </p>
        </div>
        <Button asChild>
          <Link to="/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-6">
            Get started by adding your first property
          </p>
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/properties/${property.id}`}>
                <div className="relative">
                  {property.cover_thumbnail_url ? (
                    <LazyMedia
                      src={property.cover_thumbnail_url}
                      alt={`${property.addressLine1} property`}
                      className="w-full h-48 object-cover"
                      showFullSize={false}
                    />
                  ) : property.media_count > 0 ? (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto w-12 h-12 rounded bg-muted-foreground/20 flex items-center justify-center mb-2">
                          {/* Simple play icon triangle */}
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderLeft: "12px solid currentColor",
                              borderTop: "8px solid transparent",
                              borderBottom: "8px solid transparent",
                              color: "#6b7280",
                            }}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Video
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">
                          No Media
                        </div>
                      </div>
                    </div>
                  )}
                  <Badge variant="secondary" className="absolute top-2 left-2">
                    {property.type}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {formatAddress(property)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatRate(property.rate)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(property.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
