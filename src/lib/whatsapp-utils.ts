/**
 * WhatsApp sharing utilities
 * - Mobile: Opens WhatsApp app directly
 * - Desktop: Opens WhatsApp Web
 */

/**
 * Share text on WhatsApp (without specific contact)
 * Uses api.whatsapp.com/send which preserves text without phone number
 * @param text - Message text to share
 */
export function shareOnWhatsApp(text: string): void {
  const encodedText = encodeURIComponent(text);
  // api.whatsapp.com/send preserves text even without phone number
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = whatsappUrl;
  } else {
    window.open(whatsappUrl, "_blank");
  }
}

/**
 * Share text to a specific WhatsApp contact
 * @param phoneNumber - Phone number (with or without country code)
 * @param text - Message text to share
 */
export function shareToWhatsAppContact(phoneNumber: string, text: string): void {
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
  const phone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = whatsappUrl;
  } else {
    window.open(whatsappUrl, "_blank");
  }
}

// Aliases for backward compatibility
export const shareText = shareOnWhatsApp;
export const shareToContact = shareToWhatsAppContact;

