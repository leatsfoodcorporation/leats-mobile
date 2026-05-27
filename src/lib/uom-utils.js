/**
 * Multi-UOM Inventory Management System
 * Mobile implementation using convert-units package
 * Exact port of frontend/lib/uom-constants.ts
 */

import convert from 'convert-units';

// ==================== UOM Categories ====================

export const UOM_CATEGORIES = {
  WEIGHT: 'Weight',
  VOLUME: 'Volume',
  QUANTITY: 'Quantity',
};

// ==================== Common UOMs ====================

/**
 * Dynamically generate a UOM option from convert-units or custom list
 */
const createUOMOption = (value, category) => {
  try {
    const description = convert().describe(value);
    return {
      id: value,
      name: description.singular,
      value,
      label: description.singular,
      category,
      symbol: description.abbr,
    };
  } catch (e) {
    // Fallback for units not in convert-units (quantity units)
    const labels = {
      pcs: 'Pieces',
      unit: 'Unit',
      dozen: 'Dozen',
      pair: 'Pair',
      set: 'Set',
      pack: 'Pack',
      box: 'Box',
      carton: 'Carton',
      bag: 'Bag',
      bottle: 'Bottle',
      can: 'Can',
      jar: 'Jar',
      bundle: 'Bundle',
      roll: 'Roll',
      quintal: 'Quintal',
    };
    const symbols = {
      pcs: 'pcs',
      unit: 'unit',
      dozen: 'doz',
      pair: 'pair',
      quintal: 'qtl',
      pack: 'pk',
      bag: 'bg',
      box: 'bx',
    };
    const label = labels[value] || value.charAt(0).toUpperCase() + value.slice(1);
    return {
      id: value,
      name: label,
      value,
      label,
      category,
      symbol: symbols[value] || value,
    };
  }
};

const MASS_POSSIBILITIES = [...convert().possibilities('mass'), 'quintal'];
const VOLUME_POSSIBILITIES = convert().possibilities('volume');
const QUANTITY_POSSIBILITIES = [
  'pcs',
  'unit',
  'dozen',
  'pair',
  'set',
  'pack',
  'box',
  'carton',
  'bag',
  'bottle',
  'can',
  'jar',
  'bundle',
  'roll',
];

export const COMMON_UOMS = [
  ...MASS_POSSIBILITIES.map((u) => createUOMOption(u, UOM_CATEGORIES.WEIGHT)),
  ...VOLUME_POSSIBILITIES.map((u) => createUOMOption(u, UOM_CATEGORIES.VOLUME)),
  ...QUANTITY_POSSIBILITIES.map((u) => createUOMOption(u, UOM_CATEGORIES.QUANTITY)),
];

// ==================== Helper Functions ====================

/**
 * Get allowed UOMs for a specific category
 */
export const getAllowedUOMsForCategory = (_category) => {
  return COMMON_UOMS;
};

/**
 * Get labels, symbols, etc manually from the package if possible
 */
export const getUOMLabel = (value) => {
  try {
    return convert().describe(value).singular;
  } catch {
    return COMMON_UOMS.find((u) => u.value === value)?.label || value;
  }
};

export const getUOMSymbol = (value) => {
  try {
    return convert().describe(value).abbr;
  } catch {
    return COMMON_UOMS.find((u) => u.value === value)?.symbol || value;
  }
};

export const getUOMsByCategory = (category) => {
  return COMMON_UOMS.filter((uom) => uom.category === category);
};

// ==================== UOM Conversion ====================

/**
 * Convert UOM value using convert-units package
 */
export const convertUOMValue = (value, fromUom, toUom) => {
  if (!fromUom || !toUom || fromUom === toUom) return value;

  try {
    // Handling quintal (standard unit for many products in some systems)
    if (fromUom === 'quintal' && toUom === 'kg') return value * 100;
    if (fromUom === 'kg' && toUom === 'quintal') return value / 100;

    // Quantity factors
    const factors = { dozen: 12, pair: 2 };
    if (factors[fromUom] || factors[toUom] || QUANTITY_POSSIBILITIES.includes(fromUom)) {
      const fromF = factors[fromUom] || 1;
      const toF = factors[toUom] || 1;
      return (value * fromF) / toF;
    }

    return convert(value).from(fromUom).to(toUom);
  } catch (error) {
    console.error(`UOM conversion error: ${fromUom} → ${toUom}`, error);
    return null;
  }
};

// ==================== Available UOMs Array ====================

/**
 * Build availableUoms array for database storage
 * Calculates conversion factors relative to base UOM
 */
export const buildAvailableUomsArray = (baseUom, selectedUoms) => {
  return selectedUoms.map((uom) => {
    if (uom === baseUom) {
      return { uom, conversionFactor: 1 };
    }

    // Calculate conversion factor: how many of this UOM = 1 base UOM
    // Example: baseUom = kg, uom = g → 1 kg = 1000 g → factor = 1000
    const factor = convertUOMValue(1, baseUom, uom);

    return {
      uom,
      conversionFactor: factor || 1,
    };
  });
};

/**
 * Convert variant quantity to base UOM for stock deduction
 * Example: 500g variant → 0.5kg in base UOM
 */
export const convertToBaseUOM = (variantQuantity, variantUom, baseUom, availableUoms) => {
  // Find conversion factor
  const uomConfig = availableUoms.find((u) => u.uom === variantUom);

  if (!uomConfig) {
    console.error(`UOM ${variantUom} not found in availableUoms`);
    return variantQuantity; // Fallback
  }

  // Convert to base UOM
  // Example: 500g variant, baseUom = kg, conversionFactor = 1000
  // Result: 500 / 1000 = 0.5 kg
  return variantQuantity / uomConfig.conversionFactor;
};

/**
 * Format stock display with UOM
 * Optionally shows conversion to another UOM
 */
export const formatStockWithUOM = (stockInBaseUom, baseUom, displayUom) => {
  const baseDisplay = formatUOMDisplay(stockInBaseUom, baseUom);

  if (!displayUom || displayUom === baseUom) {
    return baseDisplay;
  }

  const converted = convertUOMValue(stockInBaseUom, baseUom, displayUom);
  if (converted === null) {
    return baseDisplay;
  }

  const convertedDisplay = formatUOMDisplay(converted, displayUom);
  return `${baseDisplay} (${convertedDisplay})`;
};

/**
 * Format UOM display with value and symbol
 */
export const formatUOMDisplay = (value, uom) => {
  const symbol = getUOMSymbol(uom);
  // Round to 2 decimal places to handle precision issues
  const roundedValue = Math.round(value * 100) / 100;
  const formattedValue =
    roundedValue % 1 === 0 ? Math.floor(roundedValue).toString() : roundedValue.toFixed(2);
  return `${formattedValue}${symbol}`;
};

/**
 * 🆕 Smart UOM Display Formatter
 * Automatically converts to user-friendly units using convert-units
 * Works for ALL UOMs dynamically without hardcoding
 *
 * Examples:
 * - 0.3 kg → 300g (converts to smaller unit if < 1)
 * - 1500 g → 1.5kg (converts to larger unit if >= 1000)
 * - 0.5 L → 500ml
 * - 2000 ml → 2L
 */
export const formatSmartUOMDisplay = (value, baseUom) => {
  if (!baseUom || value === 0) {
    return formatUOMDisplay(value, baseUom);
  }

  try {
    // Get UOM description to determine category
    const description = convert().describe(baseUom);
    const measure = description.measure; // 'mass', 'volume', etc.

    // Get all possible units in this measure
    const possibilities = convert().possibilities(measure);

    // Find the best unit to display
    let bestUom = baseUom;
    let bestValue = value;

    // If value < 1, try to find a smaller unit
    if (value < 1 && value > 0) {
      for (const possibleUom of possibilities) {
        const converted = convertUOMValue(value, baseUom, possibleUom);
        if (converted !== null && converted >= 1 && converted < 1000) {
          bestUom = possibleUom;
          bestValue = converted;
          break;
        }
      }
    }
    // If value >= 1000, try to find a larger unit
    else if (value >= 1000) {
      for (const possibleUom of possibilities) {
        const converted = convertUOMValue(value, baseUom, possibleUom);
        if (converted !== null && converted >= 1 && converted < 1000) {
          bestUom = possibleUom;
          bestValue = converted;
          break;
        }
      }
    }

    return formatUOMDisplay(bestValue, bestUom);
  } catch (error) {
    // Fallback for quantity units or unsupported UOMs
    return formatUOMDisplay(value, baseUom);
  }
};

/**
 * 🆕 Format quantity with UOM for order items
 * Shows: quantity × variantUomValue (e.g., "2 × 500g = 1kg")
 *
 * Example: 2 units × 500g = 1kg
 */
export const formatOrderItemQuantity = (quantity, variantUom, variantUomValue) => {
  // Format quantity to handle decimals only when needed
  const formatNum = (num) => {
    const rounded = Math.round(num * 100) / 100;
    return rounded % 1 === 0 ? Math.floor(rounded).toString() : rounded.toFixed(2);
  };

  if (!variantUom || !variantUomValue) {
    return formatNum(quantity);
  }

  const totalAmount = quantity * variantUomValue;
  // Show "2 × 500g" format for clarity
  const perUnitDisplay = formatSmartUOMDisplay(variantUomValue, variantUom);
  return `${formatNum(quantity)} × ${perUnitDisplay}`;
};

// ==================== Popular UOMs ====================

export const POPULAR_UOMS = [
  'kg',
  'g',
  'l',
  'ml',
  'pcs',
  'unit',
  'dozen',
  'box',
  'pack',
  'bag',
  'bottle',
];

export const getPopularUOMs = () => {
  return COMMON_UOMS.filter((uom) => POPULAR_UOMS.includes(uom.value));
};

// ==================== Search UOMs ====================

export const searchUOMs = (query) => {
  const lowerQuery = query.toLowerCase();
  return COMMON_UOMS.filter(
    (uom) =>
      uom.label.toLowerCase().includes(lowerQuery) ||
      uom.value.toLowerCase().includes(lowerQuery) ||
      uom.symbol.toLowerCase().includes(lowerQuery)
  );
};
