import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for undo/redo functionality
 * Maintains a history of states with ability to navigate through them
 */
export function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentState = history[currentIndex];
  
  /**
   * Push a new state onto the history
   * Removes any states after current index (for redo branch)
   */
  const pushState = useCallback((newState) => {
    setHistory(prev => {
      // Remove any future states when pushing new one
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Keep only last 50 states to manage memory
      return newHistory.slice(-50);
    });
    
    // Update index after state is set
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, 49);
      return newIndex;
    });
  }, [currentIndex]);
  
  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);
  
  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);
  
  /**
   * Clear history and set new initial state
   */
  const reset = useCallback((newState) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  return {
    currentState,
    pushState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo
  };
}
