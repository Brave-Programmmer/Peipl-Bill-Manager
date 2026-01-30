/**
 * Custom hook for Bill Folder Tracker state management
 * Consolidates related state and provides unified interface
 */

import { useState, useReducer, useCallback } from "react";

/**
 * Initial state for tracker configuration
 */
const INITIAL_CONFIG_STATE = {
  selectedFolder: "",
  subfolders: [],
  subfolderTree: [],
  selectedSubfolders: new Set(),
  ignoredSubfolders: new Set(),
  ignoredFiles: new Set(),
  gstSubmittedFolder: "",
  config: null,
  step: 1,
  isLoading: false,
  error: "",
};

/**
 * Initial state for bill tracking
 */
const INITIAL_TRACKING_STATE = {
  trackingData: {},
  currentMonth: "",
  allFiles: [],
  editingSentMonth: null,
  editingBillMonth: null,
};

/**
 * Initial state for UI
 */
const INITIAL_UI_STATE = {
  viewMode: "table",
  fileTypeFilter: "all",
  statusFilter: "all",
  searchTerm: "",
  sortBy: "name",
  sortOrder: "asc",
  selectedFiles: new Set(),
  showBulkActions: false,
  showSettings: false,
  showChangeFoldersModal: false,
  showStats: false,
  showReports: false,
  visibleRange: { start: 0, end: 20 },
};

/**
 * Initial state for filters
 */
const INITIAL_FILTER_STATE = {
  dateRange: { start: "", end: "" },
  minFileSize: 0,
  maxFileSize: Infinity,
};

/**
 * Initial state for bulk operations
 */
const INITIAL_BULK_STATE = {
  bulkSentMonth: "",
  bulkBillMonth: "",
};

/**
 * Configuration reducer
 */
const configReducer = (state, action) => {
  switch (action.type) {
    case "SET_SELECTED_FOLDER":
      return { ...state, selectedFolder: action.payload };
    case "SET_SUBFOLDERS":
      return {
        ...state,
        subfolders: action.payload.subfolders,
        subfolderTree: action.payload.treeStructure,
      };
    case "SET_SELECTED_SUBFOLDERS":
      return { ...state, selectedSubfolders: action.payload };
    case "TOGGLE_SUBFOLDER":
      const updated = new Set(state.selectedSubfolders);
      if (updated.has(action.payload)) {
        updated.delete(action.payload);
      } else {
        updated.add(action.payload);
      }
      return { ...state, selectedSubfolders: updated };
    case "SET_IGNORED_SUBFOLDERS":
      return { ...state, ignoredSubfolders: action.payload };
    case "TOGGLE_IGNORED_SUBFOLDER":
      const ignoredUpdated = new Set(state.ignoredSubfolders);
      if (ignoredUpdated.has(action.payload)) {
        ignoredUpdated.delete(action.payload);
      } else {
        ignoredUpdated.add(action.payload);
      }
      return { ...state, ignoredSubfolders: ignoredUpdated };
    case "SET_IGNORED_FILES":
      return { ...state, ignoredFiles: action.payload };
    case "TOGGLE_IGNORED_FILE":
      const filesUpdated = new Set(state.ignoredFiles);
      if (filesUpdated.has(action.payload)) {
        filesUpdated.delete(action.payload);
      } else {
        filesUpdated.add(action.payload);
      }
      return { ...state, ignoredFiles: filesUpdated };
    case "SET_GST_FOLDER":
      return { ...state, gstSubmittedFolder: action.payload };
    case "SET_CONFIG":
      return {
        ...state,
        config: action.payload,
        selectedFolder: action.payload.folderPath,
        selectedSubfolders: new Set(action.payload.selectedSubfolders || []),
        ignoredSubfolders: new Set(action.payload.ignoredSubfolders || []),
        ignoredFiles: new Set(action.payload.ignoredFiles || []),
        gstSubmittedFolder: action.payload.gstSubmittedFolderPath || "",
      };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return INITIAL_CONFIG_STATE;
    default:
      return state;
  }
};

/**
 * Tracking reducer
 */
const trackingReducer = (state, action) => {
  switch (action.type) {
    case "SET_TRACKING_DATA":
      return { ...state, trackingData: action.payload };
    case "SET_CURRENT_MONTH":
      return { ...state, currentMonth: action.payload };
    case "SET_ALL_FILES":
      return { ...state, allFiles: action.payload };
    case "SET_EDITING_SENT_MONTH":
      return { ...state, editingSentMonth: action.payload };
    case "SET_EDITING_BILL_MONTH":
      return { ...state, editingBillMonth: action.payload };
    case "RESET":
      return INITIAL_TRACKING_STATE;
    default:
      return state;
  }
};

/**
 * UI reducer
 */
const uiReducer = (state, action) => {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_FILE_TYPE_FILTER":
      return { ...state, fileTypeFilter: action.payload };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload };
    case "SET_SEARCH_TERM":
      return { ...state, searchTerm: action.payload };
    case "SET_SORT_BY":
      return { ...state, sortBy: action.payload };
    case "SET_SORT_ORDER":
      return { ...state, sortOrder: action.payload };
    case "SET_SELECTED_FILES":
      return { ...state, selectedFiles: action.payload };
    case "TOGGLE_FILE_SELECTION":
      const updated = new Set(state.selectedFiles);
      if (updated.has(action.payload)) {
        updated.delete(action.payload);
      } else {
        updated.add(action.payload);
      }
      return {
        ...state,
        selectedFiles: updated,
        showBulkActions: updated.size > 0,
      };
    case "SHOW_BULK_ACTIONS":
      return { ...state, showBulkActions: action.payload };
    case "SHOW_SETTINGS":
      return { ...state, showSettings: action.payload };
    case "SHOW_CHANGE_FOLDERS":
      return { ...state, showChangeFoldersModal: action.payload };
    case "SHOW_STATS":
      return { ...state, showStats: action.payload };
    case "SHOW_REPORTS":
      return { ...state, showReports: action.payload };
    case "SET_VISIBLE_RANGE":
      return { ...state, visibleRange: action.payload };
    case "RESET":
      return INITIAL_UI_STATE;
    default:
      return state;
  }
};

/**
 * Custom hook for bill tracker state management
 * @returns {object} State and dispatch functions
 */
export const useBillTrackerState = () => {
  // Configuration state
  const [configState, dispatchConfig] = useReducer(
    configReducer,
    INITIAL_CONFIG_STATE
  );

  // Tracking state
  const [trackingState, dispatchTracking] = useReducer(
    trackingReducer,
    INITIAL_TRACKING_STATE
  );

  // UI state
  const [uiState, dispatchUI] = useReducer(uiReducer, INITIAL_UI_STATE);

  // Settings state
  const [settings, setSettings] = useState({
    theme: "light",
    defaultSentMonth: "current",
    autoExpandFolders: true,
    showFileSize: true,
    showModifiedDate: true,
    showBillMonth: true,
    showSentMonth: true,
    notifications: true,
    reminderDays: 7,
    autoSyncGst: true,
    syncInterval: 30,
  });

  // Filter state
  const [filterState, setFilterState] = useState(INITIAL_FILTER_STATE);

  // Bulk operations state
  const [bulkState, setBulkState] = useState(INITIAL_BULK_STATE);

  // Modal states
  const [newSelectedFolder, setNewSelectedFolder] = useState("");
  const [newSubfolders, setNewSubfolders] = useState([]);
  const [newSubfolderTree, setNewSubfolderTree] = useState([]);
  const [newSelectedSubfolders, setNewSelectedSubfolders] = useState(new Set());
  const [newIgnoredSubfolders, setNewIgnoredSubfolders] = useState(new Set());
  const [newGstSubmittedFolder, setNewGstSubmittedFolder] = useState("");

  // Advanced features state
  const [reminders, setReminders] = useState([]);
  const [tags, setTags] = useState({});
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [metricsVersion, setMetricsVersion] = useState(0);

  // Subfolder input method
  const [subfolderInputMethod, setSubfolderInputMethod] = useState("ui");
  const [manualSubfolders, setManualSubfolders] = useState("");

  // Undo/Redo utilities
  const addToUndoStack = useCallback((action) => {
    setUndoStack((prev) => [...prev.slice(-9), action]); // Keep last 10
    setRedoStack([]);
  }, []);

  const resetAll = useCallback(() => {
    dispatchConfig({ type: "RESET" });
    dispatchTracking({ type: "RESET" });
    dispatchUI({ type: "RESET" });
    setFilterState(INITIAL_FILTER_STATE);
    setBulkState(INITIAL_BULK_STATE);
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    // Configuration
    configState,
    dispatchConfig,
    // Tracking
    trackingState,
    dispatchTracking,
    // UI
    uiState,
    dispatchUI,
    // Settings
    settings,
    setSettings,
    // Filters
    filterState,
    setFilterState,
    // Bulk
    bulkState,
    setBulkState,
    // Modal states
    newSelectedFolder,
    setNewSelectedFolder,
    newSubfolders,
    setNewSubfolders,
    newSubfolderTree,
    setNewSubfolderTree,
    newSelectedSubfolders,
    setNewSelectedSubfolders,
    newIgnoredSubfolders,
    setNewIgnoredSubfolders,
    newGstSubmittedFolder,
    setNewGstSubmittedFolder,
    // Advanced
    reminders,
    setReminders,
    tags,
    setTags,
    undoStack,
    setUndoStack,
    redoStack,
    setRedoStack,
    metricsVersion,
    setMetricsVersion,
    // Subfolder input
    subfolderInputMethod,
    setSubfolderInputMethod,
    manualSubfolders,
    setManualSubfolders,
    // Utilities
    addToUndoStack,
    resetAll,
  };
};
