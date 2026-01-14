import toast from 'react-hot-toast';

/**
 * Safe wrapper for bill data operations
 * Provides validation and error handling
 */
export class BillDataValidator {
  /**
   * Validate bill data structure
   */
  static validateBillData(data) {
    const errors = [];
    
    // Check if data exists
    if (!data) {
      errors.push('Bill data is missing');
      return { valid: false, errors };
    }
    
    // Validate items array
    if (!Array.isArray(data.items)) {
      errors.push('Items must be an array');
    }
    
    // Validate columns array
    if (!Array.isArray(data.columns)) {
      errors.push('Columns must be an array');
    }
    
    // Validate columns have required fields
    if (Array.isArray(data.columns)) {
      data.columns.forEach((col, idx) => {
        if (!col.key) errors.push(`Column ${idx} is missing key`);
        if (!col.label) errors.push(`Column ${idx} is missing label`);
        if (!col.type) errors.push(`Column ${idx} is missing type`);
      });
    }
    
    // Validate items have valid structure
    if (Array.isArray(data.items)) {
      data.items.forEach((item, idx) => {
        if (!item.id) {
          errors.push(`Item ${idx} is missing id`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a single item
   */
  static validateItem(item, columns) {
    const errors = [];
    
    if (!item) {
      errors.push('Item is null or undefined');
      return { valid: false, errors };
    }
    
    if (!item.id) {
      errors.push('Item is missing id');
    }
    
    // Check required columns exist
    columns.forEach(col => {
      if (!(col.key in item)) {
        errors.push(`Item missing column: ${col.key}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a column definition
   */
  static validateColumn(column) {
    const errors = [];
    
    if (!column) {
      errors.push('Column is null or undefined');
      return { valid: false, errors };
    }
    
    if (!column.key) errors.push('Column missing key');
    if (!column.label) errors.push('Column missing label');
    if (!column.type) errors.push('Column missing type');
    
    const validTypes = ['text', 'number', 'date', 'formula'];
    if (column.type && !validTypes.includes(column.type)) {
      errors.push(`Invalid column type: ${column.type}`);
    }
    
    if (column.type === 'formula' && !column.formula) {
      errors.push('Formula column missing formula expression');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Safe merge of bill data
   */
  static safeMergeBillData(current, updates) {
    try {
      const merged = {
        ...current,
        ...updates,
        items: updates.items || current.items,
        columns: updates.columns || current.columns
      };
      
      const validation = this.validateBillData(merged);
      if (!validation.valid) {
        throw new Error(`Invalid bill data: ${validation.errors.join(', ')}`);
      }
      
      return { success: true, data: merged };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Safe state updater for bill data
 */
export function createSafeSetBillData(setBillData, onError) {
  return (updater) => {
    try {
      setBillData(prev => {
        const newData = typeof updater === 'function' ? updater(prev) : updater;
        
        // Validate structure
        const validation = BillDataValidator.validateBillData(newData);
        if (!validation.valid) {
          const errorMsg = `Data validation failed: ${validation.errors.slice(0, 2).join(', ')}`;
          console.error(errorMsg);
          if (onError) onError(new Error(errorMsg));
          toast.error('Failed to update table data');
          return prev; // Return previous state on validation error
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error updating bill data:', error);
      if (onError) onError(error);
      toast.error('An unexpected error occurred');
    }
  };
}

/**
 * Create a debounced update function
 */
export function createDebouncedUpdate(updateFn, delay = 300) {
  let timeoutId = null;
  
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      try {
        updateFn(...args);
      } catch (error) {
        console.error('Debounced update error:', error);
        toast.error('Update failed');
      }
    }, delay);
  };
}
