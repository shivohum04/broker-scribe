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
    try {
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
          const brokerName = await UserProfileService.getBrokerDisplayName(
            user
          );
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

      // Detect mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log("📱 [WHATSAPP SHARE] User agent:", navigator.userAgent);
      console.log("📱 [WHATSAPP SHARE] Is mobile:", isMobile);
      console.log("📱 [WHATSAPP SHARE] Text length:", text.length);

      // For mobile devices, try multiple approaches
      if (isMobile) {
        // Approach 1: Try WhatsApp app URL first
        const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(
          text
        )}`;
        console.log("📱 [WHATSAPP SHARE] Trying app URL:", whatsappAppUrl);

        // Create a temporary link and click it (more reliable on mobile)
        const link = document.createElement("a");
        link.href = whatsappAppUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Fallback after a short delay
        setTimeout(() => {
          const webUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
          console.log("📱 [WHATSAPP SHARE] Fallback to web URL:", webUrl);
          window.open(webUrl, "_blank");
        }, 1000);
      } else {
        // For desktop, use web version
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        console.log("📱 [WHATSAPP SHARE] Desktop URL:", whatsappUrl);
        window.open(whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("📱 [WHATSAPP SHARE] Error:", error);
      // Final fallback
      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(
        "Check out this property on BrokerLog!"
      )}`;
      window.open(fallbackUrl, "_blank");
    }
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
