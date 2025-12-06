import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { propertyService } from "@/backend/properties/property.service";
import { localVideoStorage } from "@/lib/media-local";
import { LazyMedia } from "@/components/LazyMedia";
import { Property } from "@/types/property";

export const PropertyView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localVideoUrls, setLocalVideoUrls] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getPropertyWithMedia(id!);
      if (data) {
        setProperty(data);

        // Load local video URLs
        if (data.media) {
          const videoUrls: Record<string, string> = {};
          for (const media of data.media) {
            if (media.storageType === "local" && media.localKey) {
              try {
                const url = await localVideoStorage.getLocalVideoUrl(
                  media.localKey
                );
                if (url) {
                  videoUrls[media.id] = url;
                }
              } catch (error) {
                console.error(
                  `Failed to load local video ${media.localKey}:`,
                  error
                );
              }
            }
          }
          setLocalVideoUrls(videoUrls);
        }
      } else {
        setError("Property not found");
      }
    } catch (err) {
      console.error("Failed to load property:", err);
      setError(err instanceof Error ? err.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (property: Property) => {
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
      month: "long",
      day: "numeric",
    });
  };

  const renderMedia = (media: any, index: number) => {
    if (media.storageType === "local" && media.localKey) {
      const videoUrl = localVideoUrls[media.id];
      if (videoUrl) {
        return (
          <video
            key={media.id}
            controls
            className="w-full h-64 object-cover rounded-lg"
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      } else {
        return (
          <div
            key={media.id}
            className="w-full h-64 bg-muted rounded-lg flex items-center justify-center"
          >
            <div className="text-center">
              <div className="text-muted-foreground mb-2">Local Video</div>
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          </div>
        );
      }
    } else if (media.storageType === "cloud" && media.url) {
      return (
        <LazyMedia
          key={media.id}
          src={media.url}
          alt={`Property media ${index + 1}`}
          className="w-full h-64 object-cover rounded-lg"
          showFullSize={true}
        />
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading property...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">
            {error || "Property not found"}
          </p>
          <Button asChild>
            <Link to="/properties">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/properties">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{formatAddress(property)}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary">{property.type}</Badge>
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Added {formatDate(property.created_at)}
              </div>
            </div>
          </div>
          <Button asChild>
            <Link to={`/properties/${property.id}/edit`}>Edit Property</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Gallery */}
          {property.media && property.media.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.media.map((media, index) => (
                    <div key={media.id}>{renderMedia(media, index)}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No media uploaded
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add photos and videos to showcase this property
                </p>
                <Button asChild>
                  <Link to={`/properties/${property.id}/edit`}>Add Media</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {property.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {property.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-semibold">
                    {formatRate(property.rate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {property.rateType === "per_sqft"
                      ? "per sq ft"
                      : property.rateType === "per_acre"
                      ? "per acre"
                      : property.rateType === "per_hectare"
                      ? "per hectare"
                      : "total"}
                  </div>
                </div>
              </div>

              {property.rentalPerMonth > 0 && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">
                      {formatRate(property.rentalPerMonth)}/month
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rental rate
                    </div>
                  </div>
                </div>
              )}

              {property.size > 0 && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">
                      {property.size.toLocaleString()} {property.sizeUnit}
                    </div>
                    <div className="text-sm text-muted-foreground">Size</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Information */}
          {(property.ownerName || property.ownerContact) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.ownerName && (
                  <div>
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-semibold">{property.ownerName}</div>
                  </div>
                )}
                {property.ownerContact && (
                  <div>
                    <div className="text-sm text-muted-foreground">Contact</div>
                    <div className="font-semibold flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {property.ownerContact}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Entry Date */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Date of Entry</div>
              <div className="font-semibold">
                {formatDate(property.dateOfEntry)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
