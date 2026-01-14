import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for enhanced table keyboard navigation
 * Handles arrow keys, tab, and other navigation keys
 */
export function useTableNavigation(itemsLength, columnsLength, enabled = true) {
  const [focusedCell, setFocusedCell] = useState({ row: 0, col: 0 });
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e) => {
      // Only handle specific navigation keys
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
      if (!navKeys.includes(e.key)) return;
      
      // Don't prevent default for Tab in input fields
      if (e.key === 'Tab' && e.target.tagName === 'INPUT') return;
      
      e.preventDefault();
      
      setFocusedCell(prev => {
        let newRow = prev.row;
        let newCol = prev.col;
        
        switch (e.key) {
          case 'ArrowDown':
            newRow = Math.min(itemsLength - 1, prev.row + 1);
            break;
            
          case 'ArrowUp':
            newRow = Math.max(0, prev.row - 1);
            break;
            
          case 'ArrowRight':
            newCol = Math.min(columnsLength - 1, prev.col + 1);
            break;
            
          case 'ArrowLeft':
            newCol = Math.max(0, prev.col - 1);
            break;
            
          case 'Tab':
            if (e.shiftKey) {
              // Shift+Tab: move left or up
              if (prev.col > 0) {
                newCol = prev.col - 1;
              } else if (prev.row > 0) {
                newRow = prev.row - 1;
                newCol = columnsLength - 1;
              }
            } else {
              // Tab: move right or down
              if (prev.col < columnsLength - 1) {
                newCol = prev.col + 1;
              } else if (prev.row < itemsLength - 1) {
                newRow = prev.row + 1;
                newCol = 0;
              }
            }
            break;
            
          default:
            return prev;
        }
        
        // Validate bounds
        newRow = Math.max(0, Math.min(itemsLength - 1, newRow));
        newCol = Math.max(0, Math.min(columnsLength - 1, newCol));
        
        return { row: newRow, col: newCol };
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemsLength, columnsLength, enabled]);
  
  /**
   * Manually set focused cell
   */
  const setFocus = useCallback((row, col) => {
    setFocusedCell({
      row: Math.max(0, Math.min(itemsLength - 1, row)),
      col: Math.max(0, Math.min(columnsLength - 1, col))
    });
  }, [itemsLength, columnsLength]);
  
  /**
   * Reset focus to top-left
   */
  const resetFocus = useCallback(() => {
    setFocusedCell({ row: 0, col: 0 });
  }, []);
  
  return {
    focusedCell,
    setFocus,
    resetFocus
  };
}
