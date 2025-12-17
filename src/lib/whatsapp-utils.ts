/**
 * Utility functions for WhatsApp sharing that work reliably on mobile devices
 */

/**
 * Opens WhatsApp with a message. Works on both mobile and desktop.
 * On mobile, uses the most reliable method to open WhatsApp app or web.
 * 
 * @param phoneNumber - Phone number with country code (e.g., "7999774231" or "+917999774231")
 * @param text - Message text to pre-fill
 */
export function openWhatsApp(phoneNumber: string, text: string): void {
  // Remove any non-digit characters except + at the start
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, "");
  // Remove + if present, wa.me doesn't need it
  const phone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;
  
  const encodedText = encodeURIComponent(text);
  
  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Build the WhatsApp URL
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
  
  if (isMobile) {
    // For mobile devices, use location.href which is more reliable than window.open
    // The wa.me URL will automatically open the app if installed, or web if not
    // This works reliably on both iOS and Android
    window.location.href = whatsappUrl;
  } else {
    // For desktop, use web version in a new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}

/**
 * Opens WhatsApp without a phone number (just opens WhatsApp with text).
 * Useful for sharing content without targeting a specific contact.
 * 
 * @param text - Message text to pre-fill
 */
export function openWhatsAppWithText(text: string): void {
  const encodedText = encodeURIComponent(text);
  
  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Build the WhatsApp URL
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  
  if (isMobile) {
    // For mobile devices, use location.href which is more reliable than window.open
    // The wa.me URL will automatically open the app if installed, or web if not
    window.location.href = whatsappUrl;
  } else {
    // For desktop, use web version in a new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }
}

