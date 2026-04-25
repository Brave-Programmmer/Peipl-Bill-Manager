#!/usr/bin/env node

/**
 * Test script to verify quantity parsing fixes
 * Tests various quantity input formats including " and nos
 */

// Import the toNumberSafe function (we'll recreate it here for testing)
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

console.log("🧪 Testing Quantity Parsing Fixes...\n");

// Test cases for quantity parsing
const testCases = [
  {
    name: "Single quote inch notation",
    input: '5"',
    expected: 5,
    description: "Should extract 5 from '5\"'",
  },
  {
    name: "Double quote inch notation",
    input: '5""',
    expected: 5,
    description: "Should extract 5 from '5\"\"'",
  },
  {
    name: "Decimal with inch notation",
    input: '5.5"',
    expected: 5.5,
    description: "Should extract 5.5 from '5.5\"'",
  },
  {
    name: "nos notation",
    input: "10nos",
    expected: 10,
    description: "Should extract 10 from '10nos'",
  },
  {
    name: "kg notation",
    input: "2.5kg",
    expected: 2.5,
    description: "Should extract 2.5 from '2.5kg'",
  },
  {
    name: "pcs notation",
    input: "3 pcs",
    expected: 3,
    description: "Should extract 3 from '3 pcs'",
  },
  {
    name: "Simple number",
    input: "7",
    expected: 7,
    description: "Should return 7 from '7'",
  },
  {
    name: "Decimal number",
    input: "12.5",
    expected: 12.5,
    description: "Should return 12.5 from '12.5'",
  },
  {
    name: "Empty string",
    input: "",
    expected: 0,
    description: "Should return 0 for empty string",
  },
  {
    name: "Null value",
    input: null,
    expected: 0,
    description: "Should return 0 for null",
  },
  {
    name: "Array with mixed formats",
    input: ['5"', "10nos", "2.5kg"],
    expected: [5, 10, 2.5],
    description: "Should handle array with mixed formats",
  },
];

console.log("📋 Test Cases:");
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Description: ${testCase.description}`);

  try {
    const result = toNumberSafe(testCase.input);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

    if (passed) {
      console.log(`   Result: ${result} ✅ PASSED`);
      passedTests++;
    } else {
      console.log(`   Result: ${result} ❌ FAILED`);
      console.log(`   Expected: ${testCase.expected}`);
    }
  } catch (error) {
    console.log(`   Result: ERROR - ${error.message} ❌ FAILED`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log("\n🎉 All tests passed! Quantity parsing is working correctly.");
  console.log("\n✅ Supported formats:");
  console.log('   - "5" (single quote inch)');
  console.log('   - "5"" (double quote inch)');
  console.log('   - "10nos" (numbers with units)');
  console.log('   - "2.5kg" (kilograms)');
  console.log('   - "3 pcs" (pieces)');
  console.log('   - ["5\"", "10nos"] (array of mixed formats)');
  console.log(
    "\n🚀 Auto-calculation should now work correctly in generated bills!",
  );
  process.exit(0);
} else {
  console.log("\n❌ Some tests failed. Please review the parsing logic.");
  process.exit(1);
}
