#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Components to analyze
const componentsDir = path.join(__dirname, '../src/components');
const utilsDir = path.join(__dirname, '../src/utils');

console.log('🔍 Analyzing code for duplicates and unused variables...\n');

// Read all component files
const componentFiles = fs.readdirSync(componentsDir)
  .filter(file => file.endsWith('.js'));

let totalIssues = 0;
const issues = [];

componentFiles.forEach(file => {
  const filePath = path.join(componentsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 Analyzing: ${file}`);
  
  // Check for duplicate function definitions
  const functionMatches = content.match(/function\s+(\w+)\s*\(/g) || [];
  const functions = {};
  
  functionMatches.forEach(match => {
    const funcName = match[1];
    functions[funcName] = (functions[funcName] || 0) + 1;
  });
  
  // Find duplicates
  Object.keys(functions).forEach(funcName => {
    if (functions[funcName] > 1) {
      issues.push(`🔴 ${file}: Duplicate function "${funcName}" (${functions[funcName]} occurrences)`);
      totalIssues++;
    }
  });
  
  // Check for unused imports
  const importMatches = content.match(/import.*from\s+['"][^'"]+['"][^'"]*['"]/g) || [];
  const usedImports = new Set();
  
  // Simple heuristic to find used imports
  content.replace(/\b(\w+)\b/g, (match, varName) => {
    if (varName && varName.length > 2) {
      usedImports.add(varName);
    }
  });
  
  importMatches.forEach(importMatch => {
    const importName = importMatch.match(/import\s+{([^}]+)\s+from/)?.[1];
    if (importName) {
      importName.replace(/[{}]/g, '').split(',').forEach(name => {
        const trimmedName = name.trim();
        if (!usedImports.has(trimmedName) && trimmedName.length > 2) {
          issues.push(`🟡 ${file}: Potentially unused import "${trimmedName}"`);
          totalIssues++;
        }
      });
    }
  });
  
  // Check for common issues
  if (content.includes('console.log')) {
    issues.push(`🟡 ${file}: console.log statements found (should use proper logging)`);
    totalIssues++;
  }
  
  if (content.includes('TODO') || content.includes('FIXME')) {
    issues.push(`🟡 ${file}: TODO/FIXME comments found`);
    totalIssues++;
  }
});

console.log(`\n📊 Analysis Complete!`);
console.log(`Total Issues Found: ${totalIssues}`);

if (issues.length > 0) {
  console.log('\n🚨 Issues Found:');
  issues.forEach(issue => console.log(`  ${issue}`));
} else {
  console.log('\n✅ No major issues found!');
}

console.log('\n💡 Suggestions:');
console.log('  - Remove duplicate function definitions');
console.log('  - Create shared utility files for common functions');
console.log('  - Remove unused imports');
console.log('  - Replace console.log with proper logging');
console.log('  - Add proper error boundaries');
console.log('  - Optimize React re-renders with useMemo');
