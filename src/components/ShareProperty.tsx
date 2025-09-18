import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { Property } from "@/types/property";

interface SharePropertyProps {
  property: Property;
}

export const ShareProperty = ({ property }: SharePropertyProps) => {
  const formatRate = (rate: number, rateType: Property["rateType"]) => {
    if (rate === 0) return "Price on request";

    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(rate);

    switch (rateType) {
      case "per_sqft":
        return `${formatted}/sq ft`;
      case "per_acre":
        return `${formatted}/acre`;
      default:
        return formatted;
    }
  };

  const shareToWhatsApp = () => {
    const addressText = [
      property.addressLine1,
      property.addressLine2,
      property.addressLine3
    ].filter(Boolean).join(', ');
    
    const text = `🏠 ${
      property.type.charAt(0).toUpperCase() + property.type.slice(1)
    } Property\n📍 ${addressText || 'Address not specified'}\n💰 ${formatRate(
      property.rate,
      property.rateType
    )}\n${
      property.size > 0
        ? `📐 ${property.size.toLocaleString()} ${property.sizeUnit}\n`
        : ""
    }\nShared via Property Ledger`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={shareToWhatsApp}
      className="h-8 w-8 hover:bg-accent-hover"
      aria-label="Share on WhatsApp"
    >
      <Share2 className="h-3 w-3" />
    </Button>
  );
};
