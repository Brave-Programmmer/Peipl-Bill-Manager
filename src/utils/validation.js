/**
 * Enhanced validation utilities for bill data
 * Provides comprehensive validation for inputs, formulas, and data integrity
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate GST number format (Indian GST)
 * @param {string} gst
 * @returns {boolean}
 */
export const validateGST = (gst) => {
  if (!gst || typeof gst !== "string") return false;
  // Indian GST format: 2 digits (state code) + 10 alphanumeric + 1 digit + 1 letter + 1 digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.trim().toUpperCase());
};

/**
 * Validate PAN format (Permanent Account Number)
 * @param {string} pan
 * @returns {boolean}
 */
export const validatePAN = (pan) => {
  if (!pan || typeof pan !== "string") return false;
  // PAN format: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  // Allow 10 digits, with optional country code +91 or 0 prefix
  const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.trim().replace(/[\s\-()]/g, ""));
};

/**
 * Validate number input
 * @param {string|number} value
 * @returns {{valid: boolean, error?: string}}
 */
export const validateNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return { valid: true }; // Empty is valid (means 0)
  }

  const stringValue = String(value).trim();

  // Check for valid number format
  if (!/^-?\d+\.?\d*$/.test(stringValue)) {
    return { valid: false, error: "Invalid number format" };
  }

  const num = parseFloat(stringValue);

  if (isNaN(num)) {
    return { valid: false, error: "Not a valid number" };
  }

  if (!isFinite(num)) {
    return { valid: false, error: "Number is too large or too small" };
  }

  // Warn about very large numbers
  if (Math.abs(num) > 9999999999) {
    return { valid: true, warning: "Number is very large" };
  }

  return { valid: true };
};

/**
 * Validate bill number format
 * @param {string} billNumber
 * @returns {{valid: boolean, error?: string}}
 */
export const validateBillNumber = (billNumber) => {
  if (!billNumber || typeof billNumber !== "string") {
    return { valid: false, error: "Bill number is required" };
  }

  const trimmed = billNumber.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Bill number cannot be empty" };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "Bill number is too long (max 50 characters)" };
  }

  // Check for special characters that might cause issues
  if (!/^[a-zA-Z0-9\-/\s\.]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Bill number contains invalid characters",
    };
  }

  return { valid: true };
};

/**
 * Validate customer name
 * @param {string} name
 * @returns {{valid: boolean, error?: string}}
 */
export const validateCustomerName = (name) => {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Customer name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Customer name cannot be empty" };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: "Customer name is too long (max 200 characters)" };
  }

  return { valid: true };
};

/**
 * Validate address
 * @param {string} address
 * @returns {{valid: boolean, error?: string}}
 */
export const validateAddress = (address) => {
  if (!address || typeof address !== "string") {
    return { valid: false, error: "Address is required" };
  }

  const trimmed = address.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Address cannot be empty" };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: "Address is too long (max 500 characters)" };
  }

  return { valid: true };
};

/**
 * Validate bill items
 * @param {Array} items
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateBillItems = (items) => {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("Please add at least one item");
    return { valid: false, errors };
  }

  items.forEach((item, index) => {
    // Validate quantity
    const qtyValidation = validateNumber(item.quantity);
    if (!qtyValidation.valid) {
      errors.push(`Item ${index + 1}: ${qtyValidation.error}`);
    } else if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }

    // Validate rate
    const rateValidation = validateNumber(item.rate);
    if (!rateValidation.valid) {
      errors.push(`Item ${index + 1}: ${rateValidation.error}`);
    } else if (item.rate < 0) {
      errors.push(`Item ${index + 1}: Rate cannot be negative`);
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Validate complete bill data
 * @param {Object} billData
 * @param {Object} companyInfo
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateCompleteBillData = (billData, companyInfo) => {
  const errors = [];

  // Validate bill number
  const billNumValidation = validateBillNumber(billData.billNumber);
  if (!billNumValidation.valid) {
    errors.push(`Bill Number: ${billNumValidation.error}`);
  }

  // Validate customer name
  const customerNameValidation = validateCustomerName(billData.customerName);
  if (!customerNameValidation.valid) {
    errors.push(`Customer Name: ${customerNameValidation.error}`);
  }

  // Validate customer address
  const addressValidation = validateAddress(billData.customerAddress);
  if (!addressValidation.valid) {
    errors.push(`Customer Address: ${addressValidation.error}`);
  }

  // Validate GST if provided
  if (billData.customerGST && !validateGST(billData.customerGST)) {
    errors.push("Customer GST Number format is invalid");
  }

  // Validate items
  const itemsValidation = validateBillItems(billData.items || []);
  if (!itemsValidation.valid) {
    errors.push(...itemsValidation.errors);
  }

  // Validate company info
  if (companyInfo) {
    if (!companyInfo.name || companyInfo.name.trim() === "") {
      errors.push("Company name is required");
    }
    if (
      companyInfo.email &&
      companyInfo.email.trim() !== "" &&
      !validateEmail(companyInfo.email)
    ) {
      errors.push("Company email format is invalid");
    }
    if (
      companyInfo.gst &&
      companyInfo.gst.trim() !== "" &&
      !validateGST(companyInfo.gst)
    ) {
      errors.push("Company GST format is invalid");
    }
    if (
      companyInfo.pan &&
      companyInfo.pan.trim() !== "" &&
      !validatePAN(companyInfo.pan)
    ) {
      errors.push("Company PAN format is invalid");
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input
 * @returns {string}
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return String(input);

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

/**
 * Validate file size
 * @param {File} file
 * @param {number} maxSizeMB
 * @returns {{valid: boolean, error?: string}}
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
};

/**
 * Validate JSON file
 * @param {string} jsonString
 * @returns {{valid: boolean, error?: string, data?: any}}
 */
export const validateJSONFile = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== "object") {
      return {
        valid: false,
        error: "Invalid JSON structure",
      };
    }
    return { valid: true, data };
  } catch (err) {
    return {
      valid: false,
      error: `JSON parsing error: ${err.message}`,
    };
  }
};

/**
 * Check if value has changed
 * @param {any} oldValue
 * @param {any} newValue
 * @returns {boolean}
 */
export const hasChanged = (oldValue, newValue) => {
  return JSON.stringify(oldValue) !== JSON.stringify(newValue);
};

/**
 * Deep clone object
 * @param {Object} obj
 * @returns {Object}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
