import { useState, useCallback } from 'react';

/**
 * Custom hook for managing bill data state
 * Provides methods for updating items and columns
 */
export function useBillData(initialData) {
  const [billData, setBillData] = useState(initialData);
  
  /**
   * Update a specific item at the given index
   * @param {number} rowIdx - Row index
   * @param {string} field - Field name to update
   * @param {*} value - New value
   * @param {function} calculateRowFormulas - Formula calculation function
   */
  const updateItemAtIndex = useCallback((rowIdx, field, value, calculateRowFormulas) => {
    setBillData(prev => {
      const items = [...(prev.items || [])];
      if (rowIdx >= items.length) return prev;
      
      const target = items[rowIdx]
        ? { ...items[rowIdx], [field]: value }
        : { [field]: value };
      
      items[rowIdx] = calculateRowFormulas(target);
      return { ...prev, items };
    });
  }, []);

  /**
   * Update a column definition
   * @param {number} columnIndex - Column index
   * @param {object} updates - Updates to apply
   */
  const updateColumn = useCallback((columnIndex, updates) => {
    setBillData(prev => ({
      ...prev,
      columns: prev.columns.map((col, idx) =>
        idx === columnIndex ? { ...col, ...updates } : col
      )
    }));
  }, []);

  /**
   * Add multiple items at once
   * @param {array} newItems - Array of items to add
   */
  const addItems = useCallback((newItems) => {
    setBillData(prev => ({
      ...prev,
      items: [...(prev.items || []), ...newItems]
    }));
  }, []);

  /**
   * Delete item at index
   * @param {number} rowIdx - Row index to delete
   */
  const deleteItem = useCallback((rowIdx) => {
    setBillData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== rowIdx)
    }));
  }, []);

  /**
   * Delete column at index
   * @param {number} colIdx - Column index to delete
   */
  const deleteColumn = useCallback((colIdx) => {
    setBillData(prev => {
      const colKey = prev.columns[colIdx]?.key;
      return {
        ...prev,
        columns: prev.columns.filter((_, idx) => idx !== colIdx),
        items: prev.items.map(item => {
          const newItem = { ...item };
          delete newItem[colKey];
          return newItem;
        })
      };
    });
  }, []);

  /**
   * Reorder items (for drag and drop)
   * @param {number} fromIdx - From index
   * @param {number} toIdx - To index
   */
  const reorderItems = useCallback((fromIdx, toIdx) => {
    setBillData(prev => {
      const items = [...prev.items];
      const [removed] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, removed);
      return { ...prev, items };
    });
  }, []);

  /**
   * Reorder columns (for drag and drop)
   * @param {number} fromIdx - From index
   * @param {number} toIdx - To index
   */
  const reorderColumns = useCallback((fromIdx, toIdx) => {
    setBillData(prev => {
      const columns = [...prev.columns];
      const [removed] = columns.splice(fromIdx, 1);
      columns.splice(toIdx, 0, removed);
      return { ...prev, columns };
    });
  }, []);

  return {
    billData,
    setBillData,
    updateItemAtIndex,
    updateColumn,
    addItems,
    deleteItem,
    deleteColumn,
    reorderItems,
    reorderColumns
  };
}
