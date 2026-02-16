#!/usr/bin/env node

/**
 * Test script for bill saving mechanism
 * Tests various scenarios to ensure robust saving
 */

const fs = require('fs');
const path = require('path');

// Test data scenarios
const testScenarios = [
  {
    name: "Valid Complete Bill",
    data: {
      billNumber: "TEST001",
      date: "2025-01-15",
      customerName: "Test Customer",
      items: [
        {
          id: 1,
          description: "Test Item",
          quantity: ["1"],
          rate: ["100"],
          amount: 100,
          cgstAmount: 9,
          sgstAmount: 9,
          totalWithGST: 118
        }
      ],
      companyInfo: {
        name: "Test Company",
        address: "Test Address",
        gst: "27AADCP2938G1ZD"
      }
    },
    shouldPass: true
  },
  {
    name: "Empty Bill Number",
    data: {
      billNumber: "",
      items: [
        {
          description: "Test Item",
          quantity: ["1"],
          rate: ["100"]
        }
      ]
    },
    shouldPass: false,
    expectedError: "Bill number is required"
  },
  {
    name: "No Items",
    data: {
      billNumber: "TEST002",
      items: []
    },
    shouldPass: false,
    expectedError: "Bill must contain at least one item"
  },
  {
    name: "Invalid Item Data",
    data: {
      billNumber: "TEST003",
      items: [
        {
          description: "",
          quantity: [""],
          rate: [""]
        }
      ]
    },
    shouldPass: false,
    expectedError: "Description is required"
  }
];

console.log('🧪 Testing Bill Saving Mechanism...\n');

// Import validation function
const { validateCompleteBillData } = require('../src/utils/billValidation.js');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
  
  try {
    const validation = validateCompleteBillData(scenario.data, scenario.data.companyInfo);
    
    if (scenario.shouldPass) {
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
          error.toLowerCase().includes(scenario.expectedError.toLowerCase())
        );
        
        if (hasExpectedError) {
          console.log('✅ PASSED - Validation failed as expected');
          passedTests++;
        } else {
          console.log('❌ FAILED - Expected specific error but got:');
          validation.errors.forEach(error => console.log(`   - ${error}`));
          console.log(`   Expected: ${scenario.expectedError}`);
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
  console.log('\n🎉 All tests passed! Bill saving mechanism is working correctly.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the validation logic.');
  process.exit(1);
}
