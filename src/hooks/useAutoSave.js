import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for auto-save functionality
 * Saves bill data to localStorage with debouncing
 */
export function useAutoSave(billData, enabled = true) {
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Auto-save with debounce
  useEffect(() => {
    if (!enabled || !billData) return;
    
    setHasUnsavedChanges(true);
    
    const saveDebounce = setTimeout(() => {
      try {
        const dataToSave = {
          ...billData,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('bill_data_autosave', JSON.stringify(dataToSave));
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        // Optional: show save indicator (commented out to avoid spam)
        // toast.success('Auto-saved', { duration: 1000 });
      } catch (error) {
        console.warn('Failed to auto-save:', error);
        toast.error('Failed to save data');
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(saveDebounce);
  }, [billData, enabled]);
  
  /**
   * Recover saved data from localStorage
   */
  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem('bill_data_autosave');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load saved data:', error);
      return null;
    }
  }, []);
  
  /**
   * Clear saved data
   */
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem('bill_data_autosave');
    } catch (error) {
      console.warn('Failed to clear saved data:', error);
    }
  }, []);
  
  /**
   * Check if there's saved data available
   */
  const hasSavedData = useCallback(() => {
    try {
      return !!localStorage.getItem('bill_data_autosave');
    } catch (error) {
      return false;
    }
  }, []);
  
  return {
    lastSaved,
    hasUnsavedChanges,
    getSavedData,
    clearSavedData,
    hasSavedData
  };
}
