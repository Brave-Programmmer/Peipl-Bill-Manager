#!/usr/bin/env node

/**
 * Test script for quantity field fixes
 * Tests various quantity input formats
 */

// Import the validation functions
const { validateCompleteBillData } = require('../src/utils/billValidation.js');

console.log('🧪 Testing Quantity Field Fixes...\n');

// Test cases for quantity validation
const testCases = [
  {
    name: "Single quantity with inches",
    data: {
      billNumber: "TEST001",
      items: [
        {
          description: "Test Item",
          quantity: "5\"",  // This should work now
          rate: "100"
        }
      ]
    },
    shouldPass: true
  },
  {
    name: "Array quantity with mixed formats",
    data: {
      billNumber: "TEST002",
      items: [
        {
          description: "Test Item",
          quantity: ["5\"", "4nos"],  // Array with different formats
          rate: ["100", "200"]
        }
      ]
    },
    shouldPass: true
  },
  {
    name: "Single quantity with units",
    data: {
      billNumber: "TEST003",
      items: [
        {
          description: "Test Item",
          quantity: "10kg",
          rate: "50"
        }
      ]
    },
    shouldPass: true
  },
  {
    name: "Empty quantity array",
    data: {
      billNumber: "TEST004",
      items: [
        {
          description: "Test Item",
          quantity: [""],
          rate: "100"
        }
      ]
    },
    shouldPass: false,
    expectedError: "At least one quantity is required"
  },
  {
    name: "Empty quantity string",
    data: {
      billNumber: "TEST005",
      items: [
        {
          description: "Test Item",
          quantity: "",
          rate: "100"
        }
      ]
    },
    shouldPass: false,
    expectedError: "Quantity is required"
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  
  try {
    const validation = validateCompleteBillData(testCase.data, {});
    
    if (testCase.shouldPass) {
      if (validation.isValid) {
        console.log('✅ PASSED - Validation succeeded as expected');
        passedTests++;
      } else {
        console.log('❌ FAILED - Expected validation to pass but got errors:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      if (!validation.isValid) {
        const hasExpectedError = validation.errors.some(error => 
          error.toLowerCase().includes(testCase.expectedError.toLowerCase())
        );
        
        if (hasExpectedError) {
          console.log('✅ PASSED - Validation failed as expected');
          passedTests++;
        } else {
          console.log('❌ FAILED - Expected specific error but got:');
          validation.errors.forEach(error => console.log(`   - ${error}`));
          console.log(`   Expected: ${testCase.expectedError}`);
        }
      } else {
        console.log('❌ FAILED - Expected validation to fail but it passed');
      }
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
  } catch (error) {
    console.log(`❌ ERROR - Test failed with exception: ${error.message}`);
  }
});

console.log(`\n📊 Test Results:`);
console.log(`Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Quantity field fixes are working correctly.');
  console.log('\n✅ You can now use quantities like:');
  console.log('   - "5" (inches)');
  console.log('   - "4nos" (numbers with units)');
  console.log('   - "10kg" (kilograms)');
  console.log('   - ["5\"", "4nos"] (array of mixed formats)');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the validation logic.');
  process.exit(1);
}
