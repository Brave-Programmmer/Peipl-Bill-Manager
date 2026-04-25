// Test script to verify bill number auto-incrementing functionality
const {
  getNextBillNumber,
  incrementBillNumberCounter,
  getCurrentFinancialYear,
} = require("../src/utils/idGenerator.js");

console.log("Testing Bill Number Auto-Incrementing Functionality");
console.log("==================================================");

// Test 1: Get current financial year
console.log("\n1. Current Financial Year:");
const fy = getCurrentFinancialYear();
console.log(`   Financial Year: ${fy}`);

// Test 2: Get next bill number (should be 01 for first time)
console.log("\n2. First Bill Number:");
const firstBill = getNextBillNumber();
console.log(`   Bill Number: ${firstBill}`);

// Test 3: Increment counter and get next number
console.log("\n3. After Incrementing Counter:");
incrementBillNumberCounter(firstBill);
const secondBill = getNextBillNumber();
console.log(`   Next Bill Number: ${secondBill}`);

// Test 4: Increment again
console.log("\n4. After Second Increment:");
incrementBillNumberCounter(secondBill);
const thirdBill = getNextBillNumber();
console.log(`   Next Bill Number: ${thirdBill}`);

// Test 5: Verify format
console.log("\n5. Format Verification:");
const expectedFormat = new RegExp(`^PEIPLCH${fy}/\\d{2}$`);
console.log(`   First bill matches format: ${expectedFormat.test(firstBill)}`);
console.log(
  `   Second bill matches format: ${expectedFormat.test(secondBill)}`,
);
console.log(`   Third bill matches format: ${expectedFormat.test(thirdBill)}`);

console.log("\n✅ Bill number auto-incrementing test completed!");
