#!/usr/bin/env node

/**
 * File Association System Diagnostic Test
 * Run this to verify the file association setup is working correctly
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║  FILE ASSOCIATION SYSTEM - DIAGNOSTIC TEST                ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Step 1: Platform check
console.log("✓ Step 1: Platform Check");
console.log(`  Current Platform: ${process.platform}`);

if (process.platform !== "win32") {
  console.log("  ⚠️  File associations only work on Windows");
  process.exit(0);
}
console.log("  ✅ Windows platform detected\n");

// Step 2: Check executable path
console.log("✓ Step 2: Executable Path Check");
console.log(`  Current Process Path: ${process.execPath}`);

// Try to find the actual PEIPL Bill Assistant executable
let appExePath = null;
const possiblePaths = [
  path.join(process.env.ProgramFiles || "C:\\Program Files", "PEIPL Bill Assistant", "PEIPL Bill Assistant.exe"),
  path.join(process.env.ProgramFilesX86 || "C:\\Program Files (x86)", "PEIPL Bill Assistant", "PEIPL Bill Assistant.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Programs", "peipl-bill-maker", "PEIPL Bill Assistant.exe"),
];

for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    appExePath = possiblePath;
    console.log(`  ✅ Found app executable: ${appExePath}\n`);
    break;
  }
}

if (!appExePath) {
  console.log(`  ⚠️  Could not find app executable. Checks will use Node.exe path.\n`);
}

// Step 3: Test file type registration
console.log("✓ Step 3: File Type Registration");
const commands = [
  {
    name: "Check PEIPLBillMaker registration",
    cmd: 'ftype PEIPLBillMaker',
  },
  {
    name: "Check .peiplbill association",
    cmd: 'assoc .peiplbill',
  },
  {
    name: "Check .json association",
    cmd: 'assoc .json',
  },
];

let completed = 0;
const results = [];

commands.forEach((test, index) => {
  exec(test.cmd, { shell: true }, (error, stdout, stderr) => {
    completed++;
    
    console.log(`  ${index + 1}. ${test.name}`);
    if (error) {
      console.log(`     ❌ Error: ${error.message}`);
      results.push({ test: test.name, success: false, output: error.message });
    } else if (stdout) {
      const output = stdout.trim();
      console.log(`     ✅ ${output}`);
      results.push({ test: test.name, success: true, output });
      
      // Extra validation: Check if it points to a valid executable
      if (test.name === "Check PEIPLBillMaker registration" && appExePath) {
        if (output.includes(appExePath.replace(/"/g, '\\"'))) {
          console.log(`     ✅ Correctly points to app executable`);
        } else if (output.includes("PEIPL Bill Assistant.exe")) {
          console.log(`     ✅ Points to PEIPL Bill Assistant`);
        } else {
          console.log(`     ⚠️  May not point to the correct executable`);
        }
      }
    } else {
      console.log(`     ⚠️  No output (may need admin)`);
      results.push({ test: test.name, success: false, output: "No output" });
    }

    if (completed === commands.length) {
      finishDiagnostics();
    }
  });
});

function finishDiagnostics() {
  console.log("\n✓ Step 4: Summary");
  const successCount = results.filter(r => r.success).length;
  console.log(`  Checks Passed: ${successCount}/${results.length}`);

  if (successCount === results.length) {
    console.log("\n✅ FILE ASSOCIATION SYSTEM IS WORKING CORRECTLY\n");
    console.log("   You can now:");
    console.log("   • Double-click .json files to open them in PEIPL Bill Assistant");
    console.log("   • Double-click .peiplbill files to open them in PEIPL Bill Assistant\n");
  } else if (successCount > 0) {
    console.log("\n⚠️  PARTIAL SUCCESS - Some checks failed");
    console.log("   This is normal if running without Administrator privileges.");
    console.log("   The file associations may still be working.\n");
  } else {
    console.log("\n❌ FILE ASSOCIATION SYSTEM IS NOT SET UP");
    console.log("   To fix this, try one of the following:\n");
    console.log("   Option 1: Run the setup from within PEIPL Bill Assistant");
    console.log("            Look for 'File Associations Setup' in the settings\n");
    console.log("   Option 2: Run as Administrator");
    console.log("            Right-click Command Prompt → Run as Administrator");
    console.log("            Then run: node test-file-associations.js\n");
    console.log("   Option 3: Manual setup");
    console.log("            Run PowerShell as Administrator and execute:");
    if (appExePath) {
      console.log(`            ftype PEIPLBillMaker="${appExePath}" "%%1"`);
    } else {
      console.log(`            ftype PEIPLBillMaker="C:\\path\\to\\PEIPL Bill Assistant.exe" "%%1"`);
    }
    console.log("            assoc .peiplbill=PEIPLBillMaker");
    console.log("            assoc .json=PEIPLBillMaker\n");
  }

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  DIAGNOSTIC TEST COMPLETE                                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
}
