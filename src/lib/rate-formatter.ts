/**
 * Formats property rate in Indian currency format (lakhs/crores)
 * @param rate - The rate value to format
 * @returns Formatted string (e.g., "1.5 Crore", "50.5 Lakh", "₹25,000")
 */
export function formatRateInLakhsCrores(rate: number): string {
  console.log(
    "🔍 [RATE FORMATTER] formatRateInLakhsCrores called with rate:",
    rate
  );

  if (rate === 0) return "Price on request";

  // Convert to crores if >= 1 crore (1,00,00,000)
  if (rate >= 10000000) {
    const crores = rate / 10000000;
    const result = `${crores.toFixed(1)} Crore`;
    console.log("🔍 [RATE FORMATTER] Crore conversion:", rate, "→", result);
    return result;
  }

  // Convert to lakhs if >= 1 lakh (1,00,000) but < 1 crore
  if (rate >= 100000) {
    const lakhs = rate / 100000;
    const result = `${lakhs.toFixed(1)} Lakh`;
    console.log("🔍 [RATE FORMATTER] Lakh conversion:", rate, "→", result);
    return result;
  }

  // For amounts less than 1 lakh, show in regular format
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rate);

  console.log("🔍 [RATE FORMATTER] Regular format:", rate, "→", formatted);
  return formatted;
}

/**
 * Formats property rate with rate type (per sqft, per acre, etc.)
 * @param rate - The rate value
 * @param rateType - The rate type (total, per_sqft, per_acre, etc.)
 * @returns Formatted string with rate type
 */
export function formatRateWithType(rate: number, rateType: string): string {
  console.log(
    "🔍 [RATE FORMATTER] formatRateWithType called with rate:",
    rate,
    "rateType:",
    rateType
  );

  if (rate === 0) return "Price on request";

  // Only apply lakhs/crores formatting for total rates
  if (rateType === "total") {
    console.log(
      "🔍 [RATE FORMATTER] Using lakhs/crores formatting for total rate"
    );
    return formatRateInLakhsCrores(rate);
  }

  // For per-unit rates, use regular currency formatting
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rate);

  let result: string;
  switch (rateType) {
    case "per_sqft":
      result = `${formatted}/sq ft`;
      break;
    case "per_acre":
      result = `${formatted}/acre`;
      break;
    case "per_hectare":
      result = `${formatted}/hectare`;
      break;
    default:
      result = formatted;
  }

  console.log(
    "🔍 [RATE FORMATTER] Per-unit formatting:",
    rate,
    rateType,
    "→",
    result
  );
  return result;
}
