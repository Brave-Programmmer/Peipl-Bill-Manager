/**
 * Enhanced Bill Tracker State Management Hook
 * Uses useReducer for centralized, predictable state management
 */

import { useReducer, useCallback, useMemo } from "react";
import billTrackerReducer, { initialState } from "../utils/billTrackerReducer";

export const useBillTrackerReducer = () => {
  const [state, dispatch] = useReducer(billTrackerReducer, initialState);

  // Configuration actions
  const setSelectedFolder = useCallback((folder) => {
    dispatch({ type: "SET_SELECTED_FOLDER", payload: folder });
  }, []);

  const setSubfolders = useCallback((subfolders, treeStructure) => {
    dispatch({
      type: "SET_SUBFOLDERS",
      payload: { subfolders, treeStructure },
    });
  }, []);

  const toggleSubfolder = useCallback((path) => {
    dispatch({ type: "TOGGLE_SUBFOLDER", payload: path });
  }, []);

  const selectAllSubfolders = useCallback(() => {
    dispatch({ type: "SELECT_ALL_SUBFOLDERS" });
  }, []);

  const deselectAllSubfolders = useCallback(() => {
    dispatch({ type: "DESELECT_ALL_SUBFOLDERS" });
  }, []);

  const toggleIgnoredSubfolder = useCallback((path) => {
    dispatch({ type: "TOGGLE_IGNORED_SUBFOLDER", payload: path });
  }, []);

  const setGstSubmittedFolder = useCallback((folder) => {
    dispatch({ type: "SET_GST_SUBMITTED_FOLDER", payload: folder });
  }, []);

  // Tracking data actions
  const setTrackingData = useCallback((data) => {
    dispatch({ type: "SET_TRACKING_DATA", payload: data });
  }, []);

  const updateTrackingData = useCallback((filePath, data) => {
    dispatch({ type: "UPDATE_TRACKING_DATA", payload: { filePath, data } });
  }, []);

  const setAllFiles = useCallback((files) => {
    dispatch({ type: "SET_ALL_FILES", payload: files });
  }, []);

  // UI actions
  const setViewMode = useCallback((mode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  const setFileTypeFilter = useCallback((filter) => {
    dispatch({ type: "SET_FILE_TYPE_FILTER", payload: filter });
  }, []);

  const setStatusFilter = useCallback((filter) => {
    dispatch({ type: "SET_STATUS_FILTER", payload: filter });
  }, []);

  const setSearchTerm = useCallback((term) => {
    dispatch({ type: "SET_SEARCH_TERM", payload: term });
  }, []);

  const setSortBy = useCallback((field) => {
    dispatch({ type: "SET_SORT_BY", payload: field });
  }, []);

  const setSortOrder = useCallback((order) => {
    dispatch({ type: "SET_SORT_ORDER", payload: order });
  }, []);

  const toggleFileSelection = useCallback((filePath) => {
    dispatch({ type: "TOGGLE_FILE_SELECTION", payload: filePath });
  }, []);

  const selectAllFiles = useCallback(() => {
    dispatch({ type: "SELECT_ALL_FILES" });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  const setShowBulkActions = useCallback((show) => {
    dispatch({ type: "SET_SHOW_BULK_ACTIONS", payload: show });
  }, []);

  const setShowSettings = useCallback((show) => {
    dispatch({ type: "SET_SHOW_SETTINGS", payload: show });
  }, []);

  const setShowStats = useCallback((show) => {
    dispatch({ type: "SET_SHOW_STATS", payload: show });
  }, []);

  const setShowReports = useCallback((show) => {
    dispatch({ type: "SET_SHOW_REPORTS", payload: show });
  }, []);

  // Advanced features
  const setDateRange = useCallback((range) => {
    dispatch({ type: "SET_DATE_RANGE", payload: range });
  }, []);

  const setMinFileSize = useCallback((size) => {
    dispatch({ type: "SET_MIN_FILE_SIZE", payload: size });
  }, []);

  const setMaxFileSize = useCallback((size) => {
    dispatch({ type: "SET_MAX_FILE_SIZE", payload: size });
  }, []);

  const addToUndoStack = useCallback((action) => {
    dispatch({ type: "ADD_TO_UNDO_STACK", payload: action });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  // Settings and statistics
  const updateSettings = useCallback((settings) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  }, []);

  const updateStatistics = useCallback((stats) => {
    dispatch({ type: "UPDATE_STATISTICS", payload: stats });
  }, []);

  // Loading and error
  const setLoading = useCallback((loading) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  // Bulk operations
  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  // Memoized computed values
  const selectedFilesArray = useMemo(
    () => Array.from(state.selectedFiles),
    [state.selectedFiles]
  );

  const selectedSubfoldersArray = useMemo(
    () => Array.from(state.selectedSubfolders),
    [state.selectedSubfolders]
  );

  const canUndo = useMemo(() => state.undoStack.length > 0, [state.undoStack]);
  const canRedo = useMemo(() => state.redoStack.length > 0, [state.redoStack]);

  const actions = {
    // Configuration
    setSelectedFolder,
    setSubfolders,
    toggleSubfolder,
    selectAllSubfolders,
    deselectAllSubfolders,
    toggleIgnoredSubfolder,
    setGstSubmittedFolder,

    // Tracking data
    setTrackingData,
    updateTrackingData,
    setAllFiles,

    // UI
    setViewMode,
    setFileTypeFilter,
    setStatusFilter,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    setShowBulkActions,
    setShowSettings,
    setShowStats,
    setShowReports,

    // Advanced features
    setDateRange,
    setMinFileSize,
    setMaxFileSize,
    addToUndoStack,
    undo,
    redo,

    // Settings
    updateSettings,
    updateStatistics,

    // State
    setLoading,
    setError,
    resetState,
    resetFilters,
  };

  return {
    state,
    dispatch,
    actions,
    canUndo,
    canRedo,
    selectedFilesArray,
    selectedSubfoldersArray,
  };
};

export default useBillTrackerReducer;
