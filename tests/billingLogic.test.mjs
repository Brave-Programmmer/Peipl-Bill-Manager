import {
  roundTo,
  calculateSubtotal,
  calculateTotalCGST,
  calculateTotalSGST,
  calculateTotal,
  calculateItemTaxes,
} from "../src/utils/billCalculations.js";

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ ${name} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed: ${error.message}`);
    return false;
  }
}

function assertEquals(actual, expected, message) {
  if (Math.abs(actual - expected) > 0.0001) {
    throw new Error(
      `${message || "Assertion failed"}: expected ${expected}, but got ${actual}`,
    );
  }
}

console.log("🧪 Running Billing Logic Tests...\n");

let passCount = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  if (runTest(name, fn)) passCount++;
}

test("roundTo should round correctly", () => {
  assertEquals(roundTo(10.123, 2), 10.12);
  assertEquals(roundTo(10.125, 2), 10.13);
  assertEquals(roundTo(10.124, 2), 10.12);
  assertEquals(roundTo(10.5, 0), 11);
});

test("calculateSubtotal should sum item amounts", () => {
  const items = [
    { amount: 100 },
    { amount: 200.5 },
    { amount: [50, 50] }, // Testing array support
  ];
  assertEquals(calculateSubtotal(items), 400.5);
});

test("calculateTotalCGST should sum CGST amounts", () => {
  const items = [
    { cgstAmount: 9 },
    { cgstAmount: 18.045 }, // Should round to 18.05
    { cgstAmount: [4.5, 4.5] },
  ];
  // 9 + 18.05 + 9 = 36.05
  assertEquals(calculateTotalCGST(items), 36.05);
});

test("calculateItemTaxes should calculate taxes correctly", () => {
  const taxable = 1000;
  const taxes = calculateItemTaxes(taxable, 0.09, 0.09);
  assertEquals(taxes.cgstAmount, 90);
  assertEquals(taxes.sgstAmount, 90);
  assertEquals(taxes.totalWithGST, 1180);
});

test("calculateTotal should sum subtotal and taxes", () => {
  const items = [
    { amount: 1000, cgstAmount: 90, sgstAmount: 90, igstAmount: 0 },
    { amount: 500, cgstAmount: 45, sgstAmount: 45, igstAmount: 0 },
  ];
  // Subtotal: 1500, CGST: 135, SGST: 135, IGST: 0 -> Total: 1770
  assertEquals(calculateTotal(items), 1770);
});

test("handle edge cases for empty/null items", () => {
  assertEquals(calculateSubtotal(null), 0);
  assertEquals(calculateSubtotal([]), 0);
  assertEquals(calculateTotal(null), 0);
});

console.log(`\n📊 Results: ${passCount}/${totalTests} tests passed`);
if (passCount !== totalTests) process.exit(1);
