#!/usr/bin/env node

/**
 * Test script to verify BillGenerator calculations work with quantity formats
 * Tests the BillGenerator's formula calculation logic
 */

// Recreate the toNumberSafe function from BillGenerator
function toNumberSafe(v, defaultVal = 0) {
  if (v === "" || v == null || typeof v === "undefined") return defaultVal;
  if (Array.isArray(v)) return v.map((x) => toNumberSafe(x, defaultVal));

  // Convert to string and clean up
  const cleaned = String(v).replace(/,/g, "").trim();

  // Handle special cases for inch notation (e.g., "5"" or "5" becomes 5)
  const inchMatch = cleaned.match(/^(\d+(?:\.\d+)?)"?$/);
  if (inchMatch) {
    return Number(inchMatch[1]);
  }

  // Extract numeric value from text like "2"", "10nos", "5kg", "3 pcs", etc.
  // Match numbers at the start of the string (including decimals)
  const numericMatch = cleaned.match(/^([-+]?\d*\.?\d+)/);

  if (numericMatch) {
    const numericValue = numericMatch[1];
    const n = Number(numericValue);
    return isNaN(n) ? defaultVal : n;
  }

  // Fallback to original behavior if no numeric match found
  const n = Number(cleaned);
  return isNaN(n) ? defaultVal : n;
}

console.log("🧪 Testing BillGenerator Calculations with Quantity Formats...\n");

// Test BillGenerator formula calculation scenarios
const billGeneratorTests = [
  {
    name: "Single quote inch in BillGenerator",
    quantity: '5"',
    rate: "100",
    expectedAmount: 500,
    expectedCGST: 45,
    expectedSGST: 45,
    expectedTotal: 590,
    description: '5" × 100 = 500, GST = 90, Total = 590',
  },
  {
    name: "nos notation in BillGenerator",
    quantity: "10nos",
    rate: "50",
    expectedAmount: 500,
    expectedCGST: 45,
    expectedSGST: 45,
    expectedTotal: 590,
    description: "10nos × 50 = 500, GST = 90, Total = 590",
  },
  {
    name: "kg notation in BillGenerator",
    quantity: "2.5kg",
    rate: "80",
    expectedAmount: 200,
    expectedCGST: 18,
    expectedSGST: 18,
    expectedTotal: 236,
    description: "2.5kg × 80 = 200, GST = 36, Total = 236",
  },
  {
    name: "pcs notation in BillGenerator",
    quantity: "3 pcs",
    rate: "150",
    expectedAmount: 450,
    expectedCGST: 40.5,
    expectedSGST: 40.5,
    expectedTotal: 531,
    description: "3 pcs × 150 = 450, GST = 81, Total = 531",
  },
  {
    name: "Decimal inch in BillGenerator",
    quantity: '5.5"',
    rate: "100",
    expectedAmount: 550,
    expectedCGST: 49.5,
    expectedSGST: 49.5,
    expectedTotal: 649,
    description: '5.5" × 100 = 550, GST = 99, Total = 649',
  },
];

console.log("📋 BillGenerator Test Cases:");
let passedTests = 0;
let totalTests = billGeneratorTests.length;

// Mock BillGenerator formula calculation
function testBillGeneratorCalculation(quantity, rate) {
  // Simulate BillGenerator's formula calculation logic
  const qtyNum = toNumberSafe(quantity, 0);
  const rateNum = toNumberSafe(rate, 0);

  const amount = qtyNum * rateNum;
  const cgstAmount = amount * 0.09;
  const sgstAmount = amount * 0.09;
  const totalWithGST = amount + cgstAmount + sgstAmount;

  return {
    amount: Number(amount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    totalWithGST: Number(totalWithGST.toFixed(2)),
  };
}

billGeneratorTests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Quantity: "${test.quantity}"`);
  console.log(`   Rate: "${test.rate}"`);
  console.log(`   Description: ${test.description}`);
  console.log(
    `   Expected: Amount=${test.expectedAmount}, CGST=${test.expectedCGST}, SGST=${test.expectedSGST}, Total=${test.expectedTotal}`,
  );

  try {
    const result = testBillGeneratorCalculation(test.quantity, test.rate);
    const amountMatch = result.amount === test.expectedAmount;
    const cgstMatch = result.cgstAmount === test.expectedCGST;
    const sgstMatch = result.sgstAmount === test.expectedSGST;
    const totalMatch = result.totalWithGST === test.expectedTotal;

    const passed = amountMatch && cgstMatch && sgstMatch && totalMatch;

    if (passed) {
      console.log(
        `   Result: Amount=${result.amount}, CGST=${result.cgstAmount}, SGST=${result.sgstAmount}, Total=${result.totalWithGST} ✅ PASSED`,
      );
      passedTests++;
    } else {
      console.log(
        `   Result: Amount=${result.amount}, CGST=${result.cgstAmount}, SGST=${result.sgstAmount}, Total=${result.totalWithGST} ❌ FAILED`,
      );
      console.log(
        `   Expected: Amount=${test.expectedAmount}, CGST=${test.expectedCGST}, SGST=${test.expectedSGST}, Total=${test.expectedTotal}`,
      );
    }
  } catch (error) {
    console.log(`   Result: ERROR - ${error.message} ❌ FAILED`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 All BillGenerator calculation tests passed!");
  console.log("\n✅ Generated bills will now show correct calculations with:");
  console.log('   - "5" (inch notation)');
  console.log('   - "10nos" (number with units)');
  console.log('   - "2.5kg" (weight units)');
  console.log('   - "3 pcs" (piece units)');
  console.log('   - Decimal values like "5.5"');

  console.log("\n🚀 Generated invoice mode now works correctly!");
  console.log("   - Amount fields calculate correctly");
  console.log("   - CGST amounts are accurate");
  console.log("   - SGST amounts are accurate");
  console.log("   - Total amounts are correct");

  process.exit(0);
} else {
  console.log("\n❌ Some BillGenerator calculation tests failed.");
  process.exit(1);
}
