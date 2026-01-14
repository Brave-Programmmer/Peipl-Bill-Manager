import { useCallback } from 'react';

/**
 * Custom hook for formula validation
 * Validates formula expressions before saving
 */
export function useFormulaValidation(math) {
  const validateFormula = useCallback((formula, availableCols) => {
    // Check if formula is empty
    if (!formula?.trim()) {
      return { valid: false, error: "Formula cannot be empty" };
    }

    // Check for forbidden characters
    if (/[;\[\]{}]/.test(formula)) {
      return { valid: false, error: "Formula contains invalid characters" };
    }

    try {
      // Parse the formula
      const node = math.parse(formula);
      
      // Collect all symbol nodes
      const symbols = [];
      node.traverse(n => {
        if (n.isSymbolNode) {
          symbols.push(n.name);
        }
      });

      // Check for unknown column references
      const unknown = symbols.filter(
        s => !availableCols.includes(s) && isNaN(Number(s))
      );
      
      if (unknown.length > 0) {
        return {
          valid: false,
          error: `Unknown column keys: ${[...new Set(unknown)].join(", ")}`
        };
      }

      // Try to compile to catch other errors
      node.compile();
      
      return { valid: true };
    } catch (err) {
      return { valid: false, error: `Formula error: ${err.message}` };
    }
  }, []);

  return { validateFormula };
}
