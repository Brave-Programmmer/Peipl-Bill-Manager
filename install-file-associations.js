#!/usr/bin/env node

/**
 * File Association Installer for PEIPL Bill Assistant
 * This script sets up file associations during installation
 */

const { exec } = require("child_process");
const fs = require("fs");

console.log("🔧 Setting up file associations for PEIPL Bill Assistant...");

// Get the executable path
const exePath = process.execPath;
console.log(`📁 Executable path: ${exePath}`);

// Check if we're on Windows
if (process.platform !== "win32") {
  console.log("⚠️  File associations are only supported on Windows.");
  process.exit(0);
}

// Commands to set up file associations
const commands = [
  {
    name: "Set file type",
    command: `ftype PEIPLBillMaker="${exePath}" "%1"`,
  },
  {
    name: "Associate .json files",
    command: "assoc .json=PEIPLBillMaker",
  },
];

let completed = 0;
let hasError = false;

console.log("🚀 Running setup commands...");

commands.forEach(({ name, command }) => {
  console.log(`   ${name}...`);

  exec(command, (error, stdout, stderr) => {
    completed++;

    if (error) {
      console.error(`❌ ${name} failed:`, error.message);
      hasError = true;
    } else {
      console.log(`✅ ${name} completed successfully`);
    }

    if (completed === commands.length) {
      if (hasError) {
        console.log(
          "⚠️  Some commands failed. You can set up file associations manually from within the app.",
        );
        process.exit(1);
      } else {
        console.log("🎉 File associations set up successfully!");
        console.log(
          "💡 You can now double-click JSON files to open them in PEIPL Bill Assistant.",
        );
        process.exit(0);
      }
    }
  });
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log(
    "⏰ Setup timed out. Please try setting up file associations from within the app.",
  );
  process.exit(1);
}, 10000);
