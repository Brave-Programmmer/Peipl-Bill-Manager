// Bill validation utilities

export function validateCompleteBillData(billData, companyInfo) {
  const errors = [];
  const warnings = [];

  // Validate bill data
  if (!billData) {
    errors.push("Bill data is missing");
    return { isValid: false, errors, warnings };
  }

  // Required fields
  if (!billData.billNumber || billData.billNumber.trim() === '') {
    errors.push("Bill number is required");
  }

  if (!billData.items || !Array.isArray(billData.items)) {
    errors.push("Bill items must be an array");
  } else if (billData.items.length === 0) {
    errors.push("Bill must contain at least one item");
  } else {
    // Validate each item
    billData.items.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      
      // Handle both array and single value for quantity
      const quantity = item.quantity;
      if (!quantity) {
        errors.push(`Item ${index + 1}: Quantity is required`);
      } else if (Array.isArray(quantity)) {
        if (quantity.every(q => !q || q.trim() === '')) {
          errors.push(`Item ${index + 1}: At least one quantity is required`);
        }
      } else if (typeof quantity === 'string' && quantity.trim() === '') {
        errors.push(`Item ${index + 1}: Quantity is required`);
      }
      
      // Handle both array and single value for rate
      const rate = item.rate;
      if (!rate) {
        errors.push(`Item ${index + 1}: Rate is required`);
      } else if (Array.isArray(rate)) {
        if (rate.every(r => !r || r.trim() === '')) {
          errors.push(`Item ${index + 1}: At least one rate is required`);
        }
      } else if (typeof rate === 'string' && rate.trim() === '') {
        errors.push(`Item ${index + 1}: Rate is required`);
      }
    });
  }

  // Validate company info
  if (!companyInfo) {
    warnings.push("Company information is not set");
  } else {
    if (!companyInfo.name || companyInfo.name.trim() === '') {
      warnings.push("Company name is not set");
    }
    if (!companyInfo.address || companyInfo.address.trim() === '') {
      warnings.push("Company address is not set");
    }
  }

  // Check for potential issues
  if (billData.items && billData.items.length > 50) {
    warnings.push("Bill contains more than 50 items - consider splitting into multiple bills");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    itemCount: billData.items?.length || 0
  };
}

export function sanitizeBillNumber(billNumber) {
  if (!billNumber) return "invoice";
  return billNumber
    .replace(/[^a-z0-9\s\-_]/gi, "")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .substring(0, 50); // Limit length
}

export function generateDefaultFileName(billData) {
  const sanitizedNumber = sanitizeBillNumber(billData.billNumber);
  const date = new Date().toISOString().split("T")[0];
  return `bill_${sanitizedNumber}_${date}.peiplbill`;
}
