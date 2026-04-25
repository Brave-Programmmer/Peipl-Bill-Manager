// Shared utility for generating unique IDs across components
export function generateUniqueId() {
  return String(Date.now()) + Math.random().toString(36).substr(2, 9);
}

export function generateShortId() {
  return Math.random().toString(36).substr(2, 9);
}

export function generateTimestampId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the current financial year string (e.g., "2526" for FY 2025-26)
 * @returns {string} Financial year string
 */
export function getCurrentFinancialYear() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  // If month is Jan-March, use previous year as start of financial year
  const fyStart = month <= 3 ? year - 1 : year;
  const fyEnd = fyStart + 1;
  // Create financial year string (e.g., "2526" for 2025-26)
  return `${fyStart.toString().slice(-2)}${fyEnd.toString().slice(-2)}`;
}

/**
 * Get the next bill number for the current financial year
 * @returns {string} Next bill number in format "PEIPLCH{fyString}/XX"
 */
export function getNextBillNumber() {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    // Server-side or no localStorage available, return default
    const fyString = getCurrentFinancialYear();
    return `PEIPLCH${fyString}/01`;
  }

  const fyString = getCurrentFinancialYear();
  const storageKey = `lastBillNumber_${fyString}`;

  try {
    // Get the last used bill number for this financial year
    const lastBillNumber = localStorage.getItem(storageKey);
    let nextNumber = 1;

    if (lastBillNumber) {
      // Extract the number part from the last bill number
      const match = lastBillNumber.match(/PEIPLCH\d{4}\/(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros to maintain consistent 2-digit format
    const formattedNumber = nextNumber.toString().padStart(2, "0");
    return `PEIPLCH${fyString}/${formattedNumber}`;
  } catch (error) {
    console.warn("Error getting next bill number, using default:", error);
    // Fallback to 01 if there's any issue
    return `PEIPLCH${fyString}/01`;
  }
}

/**
 * Increment the bill number counter after a bill is saved
 * @param {string} billNumber - The bill number that was just saved
 */
export function incrementBillNumberCounter(billNumber) {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    // Server-side or no localStorage available, do nothing
    return;
  }

  try {
    // Extract financial year from bill number
    const match = billNumber.match(/PEIPLCH(\d{4})\//);
    if (match) {
      const fyString = match[1];
      const storageKey = `lastBillNumber_${fyString}`;

      // Store this bill number as the last used one
      localStorage.setItem(storageKey, billNumber);
    }
  } catch (error) {
    console.warn("Error incrementing bill number counter:", error);
  }
}
