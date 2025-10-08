import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { Property } from "@/types/property";
import { UserProfileService } from "@/lib/user-profile-service";
import { User } from "@supabase/supabase-js";

interface SharePropertyProps {
  property: Property;
  user?: User | null;
}

export const ShareProperty = ({ property, user }: SharePropertyProps) => {
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

  const shareToWhatsApp = async () => {
    const addressText = [
      property.addressLine1,
      property.addressLine2,
      property.addressLine3,
    ]
      .filter(Boolean)
      .join(", ");

    // Add notes section
    let notesSection = "";
    if (property.notes && property.notes.trim()) {
      notesSection = `\n📝 Notes: ${property.notes.trim()}`;
    }

    // Note: Media files cannot be shared directly via WhatsApp web API
    // Users need to manually attach media files in WhatsApp

    let brokerInfo = "";
    if (user) {
      try {
        const brokerName = await UserProfileService.getBrokerDisplayName(user);
        const whatsappContact = await UserProfileService.getWhatsappContact(
          user
        );

        if (whatsappContact) {
          brokerInfo = `\n\nFor further dealing contact ${brokerName} at ${whatsappContact}`;
        } else {
          brokerInfo = `\n\nFor further dealing contact ${brokerName}`;
        }
      } catch (error) {
        console.error("Error getting broker info:", error);
      }
    }

    const text = `🏠 ${
      property.type.charAt(0).toUpperCase() + property.type.slice(1)
    } Property\n📍 ${addressText || "Address not specified"}\n💰 ${formatRate(
      property.rate,
      property.rateType
    )}\n${
      property.size > 0
        ? `📐 ${property.size.toLocaleString()} ${property.sizeUnit}\n`
        : ""
    }${notesSection}${brokerInfo}\n\nShared via BrokerLog`;

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
