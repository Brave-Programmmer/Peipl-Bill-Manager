/**
 * Centralized state reducer for Bill Folder Tracker
 * Consolidates all state management into a single reducer for better organization and predictability
 */

const initialState = {
  // Configuration
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

  // Tracking data
  trackingData: {},
  currentMonth: "",
  allFiles: [],
  editingSentMonth: null,
  editingBillMonth: null,

  // UI State
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

  // Advanced features
  dateRange: { start: "", end: "" },
  minFileSize: 0,
  maxFileSize: Infinity,
  undoStack: [],
  redoStack: [],

  // Tags and metadata
  tags: {},
  metricsVersion: 0,

  // Settings
  settings: {
    theme: "light",
    defaultSentMonth: "current",
    autoExpandFolders: true,
    showFileSize: true,
    showModifiedDate: true,
    showBillMonth: true,
    showSentMonth: true,
    notifications: true,
    autoSyncGst: true,
    syncInterval: 30,
  },

  // Statistics
  statistics: {
    totalFiles: 0,
    totalSize: 0,
    averageFileSize: 0,
    filesByType: {},
    filesByMonth: {},
    submissionRate: 0,
    pendingCount: 0,
    sentCount: 0,
  },
};

export const billTrackerReducer = (state, action) => {
  switch (action.type) {
    // Configuration actions
    case "SET_SELECTED_FOLDER":
      return { ...state, selectedFolder: action.payload };

    case "SET_SUBFOLDERS":
      return {
        ...state,
        subfolders: action.payload.subfolders || [],
        subfolderTree: action.payload.treeStructure || [],
      };

    case "SET_SELECTED_SUBFOLDERS":
      return { ...state, selectedSubfolders: new Set(action.payload) };

    case "TOGGLE_SUBFOLDER":
      {
        const updated = new Set(state.selectedSubfolders);
        if (updated.has(action.payload)) {
          updated.delete(action.payload);
        } else {
          updated.add(action.payload);
        }
        return { ...state, selectedSubfolders: updated };
      }

    case "SELECT_ALL_SUBFOLDERS":
      return {
        ...state,
        selectedSubfolders: new Set(state.subfolders.map((sf) => sf.path)),
      };

    case "DESELECT_ALL_SUBFOLDERS":
      return { ...state, selectedSubfolders: new Set() };

    case "SET_IGNORED_SUBFOLDERS":
      return { ...state, ignoredSubfolders: new Set(action.payload) };

    case "TOGGLE_IGNORED_SUBFOLDER":
      {
        const ignored = new Set(state.ignoredSubfolders);
        if (ignored.has(action.payload)) {
          ignored.delete(action.payload);
        } else {
          ignored.add(action.payload);
        }
        return { ...state, ignoredSubfolders: ignored };
      }

    case "SET_IGNORED_FILES":
      return { ...state, ignoredFiles: new Set(action.payload) };

    case "TOGGLE_IGNORED_FILE":
      {
        const ignored = new Set(state.ignoredFiles);
        if (ignored.has(action.payload)) {
          ignored.delete(action.payload);
        } else {
          ignored.add(action.payload);
        }
        return { ...state, ignoredFiles: ignored };
      }

    case "SET_GST_SUBMITTED_FOLDER":
      return { ...state, gstSubmittedFolder: action.payload };

    case "SET_CONFIG":
      return { ...state, config: action.payload };

    case "SET_STEP":
      return { ...state, step: action.payload };

    // Tracking data actions
    case "SET_TRACKING_DATA":
      return { ...state, trackingData: action.payload };

    case "UPDATE_TRACKING_DATA":
      return {
        ...state,
        trackingData: {
          ...state.trackingData,
          [action.payload.filePath]: action.payload.data,
        },
      };

    case "SET_CURRENT_MONTH":
      return { ...state, currentMonth: action.payload };

    case "SET_ALL_FILES":
      return { ...state, allFiles: action.payload };

    case "SET_EDITING_SENT_MONTH":
      return { ...state, editingSentMonth: action.payload };

    case "SET_EDITING_BILL_MONTH":
      return { ...state, editingBillMonth: action.payload };

    // UI actions
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
      return { ...state, selectedFiles: new Set(action.payload) };

    case "TOGGLE_FILE_SELECTION":
      {
        const selected = new Set(state.selectedFiles);
        if (selected.has(action.payload)) {
          selected.delete(action.payload);
        } else {
          selected.add(action.payload);
        }
        return { ...state, selectedFiles: selected };
      }

    case "SELECT_ALL_FILES":
      return {
        ...state,
        selectedFiles: new Set(state.allFiles.map((f) => f.path)),
      };

    case "CLEAR_SELECTION":
      return { ...state, selectedFiles: new Set() };

    case "SET_SHOW_BULK_ACTIONS":
      return { ...state, showBulkActions: action.payload };

    case "SET_SHOW_SETTINGS":
      return { ...state, showSettings: action.payload };

    case "SET_SHOW_CHANGE_FOLDERS_MODAL":
      return { ...state, showChangeFoldersModal: action.payload };

    case "SET_SHOW_STATS":
      return { ...state, showStats: action.payload };

    case "SET_SHOW_REPORTS":
      return { ...state, showReports: action.payload };

    case "SET_VISIBLE_RANGE":
      return { ...state, visibleRange: action.payload };

    // Advanced features
    case "SET_DATE_RANGE":
      return { ...state, dateRange: action.payload };

    case "SET_MIN_FILE_SIZE":
      return { ...state, minFileSize: action.payload };

    case "SET_MAX_FILE_SIZE":
      return { ...state, maxFileSize: action.payload };

    case "ADD_TO_UNDO_STACK":
      return {
        ...state,
        undoStack: [...state.undoStack.slice(-9), action.payload],
        redoStack: [],
      };

    case "UNDO":
      if (state.undoStack.length === 0) return state;
      const undoAction = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, undoAction],
      };

    case "REDO":
      if (state.redoStack.length === 0) return state;
      const redoAction = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, redoAction],
      };

    // Tags and metadata
    case "SET_TAGS":
      return { ...state, tags: action.payload };

    case "UPDATE_TAG":
      return {
        ...state,
        tags: {
          ...state.tags,
          [action.payload.filePath]: action.payload.tags,
        },
      };

    case "INCREMENT_METRICS_VERSION":
      return { ...state, metricsVersion: state.metricsVersion + 1 };

    // Settings
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    // Statistics
    case "UPDATE_STATISTICS":
      return {
        ...state,
        statistics: { ...state.statistics, ...action.payload },
      };

    // Loading and error states
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    // Batch reset
    case "RESET_STATE":
      return initialState;

    case "RESET_FILTERS":
      return {
        ...state,
        searchTerm: "",
        fileTypeFilter: "all",
        statusFilter: "all",
        sortBy: "name",
        sortOrder: "asc",
        dateRange: { start: "", end: "" },
        minFileSize: 0,
        maxFileSize: Infinity,
      };

    default:
      return state;
  }
};

export default billTrackerReducer;
export { initialState };
