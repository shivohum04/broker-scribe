import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface BrokerProfile {
  whatsapp_name: string | null;
  whatsapp_contact: string | null;
}

interface BrokerProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const BrokerProfilePopup = ({
  isOpen,
  onClose,
  user,
}: BrokerProfilePopupProps) => {
  const [whatsappName, setWhatsappName] = useState("");
  const [whatsappContact, setWhatsappContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load existing profile data
  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("whatsapp_name, whatsapp_contact")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is fine for new users
        console.error("Error loading profile:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile information",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setWhatsappName(data.whatsapp_name || "");
        setWhatsappContact(data.whatsapp_contact || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate name length
    const trimmedName = whatsappName.trim();
    if (trimmedName.length > 30) {
      toast({
        title: "Invalid name",
        description: "Name must not exceed 30 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number (must be exactly 10 digits if provided)
    const trimmedContact = whatsappContact.trim();
    if (trimmedContact && trimmedContact.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          whatsapp_name: trimmedName || null,
          whatsapp_contact: trimmedContact || null,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully",
      });

      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: "Failed to save your profile information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setWhatsappName("");
    setWhatsappContact("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
          <DialogDescription>
            Set your name and contact information for WhatsApp sharing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-name">Your Name</Label>
            <Input
              id="whatsapp-name"
              placeholder="Enter your name (e.g., John Smith)"
              value={whatsappName}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 30) {
                  setWhatsappName(value);
                }
              }}
              maxLength={30}
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                This name will be shown when sharing properties on WhatsApp
              </p>
              <p className="text-xs text-muted-foreground">
                {whatsappName.length}/30
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-contact">Contact Number</Label>
            <Input
              id="whatsapp-contact"
              placeholder="Enter 10-digit phone number (e.g., 7999774231)"
              value={whatsappContact}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                if (value.length <= 10) {
                  setWhatsappContact(value);
                }
              }}
              maxLength={10}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Your contact number for WhatsApp sharing (10 digits required)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  Saving...
                </div>
              ) : (
                "Save Profile"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
