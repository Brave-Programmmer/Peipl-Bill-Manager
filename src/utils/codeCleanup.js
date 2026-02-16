// Code cleanup utilities and unused variable detection

export function findUnusedVariables(code) {
  const variables = code.match(/const\s+(\w+)\s*=/g) || [];
  const usedVars = new Set();
  
  // Find all variable usages
  code.replace(/(?:const|let|var)\s+(\w+)\s*=/g, (match, varName) => {
    if (varName) usedVars.add(varName);
  });
  
  // Find unused variables
  const unused = variables.filter(([_, varName]) => !usedVars.has(varName));
  return unused;
}

export function removeUnusedImports(code) {
  const imports = code.match(/import.*from\s+['"][^'"]+['"][^'"]*['"]/g) || [];
  const usedImports = new Set();
  
  // Find all import usages
  code.replace(/import.*from\s+['"][^'"]+['"][^'"]*['"]/g, (match) => {
    if (match) {
      const importName = match.match(/import\s+{([^}]+)\s+from/)?.[1];
      if (importName) {
        importName.replace(/[{}]/g, '').split(',').forEach(name => {
          usedImports.add(name.trim());
        });
      }
    }
  });
  
  // Check which imports are actually used
  return imports.filter(importLine => {
    const importName = importLine.match(/import.*{([^}]+)\s+from/)?.[1];
    if (importName) {
      return !importName.replace(/[{}]/g, '').split(',').some(name => 
        usedImports.has(name.trim())
      );
    }
    return true; // Keep all imports for now
  });
}

export function optimizeComponent(componentCode) {
  const unusedVars = findUnusedVariables(componentCode);
  const unusedImports = removeUnusedImports(componentCode);
  
  return {
    unusedVariables,
    unusedImports,
    suggestions: [
      'Remove unused state variables',
      'Consolidate duplicate utility functions',
      'Remove unused imports',
      'Optimize useEffect dependencies',
      'Add proper error boundaries'
    ]
  };
}
