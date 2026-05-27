/**
 * Calculate delivery fee based on active delivery charge rules.
 *
 * How the DeliveryCharge rule works (based on admin UI):
 *   - minOrderValue  = the FREE delivery threshold (e.g. ₹500)
 *   - chargeAmount   = the delivery fee charged when order is BELOW the threshold (e.g. ₹50)
 *
 * Correct logic:
 *   - cartTotal >= rule.minOrderValue  →  FREE delivery (₹0)
 *   - cartTotal <  rule.minOrderValue  →  rule.chargeAmount (₹50)
 *
 * When NO rules are configured → fall back to product-level shipping.
 *
 * @param {number} cartTotal - Total cart value (before discounts)
 * @param {Array}  rules     - Active delivery charge rules (ordered by minOrderValue DESC)
 * @param {Array}  cartItems - Cart items (used only when no rules exist for product-level fallback)
 * @returns {Object} Object with finalDeliveryFee, freeDeliveryThreshold, appliedRule, usingProductShipping
 */
export function calculateDeliveryFee(cartTotal, rules, cartItems = []) {
  if (rules.length === 0) {
    // No rules configured — fall back to product-level shipping
    const productShipping = calculateProductShipping(cartItems);
    return {
      finalDeliveryFee: productShipping,
      freeDeliveryThreshold: 0,
      appliedRule: null,
      usingProductShipping: true,
    };
  }

  // Rules are sorted by minOrderValue DESC — use the first (primary) rule.
  const primaryRule = rules[0];

  if (cartTotal >= primaryRule.minOrderValue) {
    // ✅ Cart meets or exceeds the free-delivery threshold → FREE delivery
    return {
      finalDeliveryFee: 0,
      freeDeliveryThreshold: primaryRule.minOrderValue,
      appliedRule: primaryRule,
      usingProductShipping: false,
    };
  }

  // ✅ Cart is below the threshold → charge the configured fee (e.g. ₹50)
  return {
    finalDeliveryFee: primaryRule.chargeAmount,
    freeDeliveryThreshold: primaryRule.minOrderValue,
    appliedRule: primaryRule,
    usingProductShipping: false,
  };
}

/**
 * Fallback: calculate shipping from product-level charges (used only when no DB rules exist).
 * Returns the MAXIMUM shipping charge among items.
 * If any item has freeShipping = true, the entire order gets free delivery.
 */
function calculateProductShipping(cartItems) {
  const hasFreeShipping = cartItems.some(item => item.freeShipping === true);
  if (hasFreeShipping) return 0;

  const shippingCharges = cartItems
    .map(item => item.shippingCharge || 0)
    .filter(charge => charge > 0);

  if (shippingCharges.length === 0) return 0;
  return Math.max(...shippingCharges);
}
