import { convertUOMValue } from './uom-utils';

/**
 * Calculate maximum units available for a cart item (UOM-aware)
 * For combo products, maxStock is already calculated by backend based on component availability
 * For regular products, calculate based on shared inventory usage
 */
export const calculateMaxUnits = (targetItem, allItems) => {
  // For combo products, backend already calculated maxStock
  if (targetItem.isComboProduct) {
    return targetItem.maxStock || 0;
  }
  
  // For regular products, calculate based on shared inventory
  const otherItems = allItems.filter(
    item => 
      item.inventoryProductId === targetItem.inventoryProductId &&
      // Exclude THIS item instance
      !(
        item.variantIndex === targetItem.variantIndex && 
        (item.selectedCuttingStyle || '') === (targetItem.selectedCuttingStyle || '')
      )
  );

  let stockAllocatedToOthers = 0;
  const targetUom = targetItem.variantUom;

  // Check regular products with same inventoryProductId
  for (const item of otherItems) {
    let consumption = 0;
    if (item.variantUom && item.variantUomValue) {
      const rawConsumption = item.quantity * item.variantUomValue;
      
      // ✅ Convert to target item's UOM if different
      if (targetUom && item.variantUom !== targetUom) {
        const converted = convertUOMValue(rawConsumption, item.variantUom, targetUom);
        consumption = converted !== null ? converted : rawConsumption;
        
        console.log('📊 UOM conversion for other item:', {
          item: item.displayName,
          rawConsumption,
          fromUom: item.variantUom,
          toUom: targetUom,
          converted: consumption
        });
      } else {
        consumption = rawConsumption;
      }
    } else {
      consumption = item.quantity;
    }
    stockAllocatedToOthers += consumption;
    
    console.log('📊 Stock consumption by other item:', {
      item: item.displayName,
      quantity: item.quantity,
      variantUomValue: item.variantUomValue,
      variantUom: item.variantUom,
      consumption,
      totalAllocated: stockAllocatedToOthers
    });
  }
  
  // Also check combo products that use this inventory as a component
  const comboItems = allItems.filter(item => item.isComboProduct && item.comboItems);
  for (const comboItem of comboItems) {
    if (!comboItem.comboItems) continue;
    
    for (const component of comboItem.comboItems) {
      if (component.inventoryProductId === targetItem.inventoryProductId) {
        const componentQtyPerCombo = component.quantity || 1;
        const componentUomValue = component.variantUomValue || 1;
        const comboQuantity = comboItem.quantity;
        
        const rawConsumption = comboQuantity * componentQtyPerCombo * componentUomValue;
        
        // ✅ Convert to target item's UOM if different
        let consumption = rawConsumption;
        if (targetUom && component.variantUom && component.variantUom !== targetUom) {
          const converted = convertUOMValue(rawConsumption, component.variantUom, targetUom);
          consumption = converted !== null ? converted : rawConsumption;
          
          console.log('📊 UOM conversion for combo component:', {
            combo: comboItem.displayName,
            component: component.productName || component.variantName,
            rawConsumption,
            fromUom: component.variantUom,
            toUom: targetUom,
            converted: consumption
          });
        }
        
        stockAllocatedToOthers += consumption;
        
        console.log('📊 Stock consumption by combo:', {
          combo: comboItem.displayName,
          component: component.productName || component.variantName,
          comboQty: comboQuantity,
          componentQtyPerCombo,
          componentUomValue,
          totalConsumption: consumption,
          totalAllocated: stockAllocatedToOthers
        });
      }
    }
  }

  let remainingStock = targetItem.maxStock || 0;
  
  console.log('📊 Calculating max units for:', {
    item: targetItem.displayName,
    inventoryProductId: targetItem.inventoryProductId,
    variantIndex: targetItem.variantIndex,
    maxStock: targetItem.maxStock,
    variantUom: targetItem.variantUom,
    variantUomValue: targetItem.variantUomValue,
    stockAllocatedToOthers,
    remainingStock: targetItem.maxStock - stockAllocatedToOthers
  });
  
  // If using UOM
  if (targetItem.variantUom && targetItem.variantUomValue && targetItem.variantUomValue > 0) {
    remainingStock = (targetItem.maxStock || 0) - stockAllocatedToOthers;
    const maxUnits = Math.max(0, Math.floor(remainingStock / targetItem.variantUomValue));
    console.log('📊 UOM calculation:', {
      remainingStock,
      variantUomValue: targetItem.variantUomValue,
      maxUnits
    });
    return maxUnits;
  }
  
  // If simple unit based
  remainingStock = (targetItem.maxStock || 0) - stockAllocatedToOthers;
  const maxUnits = Math.max(0, remainingStock);
  console.log('📊 Unit calculation:', {
    remainingStock,
    maxUnits
  });
  return maxUnits;
};

/**
 * Check if cart has any stock issues
 */
export const hasStockIssues = (items) => {
  return items.some(item => {
    const maxUnits = calculateMaxUnits(item, items);
    return item.quantity > maxUnits || maxUnits === 0;
  });
};

/**
 * Get out of stock items
 */
export const getOutOfStockItems = (items) => {
  return items.filter(item => {
    const maxUnits = calculateMaxUnits(item, items);
    return maxUnits === 0;
  });
};

/**
 * Get over stock items (quantity exceeds available)
 */
export const getOverStockItems = (items) => {
  return items.filter(item => {
    const maxUnits = calculateMaxUnits(item, items);
    return item.quantity > maxUnits && maxUnits > 0;
  });
};
