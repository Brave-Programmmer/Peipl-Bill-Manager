/**
 * Utility functions for bill calculations
 * Handles both array and single value formats for item fields
 */

/**
 * Safely sums a cell value that might be an array or single number
 * @param {any} cell - The cell value (array or single value)
 * @returns {number} The sum of the cell values
 */
export function sumCell(cell) {
  if (Array.isArray(cell)) {
    return cell.reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }
  return parseFloat(cell) || 0;
}

/**
 * Rounds a number to a specific number of decimal places
 * @param {number} num - The number to round
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {number} Rounded number
 */
export function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Gets the total taxable amount for all items
 * @param {Array} items - Array of bill items
 * @returns {number} Total taxable amount
 */
export function calculateSubtotal(items) {
  if (!items || !Array.isArray(items)) return 0;
  return roundTo(items.reduce((sum, item) => sum + sumCell(item.amount), 0));
}

/**
 * Gets the total CGST amount for all items
 * @param {Array} items - Array of bill items
 * @returns {number} Total CGST amount
 */
export function calculateTotalCGST(items) {
  if (!items || !Array.isArray(items)) return 0;
  return roundTo(
    items.reduce((sum, item) => sum + sumCell(item.cgstAmount), 0),
  );
}

/**
 * Gets the total SGST amount for all items
 * @param {Array} items - Array of bill items
 * @returns {number} Total SGST amount
 */
export function calculateTotalSGST(items) {
  if (!items || !Array.isArray(items)) return 0;
  return roundTo(
    items.reduce((sum, item) => sum + sumCell(item.sgstAmount), 0),
  );
}

/**
 * Gets the total IGST amount for all items
 * @param {Array} items - Array of bill items
 * @returns {number} Total IGST amount
 */
export function calculateTotalIGST(items) {
  if (!items || !Array.isArray(items)) return 0;
  return roundTo(
    items.reduce((sum, item) => sum + sumCell(item.igstAmount), 0),
  );
}

/**
 * Gets the grand total for all items
 * @param {Array} items - Array of bill items
 * @returns {number} Grand total
 */
export function calculateTotal(items) {
  const subtotal = calculateSubtotal(items);
  const cgst = calculateTotalCGST(items);
  const sgst = calculateTotalSGST(items);
  const igst = calculateTotalIGST(items);
  return roundTo(subtotal + cgst + sgst + igst);
}

/**
 * Calculates item level taxes based on taxable amount and tax rates
 * @param {number} taxableAmount - The taxable amount
 * @param {number} cgstRate - CGST rate (e.g. 0.09 for 9%)
 * @param {number} sgstRate - SGST rate (e.g. 0.09 for 9%)
 * @param {number} igstRate - IGST rate (e.g. 0.18 for 18%)
 * @returns {Object} Calculated tax amounts
 */
export function calculateItemTaxes(
  taxableAmount,
  cgstRate = 0,
  sgstRate = 0,
  igstRate = 0,
) {
  return {
    cgstAmount: roundTo(taxableAmount * cgstRate),
    sgstAmount: roundTo(taxableAmount * sgstRate),
    igstAmount: roundTo(taxableAmount * igstRate),
    totalWithGST: roundTo(taxableAmount * (1 + cgstRate + sgstRate + igstRate)),
  };
}
