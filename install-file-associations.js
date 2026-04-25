#!/usr/bin/env node

/**
 * File Association Installer for PEIPL Bill Assistant
 * This script sets up file associations during installation
 */

const { exec } = require("child_process");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Setting up file associations for PEIPL Bill Assistant...");

// Check if we're on Windows
if (process.platform !== "win32") {
  console.log("⚠️  File associations are only supported on Windows.");
  process.exit(0);
}

// Get the executable path - handle both dev and packaged scenarios
let exePath = process.execPath;

// If running from npm script in development, we need to find the actual app executable
// During packaged install, execPath should be the app executable
// Try to detect if we're running from Node.exe (development) vs app.exe (packaged)
if (exePath.toLowerCase().includes("node")) {
  // This is running in development mode, try to find the actual app executable
  // Look for PEIPL Bill Assistant.exe in common installation paths
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
    path.join(__dirname, "dist", "PEIPL Bill Assistant.exe"),
    path.join(__dirname, "out", "PEIPL Bill Assistant.exe"),
  ];

  let foundPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      foundPath = possiblePath;
      console.log(`📁 Found app executable: ${foundPath}`);
      break;
    }
  }

  if (!foundPath) {
    console.warn(
      "⚠️  Could not locate app executable. Using current Node executable as fallback.",
    );
    console.log(
      "   Note: This will not work properly. Please install the app first.",
    );
    // Continue with Node path as fallback for testing
  } else {
    exePath = foundPath;
  }
}

console.log(`📁 Executable path: ${exePath}`);

// Validate the executable exists
if (!fs.existsSync(exePath)) {
  console.error(`❌ Executable not found: ${exePath}`);
  console.log("   Please install the PEIPL Bill Assistant first.");
  process.exit(1);
}

// Commands to set up file associations
// NOTE: We only associate .peiplbill files to avoid hijacking system-wide .json handling
// .json files should remain associated with their default applications (VS Code, browsers, etc.)
const commands = [
  {
    name: "Set file type",
    command: `ftype PEIPLBillMaker="${exePath}" "%%1"`,
  },
  {
    name: "Associate .peiplbill files",
    command: "assoc .peiplbill=PEIPLBillMaker",
  },
  // REMOVED: Global .json association to prevent system-wide hijacking
  // Users can still open .json files via "Open With" or drag-and-drop
];

let completed = 0;
let hasError = false;
let successCount = 0;

console.log("🚀 Running setup commands...");

commands.forEach(({ name, command }) => {
  console.log(`   ${name}...`);

  exec(command, { shell: true }, (error, stdout, stderr) => {
    completed++;

    if (error) {
      console.error(`❌ ${name} failed:`, error.message);
      hasError = true;
    } else {
      console.log(`✅ ${name} completed successfully`);
      successCount++;
    }

    if (completed === commands.length) {
      if (successCount === commands.length) {
        console.log("🎉 File associations set up successfully!");
        console.log(
          "💡 You can now double-click .json and .peiplbill files to open them in PEIPL Bill Assistant.",
        );
        process.exit(0);
      } else if (successCount > 0) {
        console.log(
          `⚠️  Partial success (${successCount}/${commands.length}). You may need to run as Administrator to complete the setup.`,
        );
        process.exit(0); // Still exit 0 for partial success
      } else {
        console.log(
          "❌ All commands failed. You can set up file associations manually from within the app.",
        );
        process.exit(1);
      }
    }
  });
});

// Timeout after 15 seconds
setTimeout(() => {
  if (completed < commands.length) {
    console.log(
      "⏰ Setup timed out. Please try setting up file associations from within the app.",
    );
    process.exit(1);
  }
}, 15000);
