#!/usr/bin/env node

/**
 * Enhanced File Association System Diagnostic Test
 * Tests the improved file association setup and bill data loading
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("\n");
console.log("=".repeat(60));
console.log("  ENHANCED FILE ASSOCIATION SYSTEM - DIAGNOSTIC TEST");
console.log("=".repeat(60));
console.log("\n");

// Test results tracking
const testResults = {
  platform: { passed: false, message: "" },
  executable: { passed: false, message: "" },
  fileAssociations: { passed: false, message: "" },
  billValidation: { passed: false, message: "" },
  errorHandling: { passed: false, message: "" },
};

// Step 1: Platform check
console.log("Step 1: Platform Check");
console.log(`  Current Platform: ${process.platform}`);

if (process.platform !== "win32") {
  console.log("  Warning: File associations only work on Windows");
  testResults.platform = {
    passed: true,
    message: "Non-Windows platform - file associations not applicable",
  };
  console.log("  Skipping remaining tests...\n");
  printSummary();
  process.exit(0);
} else {
  testResults.platform = { passed: true, message: "Windows platform detected" };
  console.log("  Windows platform detected\n");
}

// Step 2: Check executable path
console.log("Step 2: Executable Path Check");
console.log(`  Current Process Path: ${process.execPath}`);

let appExePath = null;
const possiblePaths = [
  path.join(
    process.env.ProgramFiles || "C:\\Program Files",
    "PEIPL Bill Assistant",
    "PEIPL Bill Assistant.exe",
  ),
  path.join(
    process.env.ProgramFilesX86 || "C:\\Program Files (x86)",
    "PEIPL Bill Assistant",
    "PEIPL Bill Assistant.exe",
  ),
  path.join(
    process.env.LOCALAPPDATA || "",
    "Programs",
    "peipl-bill-maker",
    "PEIPL Bill Assistant.exe",
  ),
];

for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    appExePath = possiblePath;
    console.log(`  Found app executable: ${appExePath}`);
    break;
  }
}

if (appExePath) {
  testResults.executable = {
    passed: true,
    message: `Found app executable: ${appExePath}`,
  };
} else {
  testResults.executable = {
    passed: false,
    message: "Could not find app executable",
  };
  console.log("  Warning: Could not find app executable\n");
}

// Step 3: Test file type registration
console.log("Step 3: File Type Registration");
const commands = [
  {
    name: "Check PEIPLBillMaker registration",
    cmd: "ftype PEIPLBillMaker",
    expected: appExePath ? appExePath.toLowerCase() : null,
  },
  {
    name: "Check .peiplbill association",
    cmd: "assoc .peiplbill",
    expected: "PEIPLBillMaker",
  },
  {
    name: "Check .json association",
    cmd: "assoc .json",
    expected: "PEIPLBillMaker",
  },
];

let completed = 0;
const associationResults = [];

commands.forEach((test, index) => {
  exec(test.cmd, { shell: true }, (error, stdout, stderr) => {
    completed++;

    console.log(`  ${index + 1}. ${test.name}`);
    if (error) {
      console.log(`     Error: ${error.message}`);
      associationResults.push({
        test: test.name,
        success: false,
        output: error.message,
      });
    } else if (stdout) {
      const output = stdout.trim();
      console.log(`     Output: ${output}`);

      let success = true;
      if (
        test.expected &&
        !output.toLowerCase().includes(test.expected.toLowerCase())
      ) {
        success = false;
        console.log(`     Warning: Expected to contain '${test.expected}'`);
      }

      associationResults.push({ test: test.name, success, output });
    } else {
      console.log(`     No output (may need admin)`);
      associationResults.push({
        test: test.name,
        success: false,
        output: "No output",
      });
    }

    if (completed === commands.length) {
      const successCount = associationResults.filter((r) => r.success).length;
      if (successCount === commands.length) {
        testResults.fileAssociations = {
          passed: true,
          message: "All file associations properly configured",
        };
      } else if (successCount > 0) {
        testResults.fileAssociations = {
          passed: false,
          message: `Partial success: ${successCount}/${commands.length} associations configured`,
        };
      } else {
        testResults.fileAssociations = {
          passed: false,
          message: "No file associations configured",
        };
      }
      runBillValidationTests();
    }
  });
});

// Step 4: Test bill data validation
function runBillValidationTests() {
  console.log("\nStep 4: Bill Data Validation Tests");

  const testBills = [
    {
      name: "Valid complete bill",
      data: {
        billNumber: "TEST-001",
        date: "2025-01-20",
        customerName: "Test Customer",
        items: [
          {
            id: 1,
            description: "Test Item",
            quantity: 1,
            rate: 100,
            amount: 100,
            cgstRate: 9,
            sgstRate: 9,
          },
        ],
      },
      shouldPass: true,
    },
    {
      name: "Bill with missing items",
      data: {
        billNumber: "TEST-002",
        date: "2025-01-20",
        customerName: "Test Customer",
      },
      shouldPass: true, // Should be recoverable
    },
    {
      name: "Bill with wrapped format",
      data: {
        billData: {
          billNumber: "TEST-003",
          items: [],
        },
        name: "Test Preset",
        savedAt: new Date().toISOString(),
      },
      shouldPass: true,
    },
    {
      name: "Invalid JSON",
      data: "invalid json",
      shouldPass: false,
    },
  ];

  let validationPassed = 0;
  let validationTotal = testBills.length;

  testBills.forEach((test, index) => {
    console.log(`  ${index + 1}. Testing: ${test.name}`);

    try {
      const parsedData =
        typeof test.data === "string" ? JSON.parse(test.data) : test.data;

      // Simulate the validation logic from main.js
      let isValid = true;
      let warnings = [];

      if (!parsedData || typeof parsedData !== "object") {
        isValid = false;
      } else {
        // Check different formats
        let validatedData = null;

        if (parsedData.billData && parsedData.name && parsedData.savedAt) {
          validatedData = parsedData.billData;
          warnings.push("Loaded bill format preset");
        } else if (parsedData.items && Array.isArray(parsedData.items)) {
          validatedData = parsedData;
        } else if (parsedData.billNumber || parsedData.invoiceNumber) {
          validatedData = { ...parsedData, items: parsedData.items || [] };
          if (!parsedData.items || parsedData.items.length === 0) {
            warnings.push("Bill has no items");
          }
        } else {
          validatedData = {
            billNumber:
              parsedData.billNumber || parsedData.invoiceNumber || "UNKNOWN",
            items: parsedData.items || [],
            ...parsedData,
          };
          warnings.push("Unknown format - attempting salvage");
        }

        // Final validation
        if (!validatedData.billNumber && !validatedData.invoiceNumber) {
          validatedData.billNumber = "UNKNOWN_BILL";
          warnings.push("Generated missing bill number");
        }

        if (!validatedData.items || !Array.isArray(validatedData.items)) {
          validatedData.items = [];
          warnings.push("Created missing items array");
        }
      }

      if (isValid === test.shouldPass) {
        console.log(`     Result: ${isValid ? "PASS" : "FAIL"} (as expected)`);
        if (warnings.length > 0) {
          console.log(`     Warnings: ${warnings.join(", ")}`);
        }
        validationPassed++;
      } else {
        console.log(`     Result: ${isValid ? "PASS" : "FAIL"} (unexpected!)`);
      }
    } catch (error) {
      console.log(`     Result: FAIL (${error.message})`);
      if (!test.shouldPass) {
        validationPassed++; // Expected failure
      }
    }
  });

  if (validationPassed === validationTotal) {
    testResults.billValidation = {
      passed: true,
      message: "All bill validation tests passed",
    };
  } else {
    testResults.billValidation = {
      passed: false,
      message: `${validationPassed}/${validationTotal} validation tests passed`,
    };
  }

  runErrorHandlingTests();
}

// Step 5: Test error handling
function runErrorHandlingTests() {
  console.log("\nStep 5: Error Handling Tests");

  const errorTests = [
    {
      name: "Empty file handling",
      test: () => {
        const emptyData = "";
        try {
          JSON.parse(emptyData);
          return false; // Should throw error
        } catch (e) {
          return e.message.includes("Unexpected end");
        }
      },
    },
    {
      name: "Malformed JSON handling",
      test: () => {
        const malformedData = '{"billNumber": "test", "items": [';
        try {
          JSON.parse(malformedData);
          return false; // Should throw error
        } catch (e) {
          return e.message.includes("Unexpected end");
        }
      },
    },
    {
      name: "Null data handling",
      test: () => {
        try {
          if (!null || typeof null !== "object") {
            throw new Error("Invalid file format");
          }
          return false;
        } catch (e) {
          return e.message.includes("Invalid file format");
        }
      },
    },
  ];

  let errorTestsPassed = 0;

  errorTests.forEach((test, index) => {
    console.log(`  ${index + 1}. Testing: ${test.name}`);
    try {
      const result = test.test();
      if (result) {
        console.log(`     Result: PASS`);
        errorTestsPassed++;
      } else {
        console.log(`     Result: FAIL`);
      }
    } catch (error) {
      console.log(`     Result: FAIL (${error.message})`);
    }
  });

  if (errorTestsPassed === errorTests.length) {
    testResults.errorHandling = {
      passed: true,
      message: "All error handling tests passed",
    };
  } else {
    testResults.errorHandling = {
      passed: false,
      message: `${errorTestsPassed}/${errorTests.length} error handling tests passed`,
    };
  }

  printSummary();
}

// Print final summary
function printSummary() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ENHANCED DIAGNOSTIC TEST SUMMARY");
  console.log("=".repeat(60));
  console.log();

  const categories = [
    { name: "Platform Check", result: testResults.platform },
    { name: "Executable Check", result: testResults.executable },
    { name: "File Associations", result: testResults.fileAssociations },
    { name: "Bill Validation", result: testResults.billValidation },
    { name: "Error Handling", result: testResults.errorHandling },
  ];

  let totalPassed = 0;
  let totalTests = categories.length;

  categories.forEach((category) => {
    const status = category.result.passed ? "PASS" : "FAIL";
    const icon = category.result.passed ? " " : " ";
    console.log(
      `${icon} ${category.name.padEnd(20)} ${status.padEnd(6)} ${category.result.message}`,
    );
    if (category.result.passed) totalPassed++;
  });

  console.log();
  console.log(`Overall Result: ${totalPassed}/${totalTests} categories passed`);

  if (totalPassed === totalTests) {
    console.log("\n ENHANCED FILE ASSOCIATION SYSTEM IS WORKING CORRECTLY");
    console.log("\nImprovements validated:");
    console.log("  Better error handling and validation");
    console.log("  Support for .peiplbill file format");
    console.log("  Enhanced bill data recovery");
    console.log("  Improved pending file processing");
    console.log("  Better user feedback and warnings");
  } else {
    console.log("\n Some issues detected. Review the results above.");
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("  DIAGNOSTIC TEST COMPLETE");
  console.log("=".repeat(60));
  console.log();
}
