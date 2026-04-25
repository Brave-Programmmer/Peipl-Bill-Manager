#!/usr/bin/env node

/**
 * Analyze unused files, code, and packages in the project
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Analyzing Unused Files, Code, and Packages...\n");

// Project structure analysis
const projectStructure = {
  src: {
    components: [],
    app: [],
    lib: [],
    hooks: [],
  },
  scripts: [],
  docs: [],
  public: [],
  electron: [],
};

// Get all files in directories
const getFiles = (dir, extensions = [".js", ".jsx", ".ts", ".tsx"]) => {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
      files.push(fullPath);
    } else if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      files.push(...getFiles(fullPath, extensions));
    }
  }
  return files;
};

// Analyze package.json dependencies
const analyzeDependencies = () => {
  console.log("📦 Analyzing Package Dependencies:");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});

    console.log(`   Total Dependencies: ${dependencies.length}`);
    console.log(`   Total Dev Dependencies: ${devDependencies.length}`);

    // Common dependencies that might be unused
    const potentiallyUnused = [
      "mathjs", // Used in ItemsTable for calculations
      "lucide-react", // Used for icons
      "date-fns", // Check if used
      "axios", // Check if used
      "react-hook-form", // Check if used
      "react-query", // Check if used
      "zustand", // Check if used
      "framer-motion", // Check if used
      "react-beautiful-dnd", // Check if used
      "react-table", // Check if used
      "recharts", // Check if used
      "react-hot-toast", // Check if used
      "clsx", // Check if used
      "lodash", // Check if used
      "moment", // Check if used
    ];

    console.log("\n   Potentially Unused Dependencies:");
    potentiallyUnused.forEach((dep) => {
      if (dependencies.includes(dep)) {
        console.log(`   ⚠️  ${dep} - Check usage`);
      }
    });

    return { dependencies, devDependencies };
  } catch (error) {
    console.log("   ❌ Error reading package.json:", error.message);
    return { dependencies: [], devDependencies: [] };
  }
};

// Analyze unused files
const analyzeUnusedFiles = () => {
  console.log("\n📁 Analyzing Unused Files:");

  const srcDir = "src";
  const allFiles = getFiles(srcDir);

  console.log(`   Total source files: ${allFiles.length}`);

  // Check for potentially unused components
  const componentFiles = allFiles.filter(
    (file) =>
      file.includes("/components/") &&
      (file.endsWith(".js") || file.endsWith(".jsx")),
  );

  console.log(`   Component files: ${componentFiles.length}`);

  // List all component files for manual review
  console.log("\n   Component Files (review for usage):");
  componentFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   ${index + 1}. ${relativePath}`);
  });

  return componentFiles;
};

// Analyze unused scripts
const analyzeUnusedScripts = () => {
  console.log("\n📜 Analyzing Scripts:");

  const scriptsDir = "scripts";
  if (!fs.existsSync(scriptsDir)) {
    console.log("   No scripts directory found");
    return [];
  }

  const scriptFiles = getFiles(scriptsDir);
  console.log(`   Total script files: ${scriptFiles.length}`);

  console.log("\n   Script Files:");
  scriptFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   ${index + 1}. ${relativePath}`);
  });

  return scriptFiles;
};

// Analyze unused documentation
const analyzeUnusedDocs = () => {
  console.log("\n📚 Analyzing Documentation:");

  const docsDir = "docs";
  if (!fs.existsSync(docsDir)) {
    console.log("   No docs directory found");
    return [];
  }

  const docFiles = getFiles(docsDir, [".md"]);
  console.log(`   Total documentation files: ${docFiles.length}`);

  console.log("\n   Documentation Files:");
  docFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   ${index + 1}. ${relativePath}`);
  });

  return docFiles;
};

// Check for unused imports in a file
const checkUnusedImports = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Find import statements
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Check if imports are used (basic check)
    const unusedImports = [];
    imports.forEach((imp) => {
      const importName = imp.split("/").pop();
      const regex = new RegExp(`\\b${importName}\\b`, "g");
      const usageCount = (content.match(regex) || []).length;

      // Subtract 1 for the import statement itself
      if (usageCount <= 1) {
        unusedImports.push(imp);
      }
    });

    return unusedImports;
  } catch (error) {
    return [];
  }
};

// Analyze specific files for unused imports
const analyzeUnusedImports = () => {
  console.log("\n🔍 Analyzing Unused Imports:");

  const filesToCheck = [
    "src/components/Header.js",
    "src/components/BillFolderTracker.js",
    "src/components/BillGenerator.js",
    "src/components/ItemsTable.js",
    "src/app/page.js",
    "src/app/layout.js",
  ];

  filesToCheck.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      const unused = checkUnusedImports(filePath);
      if (unused.length > 0) {
        console.log(`   ⚠️  ${filePath}:`);
        unused.forEach((imp) => {
          console.log(`      - ${imp}`);
        });
      } else {
        console.log(`   ✅ ${filePath}: No obvious unused imports`);
      }
    }
  });
};

// Check for unused CSS
const analyzeUnusedCSS = () => {
  console.log("\n🎨 Analyzing CSS:");

  const cssFiles = getFiles("src", [".css"]);
  console.log(`   Total CSS files: ${cssFiles.length}`);

  cssFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   ${index + 1}. ${relativePath}`);
  });

  // Check for unused CSS classes (basic check)
  const globalsCss = "src/app/globals.css";
  if (fs.existsSync(globalsCss)) {
    const content = fs.readFileSync(globalsCss, "utf8");
    const classRegex = /\.([a-zA-Z][a-zA-Z0-9-_]*)\s*{/g;
    const classes = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }

    console.log(`\n   CSS Classes in globals.css: ${classes.length}`);
    console.log("   (Manual review needed for unused classes)");
  }
};

// Check for unused assets
const analyzeUnusedAssets = () => {
  console.log("\n🖼️ Analyzing Assets:");

  const publicDir = "public";
  if (!fs.existsSync(publicDir)) {
    console.log("   No public directory found");
    return [];
  }

  const assetFiles = getFiles(publicDir, [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
  ]);
  console.log(`   Total asset files: ${assetFiles.length}`);

  console.log("\n   Asset Files:");
  assetFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`   ${index + 1}. ${relativePath}`);
  });

  return assetFiles;
};

// Main analysis function
const runAnalysis = () => {
  console.log("🔍 Starting Comprehensive Code Analysis...\n");

  const results = {
    dependencies: analyzeDependencies(),
    files: analyzeUnusedFiles(),
    scripts: analyzeUnusedScripts(),
    docs: analyzeUnusedDocs(),
    assets: analyzeUnusedAssets(),
  };

  analyzeUnusedImports();
  analyzeUnusedCSS();

  console.log("\n📊 Analysis Summary:");
  console.log(`   Dependencies: ${results.dependencies.dependencies.length}`);
  console.log(`   Source Files: ${results.files.length}`);
  console.log(`   Scripts: ${results.scripts.length}`);
  console.log(`   Documentation: ${results.docs.length}`);
  console.log(`   Assets: ${results.assets.length}`);

  console.log("\n🎯 Recommendations:");
  console.log("   1. Review potentially unused dependencies");
  console.log("   2. Check component usage across the codebase");
  console.log("   3. Remove unused script files");
  console.log("   4. Consolidate documentation if needed");
  console.log("   5. Remove unused assets");
  console.log("   6. Clean up unused CSS classes");

  console.log("\n✅ Analysis Complete!");
  console.log("Review the detailed results above for cleanup opportunities.");
};

// Run the analysis
runAnalysis();
