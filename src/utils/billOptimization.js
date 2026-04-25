/**
 * AI-powered bill optimization and suggestion engine
 */

import { sumCell } from "./billCalculations";

/**
 * Generate intelligent bill suggestions based on bill data
 */
export function generateBillSuggestions(billData, companyInfo) {
  const suggestions = [];
  const warnings = [];
  const optimizations = [];

  if (!billData || !billData.items || billData.items.length === 0) {
    return {
      suggestions: ["Start by adding items to your bill"],
      warnings: ["No items found in bill"],
      optimizations: [],
    };
  }

  const items = billData.items;
  const total = billData.total || 0;
  const subtotal = items.reduce((sum, item) => sum + sumCell(item.amount), 0);

  // Analyze items for potential issues
  items.forEach((item, index) => {
    const amount = sumCell(item.amount);
    const quantity = sumCell(item.quantity);
    const rate = sumCell(item.rate);

    // Check for zero or negative values
    if (amount <= 0) {
      warnings.push(
        `Item ${index + 1}: ${item.description || "Unknown item"} has zero or negative amount`,
      );
    }

    // Check for unusually high rates
    if (rate > 10000) {
      warnings.push(
        `Item ${index + 1}: Very high rate (₹${rate.toFixed(2)}) - please verify`,
      );
    }

    // Check for missing descriptions
    if (!item.description || item.description.trim().length < 3) {
      warnings.push(`Item ${index + 1}: Missing or incomplete description`);
    }

    // Check for decimal precision issues
    if (quantity % 1 !== 0 && quantity.toString().split(".")[1]?.length > 2) {
      optimizations.push(
        `Item ${index + 1}: Consider rounding quantity to 2 decimal places`,
      );
    }
  });

  // GST optimization suggestions
  const gstRates = [5, 12, 18, 28];
  const hasGST = billData.cgst || billData.sgst || billData.igst;

  if (hasGST) {
    const cgstAmount = parseFloat(billData.cgst) || 0;
    const sgstAmount = parseFloat(billData.sgst) || 0;
    const totalGST = cgstAmount + sgstAmount;

    // Check if GST rate matches standard rates
    const estimatedRate = (totalGST / subtotal) * 100;
    const closestRate = gstRates.reduce((prev, curr) =>
      Math.abs(curr - estimatedRate) < Math.abs(prev - estimatedRate)
        ? curr
        : prev,
    );

    if (Math.abs(estimatedRate - closestRate) > 0.5) {
      warnings.push(
        `GST rate appears to be ${estimatedRate.toFixed(1)}% - consider using standard rate ${closestRate}%`,
      );
    }
  } else if (total > 100000) {
    suggestions.push("Consider adding GST details for bills over ₹1,00,000");
  }

  // Bill size optimizations
  if (items.length > 20) {
    suggestions.push(
      "Large bill detected - consider splitting into multiple bills for better organization",
    );
  }

  if (total > 500000) {
    suggestions.push(
      "High-value bill - ensure all details are accurate and consider advance payment terms",
    );
  }

  // Company information suggestions
  if (!companyInfo?.name) {
    suggestions.push("Add company information for professional appearance");
  }

  if (!companyInfo?.gst && total > 50000) {
    suggestions.push("Add GST number for compliance on larger bills");
  }

  if (!companyInfo?.phone && !companyInfo?.email) {
    suggestions.push("Add contact information for customer support");
  }

  // Pricing optimizations
  const highValueItems = items.filter((item) => sumCell(item.amount) > 50000);
  if (highValueItems.length > 0) {
    optimizations.push(
      `${highValueItems.length} high-value item(s) found - ensure detailed descriptions`,
    );
  }

  // Duplicate item detection
  const itemDescriptions = items.map((item) =>
    item.description?.toLowerCase().trim(),
  );
  const duplicates = itemDescriptions.filter(
    (desc, index) => desc && itemDescriptions.indexOf(desc) !== index,
  );

  if (duplicates.length > 0) {
    optimizations.push(
      "Potential duplicate items found - consider consolidating",
    );
  }

  return {
    suggestions: suggestions.slice(0, 5), // Limit to top 5
    warnings: warnings.slice(0, 5), // Limit to top 5
    optimizations: optimizations.slice(0, 3), // Limit to top 3
  };
}

/**
 * Generate bill quality score
 */
export function calculateBillQualityScore(billData, companyInfo) {
  let score = 0;
  const maxScore = 100;

  if (!billData || !billData.items || billData.items.length === 0) {
    return 0;
  }

  // Basic completeness (40 points)
  if (billData.billNumber) score += 10;
  if (billData.customerName) score += 10;
  if (billData.items.length > 0) score += 10;
  if (billData.total > 0) score += 10;

  // Item quality (30 points)
  const validItems = billData.items.filter(
    (item) =>
      item.description && item.quantity > 0 && item.rate > 0 && item.amount > 0,
  );
  score += Math.min(30, (validItems.length / billData.items.length) * 30);

  // Company information (20 points)
  if (companyInfo?.name) score += 5;
  if (companyInfo?.address) score += 5;
  if (companyInfo?.phone || companyInfo?.email) score += 5;
  if (companyInfo?.gst) score += 5;

  // GST compliance (10 points)
  if (billData.cgst || billData.sgst || billData.igst) {
    score += 10;
  }

  return Math.round(score);
}
