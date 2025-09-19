// Unit conversion constants
const SQFT_PER_ACRE = 43560;
const ACRES_PER_HECTARE = 2.471;
const SQFT_PER_HECTARE = SQFT_PER_ACRE * ACRES_PER_HECTARE;

// Convert size to a specific unit
export const convertToUnit = (
  size: number,
  fromUnit: string,
  toUnit: string
): number => {
  if (fromUnit === toUnit) return size;

  // Convert to sqft first
  let sizeInSqft: number;
  switch (fromUnit) {
    case "sqft":
      sizeInSqft = size;
      break;
    case "acres":
      sizeInSqft = size * SQFT_PER_ACRE;
      break;
    case "hectare":
      sizeInSqft = size * SQFT_PER_HECTARE;
      break;
    default:
      return size;
  }

  // Convert from sqft to target unit
  switch (toUnit) {
    case "sqft":
      return sizeInSqft;
    case "acres":
      return sizeInSqft / SQFT_PER_ACRE;
    case "hectare":
      return sizeInSqft / SQFT_PER_HECTARE;
    default:
      return sizeInSqft;
  }
};

// Calculate total purchase price
export const calculateTotal = (
  rate: number,
  rateType: string,
  size: number,
  sizeUnit: string
): number | null => {
  if (rate === 0 || size === 0) return null;

  switch (rateType) {
    case "total":
      return rate;
    case "per_sqft":
      const sizeInSqft = convertToUnit(size, sizeUnit, "sqft");
      return sizeInSqft * rate;
    case "per_acre":
      const sizeInAcres = convertToUnit(size, sizeUnit, "acres");
      return sizeInAcres * rate;
    case "per_hectare":
      const sizeInHectares = convertToUnit(size, sizeUnit, "hectare");
      return sizeInHectares * rate;
    default:
      return null;
  }
};

// Calculate rate per unit for display in ViewProperty
export const calculateRatePerUnit = (
  rate: number,
  rateType: string,
  size: number,
  sizeUnit: string
): { value: number; unit: string } | null => {
  if (rate === 0 || size === 0) return null;

  switch (rateType) {
    case "total":
      // Convert total rate to per-unit rate based on size unit
      return {
        value: rate / size,
        unit: sizeUnit,
      };
    case "per_sqft":
      return { value: rate, unit: "sqft" };
    case "per_acre":
      return { value: rate, unit: "acres" };
    case "per_hectare":
      return { value: rate, unit: "hectare" };
    default:
      return null;
  }
};
