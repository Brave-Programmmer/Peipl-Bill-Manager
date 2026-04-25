import {
  roundTo,
  calculateTotal,
  calculateItemTaxes,
} from "../src/utils/billCalculations.js";

console.log("🧪 Running Billing Integration Tests...\n");

let passCount = 0;
let totalTests = 0;

function assertEquals(actual, expected, message) {
  if (Math.abs(actual - expected) > 0.0001) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${expected}, but got ${actual}`,
    );
  }
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ ${name} passed`);
    passCount++;
  } catch (error) {
    console.error(`❌ ${name} failed: ${error.message}`);
  }
}

test("Multi-item Bill with Different Tax Rates", () => {
  // Scenario:
  // Item 1: 10 qty, 100 rate, 9% CGST, 9% SGST
  // Item 2: 1 qty, 1000 rate, 18% IGST

  const item1Amount = 10 * 100;
  const item1Taxes = calculateItemTaxes(item1Amount, 0.09, 0.09, 0);

  const item2Amount = 1 * 1000;
  const item2Taxes = calculateItemTaxes(item2Amount, 0, 0, 0.18);

  const items = [
    { amount: item1Amount, ...item1Taxes },
    { amount: item2Amount, ...item2Taxes },
  ];

  // Item 1: 1000 + 90 + 90 = 1180
  // Item 2: 1000 + 0 + 0 + 180 = 1180
  // Total: 2360

  assertEquals(calculateTotal(items), 2360, "Grand total mismatch");
});

console.log(`\n📊 Results: ${passCount}/${totalTests} tests passed`);
if (passCount !== totalTests) process.exit(1);
