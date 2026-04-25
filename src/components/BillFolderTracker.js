"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";
import { BillFolderTrackerPropTypes } from "./BillFolderTracker.propTypes";
import {
  formatFileSize,
  formatMonth,
  getFileIcon,
  getFileColor,
  getCurrentMonth,
  calculateGstFolderStructure,
  validateDateRange,
  validateFileSize,
  parseManualSubfolders,
} from "../utils/billTrackerHelpers";

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Keyboard shortcuts hook
const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      const activeElement = document.activeElement;
      const isInputElement =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true");

      if (isInputElement) return; // Don't interfere with typing

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isCtrl = ctrlKey || metaKey;

      Object.entries(shortcuts).forEach(([shortcut, action]) => {
        const handler = action[0]; // Extract the handler function from the array
        const requiredKeys = shortcut.split("+");

        const hasRequiredKeys = requiredKeys.every((k) => {
          if (k === "ctrl") return isCtrl;
          if (k === "shift") return shiftKey;
          return key.toLowerCase() === k.toLowerCase();
        });

        if (hasRequiredKeys) {
          event.preventDefault();
          handler();
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

const BILL_TRACKER_PREFERENCES_KEY = "bill-folder-tracker-preferences";
// Lazy load heavy sub-components to improve initial load time
const ReportGenerator = dynamic(() => import("./ReportGenerator"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
    </div>
  ),
});

const TagManager = dynamic(() => import("./TagManager"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
    </div>
  ),
});

// Enhanced state management with performance optimizations
export default function BillFolderTracker({ isVisible, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [subfolders, setSubfolders] = useState([]);
  const [subfolderTree, setSubfolderTree] = useState([]);
  const [selectedSubfolders, setSelectedSubfolders] = useState(new Set());
  const [ignoredSubfolders, setIgnoredSubfolders] = useState(new Set());
  const [ignoredFiles, setIgnoredFiles] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);
  const [trackingData, setTrackingData] = useState({});
  const [currentMonth, setCurrentMonth] = useState("");
  const [allFiles, setAllFiles] = useState([]);
  const [gstSubmittedFolder, setGstSubmittedFolder] = useState("");

  // New enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [bulkActions, setBulkActions] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editingSentMonth, setEditingSentMonth] = useState(null);
  const [editingBillMonth, setEditingBillMonth] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSentMonth, setBulkSentMonth] = useState("");
  const [bulkBillMonth, setBulkBillMonth] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showChangeFoldersModal, setShowChangeFoldersModal] = useState(false);
  const [settings, setSettings] = useState({
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
  });
  const [newSelectedFolder, setNewSelectedFolder] = useState("");
  const [newSubfolders, setNewSubfolders] = useState([]);
  const [newSubfolderTree, setNewSubfolderTree] = useState([]);
  const [newSelectedSubfolders, setNewSelectedSubfolders] = useState(new Set());
  const [newIgnoredSubfolders, setNewIgnoredSubfolders] = useState(new Set());
  const [newGstSubmittedFolder, setNewGstSubmittedFolder] = useState("");

  // New states for subfolder management
  const [subfolderInputMethod, setSubfolderInputMethod] = useState("ui");
  const [manualSubfolders, setManualSubfolders] = useState("");

  // New states for advanced features
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [minFileSize, setMinFileSize] = useState(0);
  const [maxFileSize, setMaxFileSize] = useState(Infinity);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const [tags, setTags] = useState({});
  const [metricsVersion, setMetricsVersion] = useState(0);

  // Pagination states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");

  // Virtual scrolling refs (kept for legacy support if needed, but we'll use standard pagination)
  const scrollContainerRef = useRef(null);
  const metricsRef = useRef({
    lastScanDurationMs: 0,
    lastScanAt: null,
  });
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const ITEM_HEIGHT = 80; // Approximate height of each row/item

  // Initialize current month
  useEffect(() => {
    const monthKey = getCurrentMonth();
    setCurrentMonth(monthKey);
    setBulkSentMonth(monthKey);
    setBulkBillMonth(monthKey);
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem(BILL_TRACKER_PREFERENCES_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.viewMode === "table" || parsed.viewMode === "grid") {
        setViewMode(parsed.viewMode);
      }
      if (typeof parsed.fileTypeFilter === "string") {
        setFileTypeFilter(parsed.fileTypeFilter);
      }
      if (typeof parsed.statusFilter === "string") {
        setStatusFilter(parsed.statusFilter);
      }
      if (typeof parsed.currentMonth === "string" && parsed.currentMonth) {
        setCurrentMonth(parsed.currentMonth);
      }
      if (typeof parsed.pageSize === "number") {
        setPageSize(parsed.pageSize);
      }
    } catch (e) {
      console.error("Failed to load bill tracker preferences", e);
    }
  }, []);

  // Load configuration when modal opens
  useEffect(() => {
    if (isVisible) {
      loadConfiguration();
    }
  }, [isVisible]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const prefs = {
        viewMode,
        fileTypeFilter,
        statusFilter,
        currentMonth,
        pageSize,
      };
      window.localStorage.setItem(
        BILL_TRACKER_PREFERENCES_KEY,
        JSON.stringify(prefs),
      );
    } catch (e) {
      console.error("Failed to save bill tracker preferences", e);
    }
  }, [viewMode, fileTypeFilter, statusFilter, currentMonth]);

  // Auto-sync with GST folder periodically
  useEffect(() => {
    if (!config || !settings.autoSyncGst) return;

    const interval = setInterval(
      () => {
        loadFolderStructure();
      },
      settings.syncInterval * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [config, settings.autoSyncGst, settings.syncInterval]);

  // Virtual scrolling effect - moved to after function definitions
  useEffect(() => {
    // This effect will be defined after the helper functions
  }, []);

  // Centralized error handler
  const handleError = useCallback(
    (message, error = null) => {
      console.error(message, error);
      setError(message);
      if (settings.notifications) {
        toast.error(message, {
          duration: 4000,
          position: "top-right",
        });
      }
    },
    [settings.notifications],
  );

  // Undo/Redo functionality
  const addToUndoStack = useCallback((action) => {
    setUndoStack((prev) => [...prev.slice(-9), action]); // Keep only last 10 actions
    setRedoStack([]); // Clear redo stack when new action is performed
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    // Perform undo operation based on action type
    switch (lastAction.type) {
      case "MARK_SENT":
        handleMarkAsPending(lastAction.filePath);
        setRedoStack((prev) => [
          ...prev,
          {
            type: "MARK_PENDING",
            filePath: lastAction.filePath,
          },
        ]);
        break;
      case "MARK_PENDING":
        // Restore previous tracking data
        updateBillTracking(lastAction.filePath, lastAction.previousData);
        setRedoStack((prev) => [
          ...prev,
          {
            type: "RESTORE_DATA",
            filePath: lastAction.filePath,
            data: lastAction.previousData,
          },
        ]);
        break;
      case "IGNORE_FILE":
        setIgnoredFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(lastAction.filePath);
          return newSet;
        });
        setRedoStack((prev) => [
          ...prev,
          {
            type: "UNIGNORE_FILE",
            filePath: lastAction.filePath,
          },
        ]);
        break;
      default:
        break;
    }

    toast.success("Action undone");
  }, [undoStack, trackingData]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const lastUndoneAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    // Perform redo operation
    switch (lastUndoneAction.type) {
      case "MARK_PENDING":
        handleMarkAsPending(lastUndoneAction.filePath);
        setUndoStack((prev) => [
          ...prev,
          {
            type: "MARK_PENDING",
            filePath: lastUndoneAction.filePath,
          },
        ]);
        break;
      case "RESTORE_DATA":
        updateBillTracking(lastUndoneAction.filePath, lastUndoneAction.data);
        setUndoStack((prev) => [
          ...prev,
          {
            type: "RESTORE_DATA",
            filePath: lastUndoneAction.filePath,
            data: lastUndoneAction.data,
          },
        ]);
        break;
      case "UNIGNORE_FILE":
        handleToggleIgnoredFile(lastUndoneAction.filePath);
        setUndoStack((prev) => [
          ...prev,
          {
            type: "IGNORE_FILE",
            filePath: lastUndoneAction.filePath,
          },
        ]);
        break;
      default:
        break;
    }

    toast.success("Action redone");
  }, [redoStack]);

  // Load configuration from file
  const loadConfiguration = useCallback(async () => {
    if (!window.electronAPI) {
      handleError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const configResult = await window.electronAPI.loadFolderConfig();
      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
        setSelectedFolder(configResult.config.folderPath);
        setSelectedSubfolders(
          new Set(configResult.config.selectedSubfolders || []),
        );
        setIgnoredSubfolders(
          new Set(configResult.config.ignoredSubfolders || []),
        );
        setIgnoredFiles(new Set(configResult.config.ignoredFiles || []));
        setGstSubmittedFolder(configResult.config.gstSubmittedFolderPath || "");

        if (configResult.config.settings) {
          setSettings((prev) => ({ ...prev, ...configResult.config.settings }));
        }

        if (configResult.config.folderPath) {
          const scanResult = await window.electronAPI.scanFolderStructure(
            configResult.config.folderPath,
          );
          if (scanResult.success) {
            const loadedSubfolders = scanResult.subfolders || [];
            setSubfolders(loadedSubfolders);
            setSubfolderTree(scanResult.treeStructure || []);
            setStep(3);
            await loadTrackingData();
            await loadFolderStructure(loadedSubfolders);
          }
        }

        if (configResult.config.tags) {
          setTags(configResult.config.tags);
        }
      } else {
        setStep(1);
      }
    } catch (err) {
      handleError("Failed to load configuration", err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load tracking data from file
  const loadTrackingData = useCallback(async () => {
    if (!window.electronAPI) return;

    try {
      const result = await window.electronAPI.loadBillTracking();
      if (result.success) {
        setTrackingData(result.tracking || {});
      }
    } catch (err) {
      console.error("Error loading tracking data:", err);
    }
  }, []);

  // Load folder structure and files
  const loadFolderStructure = useCallback(
    async (subfoldersToUse = null) => {
      if (!config || !window.electronAPI) return;

      const startTime = performance.now();
      setIsLoading(true);
      try {
        const foldersToSearch = subfoldersToUse || subfolders;
        const selectedPaths = Array.from(selectedSubfolders)
          .map((identifier) => {
            if (identifier.includes("/") || identifier.includes("\\")) {
              return identifier;
            }
            const found = foldersToSearch.find(
              (sf) => sf.name === identifier || sf.path === identifier,
            );
            return found ? found.path : null;
          })
          .filter(Boolean);

        if (selectedPaths.length === 0) {
          setAllFiles([]);
          setIsLoading(false);
          return;
        }

        const scanResult =
          await window.electronAPI.scanBillsInFolders(selectedPaths);
        if (scanResult.success) {
          const files = [];
          scanResult.folders.forEach((folder) => {
            folder.files.forEach((file) => {
              if (
                !ignoredFiles.has(file.path) &&
                !ignoredFiles.has(file.name)
              ) {
                files.push({
                  ...file,
                  folder: folder.name,
                  folderPath: folder.path,
                });
              }
            });
          });
          setAllFiles(files);

          if (config.gstSubmittedFolderPath && files.length > 0) {
            try {
              const billFilePaths = files.map((f) => f.path);
              const gstScanResult =
                await window.electronAPI.scanGstSubmittedFolder(
                  config.gstSubmittedFolderPath,
                  billFilePaths,
                );

              if (gstScanResult.success && gstScanResult.matches) {
                let updatedTrackingData = { ...trackingData };
                if (!updatedTrackingData.bills) {
                  updatedTrackingData.bills = {};
                }

                const gstFileNames = new Set(
                  gstScanResult.matches.map((m) => m.fileName),
                );
                const filesByName = new Map(files.map((f) => [f.name, f]));

                Object.keys(updatedTrackingData.bills).forEach((filePath) => {
                  const fileName = filePath.split(/[\\/]/).pop();
                  if (!gstFileNames.has(fileName)) {
                    delete updatedTrackingData.bills[filePath];
                  }
                });

                let updatedCount = 0;
                gstScanResult.matches.forEach((match) => {
                  const file = filesByName.get(match.fileName);
                  if (file) {
                    const filePath = file.path;
                    if (
                      !updatedTrackingData.bills[filePath] ||
                      updatedTrackingData.bills[filePath].sentMonth !==
                        match.submissionMonth
                    ) {
                      updatedTrackingData.bills[filePath] = {
                        sentMonth: match.submissionMonth,
                        billMonth: getBillMonth(
                          file.createdDate,
                          file.modifiedDate,
                        ),
                        sentAt: new Date().toISOString(),
                      };
                      updatedCount++;
                    }
                  }
                });

                if (updatedCount > 0) {
                  const saveResult =
                    await window.electronAPI.saveBillTracking(
                      updatedTrackingData,
                    );
                  if (saveResult.success) {
                    setTrackingData(updatedTrackingData);
                    if (settings.notifications) {
                      toast.success(
                        `Auto-updated ${updatedCount} bill(s) from GST folder!`,
                      );
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Error scanning GST submitted folder:", err);
            }
          }
        }
      } catch (err) {
        handleError("Failed to scan bills", err);
      } finally {
        setIsLoading(false);
        const duration = performance.now() - startTime;
        metricsRef.current.lastScanDurationMs = Math.round(duration);
        metricsRef.current.lastScanAt = new Date().toISOString();
        setMetricsVersion((prev) => prev + 1);
      }
    },
    [
      config,
      selectedSubfolders,
      subfolders,
      ignoredFiles,
      trackingData,
      settings.notifications,
      handleError,
    ],
  );

  // Select main folder
  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      handleError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await window.electronAPI.selectBillFolder();
      if (result.success) {
        setSelectedFolder(result.folderPath);
        const scanResult = await window.electronAPI.scanFolderStructure(
          result.folderPath,
        );
        if (scanResult.success) {
          setSubfolders(scanResult.subfolders || []);
          setSubfolderTree(scanResult.treeStructure || []);
          setStep(2);
        } else {
          setError(scanResult.error || "Failed to scan folder");
        }
      } else {
        setError(result.error || "Failed to select folder");
      }
    } catch (err) {
      handleError("Failed to select folder", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle subfolder selection
  const handleToggleSubfolder = (subfolderPath) => {
    const newSelected = new Set(selectedSubfolders);
    if (newSelected.has(subfolderPath)) {
      newSelected.delete(subfolderPath);
    } else {
      newSelected.add(subfolderPath);
    }
    setSelectedSubfolders(newSelected);
  };

  // Toggle ignored subfolder
  const handleToggleIgnoredSubfolder = (subfolderPath) => {
    const newIgnored = new Set(ignoredSubfolders);
    if (newIgnored.has(subfolderPath)) {
      newIgnored.delete(subfolderPath);
    } else {
      newIgnored.add(subfolderPath);
    }
    setIgnoredSubfolders(newIgnored);
  };

  // Select all subfolders
  const handleSelectAllSubfolders = () => {
    const allSubfolderPaths = subfolders.map((sf) => sf.path);
    setSelectedSubfolders(new Set(allSubfolderPaths));
  };

  // Deselect all subfolders
  const handleDeselectAllSubfolders = () => {
    setSelectedSubfolders(new Set());
  };

  // Ignore all subfolders
  const handleIgnoreAllSubfolders = () => {
    const allSubfolderPaths = subfolders.map((sf) => sf.path);
    setIgnoredSubfolders(new Set(allSubfolderPaths));
  };

  // Unignore all subfolders
  const handleUnignoreAllSubfolders = () => {
    setIgnoredSubfolders(new Set());
  };

  // Select GST submitted folder
  const handleSelectGstSubmittedFolder = async () => {
    if (!window.electronAPI) {
      handleError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await window.electronAPI.selectBillFolder();
      if (result.success) {
        setGstSubmittedFolder(result.folderPath);
      } else {
        setError(result.error || "Failed to select GST submitted folder");
      }
    } catch (err) {
      handleError("Failed to select GST submitted folder", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save configuration
  const handleSaveConfiguration = async () => {
    // Remove validation checks - allow saving with any data
    if (!window.electronAPI) {
      handleError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const configToSave = {
        folderPath: selectedFolder || "",
        selectedSubfolders: Array.from(selectedSubfolders),
        ignoredSubfolders: Array.from(ignoredSubfolders),
        ignoredFiles: Array.from(ignoredFiles),
        gstSubmittedFolderPath: gstSubmittedFolder,
        settings: settings,
        tags: tags,
        configuredAt: new Date().toISOString(),
      };

      const result = await window.electronAPI.saveFolderConfig(configToSave);
      if (result.success) {
        setConfig(configToSave);
        try {
          await loadTrackingData();
          await loadFolderStructure();
          setStep(3);
          if (settings.notifications) {
            toast.success("Configuration saved successfully!");
          }
        } catch (loadError) {
          console.error("Error loading data after save:", loadError);
          setError("Configuration saved but failed to refresh data");
        }
      } else {
        setError(result.error || "Failed to save configuration");
      }
    } catch (err) {
      handleError("Failed to save configuration", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle ignored file - FIXED VERSION
  const handleToggleIgnoredFile = (filePath) => {
    const newIgnored = new Set(ignoredFiles);
    const wasIgnored = newIgnored.has(filePath);

    if (wasIgnored) {
      newIgnored.delete(filePath);
    } else {
      newIgnored.add(filePath);
    }
    setIgnoredFiles(newIgnored);

    // Add to undo stack
    addToUndoStack({
      type: "IGNORE_FILE",
      filePath: filePath,
      wasIgnored: wasIgnored,
    });

    // Persist changes immediately
    setTimeout(() => {
      handleSaveIgnoredFiles();
    }, 100);
  };

  // Save ignored files
  const handleSaveIgnoredFiles = async () => {
    if (!window.electronAPI) return;

    setIsLoading(true);
    try {
      const configToSave = {
        ...config,
        ignoredFiles: Array.from(ignoredFiles),
      };

      const result = await window.electronAPI.saveFolderConfig(configToSave);
      if (result.success) {
        setConfig(configToSave);
        if (settings.notifications) {
          toast.success("Ignored files updated successfully!");
        }
        await loadFolderStructure();
      } else {
        setError(result.error || "Failed to update ignored files");
      }
    } catch (err) {
      handleError("Failed to update ignored files", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get bill status based on GST folder contents
  const getBillStatus = (filePath, fileName) => {
    if (config?.gstSubmittedFolderPath) {
      return trackingData.bills?.[filePath] ? "sent" : "pending";
    }
    return "pending";
  };

  // Get bill sent month
  const getBillSentMonth = (filePath) => {
    return trackingData.bills?.[filePath]?.sentMonth || null;
  };

  // Get bill month with fallback logic
  const getBillMonth = (fileCreatedDate = null, fileModifiedDate = null) => {
    if (
      fileCreatedDate &&
      fileCreatedDate !== null &&
      fileCreatedDate !== undefined
    ) {
      try {
        const date = new Date(fileCreatedDate);
        if (!isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
        }
      } catch (e) {
        console.warn("Error parsing creation date:", fileCreatedDate);
      }
    }

    if (
      fileModifiedDate &&
      fileModifiedDate !== null &&
      fileModifiedDate !== undefined
    ) {
      try {
        const date = new Date(fileModifiedDate);
        if (!isNaN(date.getTime())) {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
        }
      } catch (e) {
        console.warn("Error parsing modified date:", fileModifiedDate);
      }
    }

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(
      prevMonth.getMonth() + 1,
    ).padStart(2, "0")}`;
  };

  // Get financial year
  const getFinancialYear = useMemo(() => {
    return (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return month < 4
        ? `${year - 1}-${String(year).slice(-2)}`
        : `${year}-${String(year + 1).slice(-2)}`;
    };
  }, []);

  // Update bill tracking data with improved GST folder structure handling
  const updateBillTracking = async (
    filePath,
    updates,
    shouldCopyFile = false,
    shouldDeleteFile = false,
  ) => {
    try {
      let updatedTrackingData = { ...trackingData };
      if (!updatedTrackingData.bills) {
        updatedTrackingData.bills = {};
      }

      // Store previous state for undo
      const previousData = updatedTrackingData.bills[filePath] || null;

      if (updates === null) {
        delete updatedTrackingData.bills[filePath];
      } else {
        if (!updatedTrackingData.bills[filePath]) {
          updatedTrackingData.bills[filePath] = {};
        }
        Object.assign(updatedTrackingData.bills[filePath], updates);
      }

      const result =
        await window.electronAPI.saveBillTracking(updatedTrackingData);
      if (result.success) {
        setTrackingData(updatedTrackingData);

        if (config?.gstSubmittedFolderPath) {
          if (shouldCopyFile && updates?.sentMonth) {
            try {
              const billMonth = updates.billMonth || getBillMonth();
              const { yearFolderName, submissionFolderName } =
                calculateGstFolderStructure(updates.sentMonth, billMonth);

              const copyResult =
                await window.electronAPI.copyBillToGstSubmitted(
                  filePath,
                  config.gstSubmittedFolderPath,
                  updates.sentMonth,
                  yearFolderName,
                  submissionFolderName,
                );

              if (
                copyResult &&
                copyResult.success &&
                copyResult.destinationPath
              ) {
                updatedTrackingData.bills[filePath].gstSubmittedPath =
                  copyResult.destinationPath;
                setTrackingData({ ...updatedTrackingData });
                await window.electronAPI.saveBillTracking(updatedTrackingData);
              }
            } catch (copyErr) {
              console.warn(
                "Failed to copy file to GST submitted folder:",
                copyErr,
              );
            }
          } else if (shouldDeleteFile) {
            try {
              const billInfo = trackingData.bills?.[filePath];
              if (billInfo?.gstSubmittedPath) {
                await window.electronAPI.deleteBillFromGstSubmitted(
                  billInfo.gstSubmittedPath,
                );
              }
            } catch (deleteErr) {
              console.warn(
                "Failed to delete file from GST submitted folder:",
                deleteErr,
              );
            }
          }
        }

        // Add to undo stack
        addToUndoStack({
          type: "UPDATE_TRACKING",
          filePath: filePath,
          previousData: previousData,
          newData: updatedTrackingData.bills[filePath],
        });
      }
    } catch (err) {
      handleError("Failed to update bill", err);
    }
  };

  // Mark bill as sent
  const handleMarkAsSent = (billPath, fileCreatedDate, fileModifiedDate) => {
    const billMonth = getBillMonth(fileCreatedDate, fileModifiedDate);
    updateBillTracking(
      billPath,
      {
        sentMonth: currentMonth,
        billMonth: billMonth,
        sentAt: new Date().toISOString(),
      },
      true,
      false,
    );

    // Add to undo stack
    addToUndoStack({
      type: "MARK_SENT",
      filePath: billPath,
    });
  };

  // Mark bill as pending (UNDO - deletes from GST folder)
  const handleMarkAsPending = (billPath) => {
    // Store previous tracking data for undo
    const previousData = trackingData.bills?.[billPath] || null;

    updateBillTracking(billPath, null, false, true);

    // Add to undo stack
    addToUndoStack({
      type: "MARK_PENDING",
      filePath: billPath,
      previousData: previousData,
    });
  };

  // Update bill month
  const handleUpdateBillMonth = (billPath, newMonth) => {
    updateBillTracking(billPath, { billMonth: newMonth });
  };

  // Update sent month
  const handleUpdateSentMonth = (billPath, newMonth) => {
    updateBillTracking(billPath, { sentMonth: newMonth }, true, false);
  };

  // Bulk mark as sent
  const handleBulkMarkAsSent = async () => {
    setIsLoading(true);
    try {
      let updatedTrackingData = { ...trackingData };
      if (!updatedTrackingData.bills) {
        updatedTrackingData.bills = {};
      }

      for (const filePath of selectedFiles) {
        const file = allFiles.find((f) => f.path === filePath);
        const fileBillMonth = file
          ? getBillMonth(file.createdDate, file.modifiedDate)
          : null;

        if (!updatedTrackingData.bills[filePath]) {
          updatedTrackingData.bills[filePath] = {};
        }
        updatedTrackingData.bills[filePath].billMonth = fileBillMonth;
        updatedTrackingData.bills[filePath].sentMonth = bulkSentMonth;
        updatedTrackingData.bills[filePath].sentAt = new Date().toISOString();

        if (config?.gstSubmittedFolderPath) {
          try {
            const { yearFolderName, submissionFolderName } =
              calculateGstFolderStructure(
                bulkSentMonth,
                fileBillMonth || getCurrentMonth(),
              );

            await window.electronAPI.copyBillToGstSubmitted(
              filePath,
              config.gstSubmittedFolderPath,
              bulkSentMonth,
              yearFolderName,
              submissionFolderName,
            );
          } catch (copyErr) {
            console.warn(
              "Failed to copy file to GST submitted folder:",
              copyErr,
            );
          }
        }
      }

      const result =
        await window.electronAPI.saveBillTracking(updatedTrackingData);
      if (result.success) {
        setTrackingData(updatedTrackingData);
        setSelectedFiles(new Set());
        setShowBulkActions(false);
        if (settings.notifications) {
          toast.success(`${selectedFiles.size} bills updated successfully!`);
        }
      } else {
        if (settings.notifications) {
          toast.error("Failed to update bills");
        }
      }
    } catch (err) {
      handleError("Failed to update bills", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format functions are now imported from billTrackerHelpers

  // Open change folders modal
  const openChangeFoldersModal = async () => {
    if (!window.electronAPI) return;

    setIsLoading(true);
    try {
      const result = await window.electronAPI.selectBillFolder();
      if (result.success) {
        setNewSelectedFolder(result.folderPath);
        setNewSelectedSubfolders(new Set(selectedSubfolders));
        setNewIgnoredSubfolders(new Set(ignoredSubfolders));
        setNewGstSubmittedFolder(gstSubmittedFolder);

        // Initialize manual subfolders with current selection
        setManualSubfolders(Array.from(selectedSubfolders).join("\n"));

        const scanResult = await window.electronAPI.scanFolderStructure(
          result.folderPath,
        );
        if (scanResult.success) {
          setNewSubfolders(scanResult.subfolders || []);
          setNewSubfolderTree(scanResult.treeStructure || []);
          setShowChangeFoldersModal(true);
        } else {
          setError(scanResult.error || "Failed to scan folder");
        }
      } else {
        setError(result.error || "Failed to select folder");
      }
    } catch (err) {
      handleError("Failed to select folder", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save changed folders - UPDATED FOR MANUAL INPUT
  const handleSaveChangedFolders = async () => {
    let finalSelectedSubfolders = newSelectedSubfolders;

    if (subfolderInputMethod === "manual") {
      const parseResult = parseManualSubfolders(manualSubfolders);
      if (!parseResult.isValid) {
        setError(parseResult.error);
        return;
      }
      finalSelectedSubfolders = new Set(parseResult.paths);
    }

    if (finalSelectedSubfolders.size === 0) {
      setError("Please select at least one subfolder");
      return;
    }

    if (!window.electronAPI) return;

    setIsLoading(true);
    try {
      const configToSave = {
        ...config,
        folderPath: newSelectedFolder,
        selectedSubfolders: Array.from(finalSelectedSubfolders),
        ignoredSubfolders: Array.from(newIgnoredSubfolders),
        ignoredFiles: Array.from(ignoredFiles),
        gstSubmittedFolderPath: newGstSubmittedFolder,
      };

      const result = await window.electronAPI.saveFolderConfig(configToSave);
      if (result.success) {
        setConfig(configToSave);
        setSelectedFolder(newSelectedFolder);
        setSelectedSubfolders(new Set(finalSelectedSubfolders));
        setIgnoredSubfolders(new Set(newIgnoredSubfolders));
        setGstSubmittedFolder(newGstSubmittedFolder);
        setSubfolders(newSubfolders);
        setSubfolderTree(newSubfolderTree);
        setShowChangeFoldersModal(false);
        await loadFolderStructure(newSubfolders);
        if (settings.notifications) {
          toast.success("Folders updated successfully!");
        }
      } else {
        setError(result.error || "Failed to update folders");
      }
    } catch (err) {
      handleError("Failed to update folders", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!window.electronAPI) return;

    setIsLoading(true);
    try {
      const configToSave = {
        ...config,
        settings: settings,
        gstSubmittedFolderPath:
          gstSubmittedFolder || (config ? config.gstSubmittedFolderPath : ""),
        tags: tags,
      };

      const result = await window.electronAPI.saveFolderConfig(configToSave);
      if (result.success) {
        setConfig(configToSave);
        if (settings.notifications) {
          toast.success("Settings saved successfully!");
        }
        setShowSettings(false);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      handleError("Failed to save settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset configuration to start over
  const handleResetConfiguration = () => {
    setSelectedFolder("");
    setSubfolders([]);
    setSubfolderTree([]);
    setSelectedSubfolders(new Set());
    setIgnoredSubfolders(new Set());
    setGstSubmittedFolder("");
    setStep(1);
  };

  // Batch operations
  const handleBatchIgnore = () => {
    const newIgnored = new Set(ignoredFiles);
    selectedFiles.forEach((filePath) => {
      newIgnored.add(filePath);
    });
    setIgnoredFiles(newIgnored);
    handleSaveIgnoredFiles();
    clearSelection();
    toast.success(`Ignored ${selectedFiles.size} files`);
  };

  const handleBatchDelete = async () => {
    if (!window.electronAPI) {
      handleError("This action is only available in the desktop app");
      return;
    }
    try {
      const result = await window.electronAPI.deleteFiles(
        Array.from(selectedFiles),
      );
      if (result.success) {
        toast.success(`Deleted ${selectedFiles.size} files`);
        clearSelection();
        await loadFolderStructure();
      } else {
        toast.error("Failed to delete files");
      }
    } catch (err) {
      handleError("Failed to delete files", err);
    }
  };

  const handleBatchMove = async () => {
    if (!window.electronAPI) {
      handleError("This action is only available in the desktop app");
      return;
    }
    try {
      const destination = await window.electronAPI.selectBillFolder();
      if (destination.success) {
        const result = await window.electronAPI.moveFiles(
          Array.from(selectedFiles),
          destination.folderPath,
        );
        if (result.success) {
          toast.success(`Moved ${selectedFiles.size} files`);
          clearSelection();
          await loadFolderStructure();
        } else {
          toast.error("Failed to move files");
        }
      }
    } catch (err) {
      handleError("Failed to move files", err);
    }
  };

  // Export data
  const handleExportData = async () => {
    if (!window.electronAPI) {
      handleError("This action is only available in the desktop app");
      return;
    }
    try {
      const exportData = {
        files: allFiles.map((file) => ({
          name: file.name,
          path: file.path,
          size: file.size,
          createdDate: file.createdDate,
          modifiedDate: file.modifiedDate,
          folder: file.folder,
          status: getBillStatus(file.path, file.name),
          billMonth: getBillMonth(file.createdDate, file.modifiedDate),
          sentMonth: getBillSentMonth(file.path),
        })),
        summary: getDetailedStats(),
        exportedAt: new Date().toISOString(),
      };

      const result = await window.electronAPI.exportBillData(exportData);
      if (result.success) {
        toast.success("Data exported successfully!");
      }
    } catch (err) {
      handleError("Failed to export data", err);
    }
  };

  // Memoize filtered and sorted files
  const getFilteredAndSortedFiles = useCallback(() => {
    let filteredFiles = [...allFiles];

    if (debouncedSearchTerm) {
      filteredFiles = filteredFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          file.folder.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      );
    }

    if (fileTypeFilter !== "all") {
      filteredFiles = filteredFiles.filter(
        (file) => file.extension === fileTypeFilter,
      );
    }

    if (statusFilter !== "all") {
      filteredFiles = filteredFiles.filter(
        (file) => getBillStatus(file.path, file.name) === statusFilter,
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate <= endDate
      ) {
        filteredFiles = filteredFiles.filter((file) => {
          const fileDate = new Date(file.modifiedDate);
          return fileDate >= startDate && fileDate <= endDate;
        });
      }
    }

    // File size filter
    if (minFileSize > 0 || maxFileSize < Infinity) {
      filteredFiles = filteredFiles.filter((file) => {
        return file.size >= minFileSize && file.size <= maxFileSize;
      });
    }

    filteredFiles.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "modified":
          aValue = new Date(a.modifiedDate);
          bValue = new Date(b.modifiedDate);
          break;
        case "billMonth":
          const aBillMonth = getBillMonth(a.createdDate, a.modifiedDate);
          const bBillMonth = getBillMonth(b.createdDate, b.modifiedDate);
          aValue = aBillMonth || "";
          bValue = bBillMonth || "";
          break;
        case "sentMonth":
          aValue = getBillSentMonth(a.path) || "";
          bValue = getBillSentMonth(b.path) || "";
          break;
        case "status":
          aValue = getBillStatus(a.path, a.name);
          bValue = getBillStatus(b.path, b.name);
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredFiles;
  }, [
    allFiles,
    debouncedSearchTerm,
    fileTypeFilter,
    statusFilter,
    sortBy,
    sortOrder,
    trackingData,
    config,
    dateRange,
    minFileSize,
    maxFileSize,
  ]);

  // Memoize detailed statistics
  const getDetailedStats = useCallback(() => {
    const stats = {
      total: allFiles.length,
      pending: 0,
      sent: 0,
      byType: {},
      byMonth: {},
      fileSizeDistribution: { small: 0, medium: 0, large: 0 },
    };

    allFiles.forEach((file) => {
      // Status counting
      const status = getBillStatus(file.path, file.name);
      if (status === "sent") stats.sent++;
      else stats.pending++;

      // File type distribution
      const ext = file.extension || "unknown";
      stats.byType[ext] = (stats.byType[ext] || 0) + 1;

      // File size distribution
      if (file.size < 1024 * 1024) stats.fileSizeDistribution.small++;
      else if (file.size < 10 * 1024 * 1024)
        stats.fileSizeDistribution.medium++;
      else stats.fileSizeDistribution.large++;

      // Monthly distribution
      const billMonth = getBillMonth(file.createdDate, file.modifiedDate);
      stats.byMonth[billMonth] = (stats.byMonth[billMonth] || 0) + 1;
    });

    stats.percentage =
      stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

    return stats;
  }, [allFiles, trackingData]);

  // Memoize summary statistics
  const getSummaryStats = useCallback(() => {
    const totalFiles = allFiles.length;
    const pendingFiles = allFiles.filter(
      (file) => getBillStatus(file.path, file.name) === "pending",
    ).length;
    const sentFiles = totalFiles - pendingFiles;

    return {
      total: totalFiles,
      pending: pendingFiles,
      sent: sentFiles,
      percentage:
        totalFiles > 0 ? Math.round((sentFiles / totalFiles) * 100) : 0,
    };
  }, [allFiles, trackingData, config]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput("1");
  }, [
    debouncedSearchTerm,
    fileTypeFilter,
    statusFilter,
    sortBy,
    sortOrder,
    dateRange,
    minFileSize,
    maxFileSize,
  ]);

  const filteredAndSortedFiles = useMemo(
    () => getFilteredAndSortedFiles(),
    [getFilteredAndSortedFiles],
  );

  const totalItems = filteredAndSortedFiles.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedFiles.slice(start, start + pageSize);
  }, [filteredAndSortedFiles, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    const page = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(page);
    setPageInput(String(page));
    // Scroll to top of list
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handlePageInputBlur = () => {
    const val = parseInt(pageInput, 10);
    if (!isNaN(val)) {
      handlePageChange(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
  };

  // Helper for status classes
  const getStatusBadgeClass = (status) => {
    return status === "sent"
      ? "bg-green-100 text-green-800"
      : "bg-amber-100 text-amber-800";
  };

  // File icon and color functions are now imported from billTrackerHelpers

  // Toggle file selection for bulk actions
  const toggleFileSelection = (filePath) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Select all files
  const selectAllFiles = () => {
    const allFilePaths = getFilteredAndSortedFiles().map((file) => file.path);
    setSelectedFiles(new Set(allFilePaths));
    setShowBulkActions(true);
  };

  // Clear file selection
  const clearSelection = () => {
    setSelectedFiles(new Set());
    setShowBulkActions(false);
  };

  const handleDateRangeChange = (key, value) => {
    const updated = { ...dateRange, [key]: value };
    const validation = validateDateRange(updated.start, updated.end);
    if (!validation.isValid) {
      handleError(validation.error);
      return;
    }
    setDateRange(updated);
  };

  const handleMinFileSizeChange = (event) => {
    const value = event.target.value;
    const validation = validateFileSize(value, maxFileSize, "min");
    if (!validation.isValid) {
      handleError(validation.error);
      return;
    }
    setMinFileSize(validation.bytes);
  };

  const handleMaxFileSizeChange = (event) => {
    const value = event.target.value;
    const validation = validateFileSize(value, minFileSize, "max");
    if (!validation.isValid) {
      handleError(validation.error);
      return;
    }
    setMaxFileSize(validation.bytes);
  };

  // Handle month change
  const handleMonthChange = (event) => {
    const value = event.target.value;
    if (!value) {
      setCurrentMonth("");
      return;
    }
    const isValid = /^\d{4}-\d{2}$/.test(value);
    if (!isValid) {
      handleError("Invalid month format. Please use YYYY-MM.");
      return;
    }
    setCurrentMonth(value);
  };

  // Refresh folder structure
  const handleRefresh = async () => {
    await loadFolderStructure();
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Keyboard shortcuts - moved after function definitions to avoid reference errors
  useKeyboardShortcuts(
    {
      "ctrl+f": [
        () => {
          // Focus search input
          const searchInput = document.querySelector(
            'input[placeholder*="Search"]',
          );
          if (searchInput) searchInput.focus();
        },
      ],
      "ctrl+a": [
        () => {
          // Select all files
          const filteredFiles = getFilteredAndSortedFiles();
          setSelectedFiles(new Set(filteredFiles.map((f) => f.path)));
        },
      ],
      escape: [
        () => {
          // Clear selection
          setSelectedFiles(new Set());
          setShowBulkActions(false);
        },
      ],
      "ctrl+z": [
        () => {
          // Undo
          if (undoStack.length > 0) handleUndo();
        },
      ],
      "ctrl+y": [
        () => {
          // Redo
          if (redoStack.length > 0) handleRedo();
        },
      ],
      "ctrl+s": [
        () => {
          // Save configuration
          handleSaveConfiguration();
        },
      ],
      delete: [
        () => {
          // Delete selected files
          if (selectedFiles.size > 0) {
            handleBatchDelete();
          }
        },
      ],
      "ctrl+r": [
        () => {
          // Refresh data
          loadTrackingData();
        },
      ],
    },
    [
      showBulkActions,
      selectedFiles,
      showSettings,
      showChangeFoldersModal,
      handleUndo,
      handleRedo,
      selectAllFiles,
      clearSelection,
      handleSaveConfiguration,
      handleBatchDelete,
      loadTrackingData,
    ],
  );

  // Virtual scrolling effect - defined after helper functions
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
      const endIndex = Math.min(
        startIndex + Math.ceil(container.clientHeight / ITEM_HEIGHT) + 5,
        getFilteredAndSortedFiles().length,
      );

      setVisibleRange({ start: Math.max(0, startIndex - 5), end: endIndex });
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [getFilteredAndSortedFiles]); // Add dependency

  // Don't render if not visible
  if (!isVisible) return null;

  // Theme classes
  const getThemeClasses = () => {
    if (settings.theme === "dark") {
      return {
        container: "bg-gray-900 text-white",
        card: "bg-gray-800 border-gray-700",
        button: "bg-gray-700 hover:bg-gray-600 text-white",
        input: "bg-gray-700 border-gray-600 text-white",
      };
    }
    return {
      container: "bg-white text-gray-900",
      card: "bg-white border-gray-200",
      button: "bg-gray-100 hover:bg-gray-200 text-gray-800",
      input: "bg-white border-gray-300 text-gray-900",
    };
  };

  const theme = getThemeClasses();

  return (
    <>
      {/* Settings Modal - FIXED OVERFLOW ISSUE */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-auto p-4">
          <div
            className={`${theme.container} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-tracker-settings-title"
          >
            <h2
              id="bill-tracker-settings-title"
              className="text-2xl font-bold mb-6 flex items-center"
            >
              <svg
                className="w-7 h-7 mr-3 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Settings
            </h2>

            <div className="space-y-6">
              {/* Folder Paths Section */}
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  Folder Paths
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bills Folder
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={selectedFolder || "Not set"}
                        className={`flex-1 border rounded-l-lg px-4 py-2.5 text-sm ${theme.input}`}
                      />
                      <button
                        onClick={handleSelectFolder}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GST Submitted Folder
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={gstSubmittedFolder || "Not set"}
                        className={`flex-1 border rounded-l-lg px-4 py-2.5 text-sm ${theme.input}`}
                      />
                      <button
                        onClick={handleSelectGstSubmittedFolder}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-r-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* IMPROVED MANAGE SUBFOLDERS SECTION */}
                  <div className="border rounded-xl p-5 mt-6">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      Manage Subfolders
                    </h3>

                    <div className="mb-4">
                      <div className="flex space-x-2 mb-4">
                        <button
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                            subfolderInputMethod === "ui"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => setSubfolderInputMethod("ui")}
                        >
                          Visual Selection
                        </button>
                        <button
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                            subfolderInputMethod === "manual"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => setSubfolderInputMethod("manual")}
                        >
                          Manual Input
                        </button>
                      </div>

                      {subfolderInputMethod === "ui"
                        ? <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                            {subfolders.length > 0
                              ? subfolders.map((subfolder) => (
                                  <div
                                    key={subfolder.path}
                                    className="flex items-center py-2 border-b last:border-0"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={newSelectedSubfolders.has(
                                        subfolder.path,
                                      )}
                                      onChange={() => {
                                        const newSelected = new Set(
                                          newSelectedSubfolders,
                                        );
                                        if (newSelected.has(subfolder.path)) {
                                          newSelected.delete(subfolder.path);
                                        } else {
                                          newSelected.add(subfolder.path);
                                        }
                                        setNewSelectedSubfolders(newSelected);
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm flex-1 truncate">
                                      {subfolder.name}
                                    </span>
                                    <button
                                      onClick={() => {
                                        const newIgnored = new Set(
                                          newIgnoredSubfolders,
                                        );
                                        if (newIgnored.has(subfolder.path)) {
                                          newIgnored.delete(subfolder.path);
                                        } else {
                                          newIgnored.add(subfolder.path);
                                        }
                                        setNewIgnoredSubfolders(newIgnored);
                                      }}
                                      className={`text-xs px-2 py-1 rounded ${
                                        newIgnoredSubfolders.has(subfolder.path)
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {newIgnoredSubfolders.has(subfolder.path)
                                        ? "Ignored"
                                        : "Ignore"}
                                    </button>
                                  </div>
                                ))
                              : <p className="text-gray-500 text-center py-4">
                                  No subfolders found
                                </p>}
                          </div>
                        : <div>
                            <textarea
                              value={manualSubfolders}
                              onChange={(e) =>
                                setManualSubfolders(e.target.value)
                              }
                              placeholder='Enter folder paths (one per line) or JSON array&#10;Example:&#10;/path/to/folder1&#10;/path/to/folder2&#10;&#10;Or JSON:&#10;["/path/to/folder1", "/path/to/folder2"]'
                              className="w-full h-40 p-3 border rounded-lg font-mono text-sm"
                            />
                            <div className="mt-2 text-xs text-gray-500">
                              Enter one folder path per line or paste a JSON
                              array of paths
                            </div>
                          </div>}
                    </div>

                    <button
                      onClick={() => setShowChangeFoldersModal(true)}
                      className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Application Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Theme
                    </label>
                    <select
                      className={`w-full border rounded-lg px-3 py-2 ${theme.input}`}
                      value={settings.theme}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, theme: e.target.value }))
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Default Sent Month
                    </label>
                    <select
                      className={`w-full border rounded-lg px-3 py-2 ${theme.input}`}
                      value={settings.defaultSentMonth}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          defaultSentMonth: e.target.value,
                        }))
                      }
                    >
                      <option value="current">Current</option>
                      <option value="bill">Bill Month</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Auto Expand Folders
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.autoExpandFolders}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          autoExpandFolders: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Show File Size
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showFileSize}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          showFileSize: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Show Modified Date
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showModifiedDate}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          showModifiedDate: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Show Bill Month
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showBillMonth}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          showBillMonth: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Show Sent Month
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showSentMonth}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          showSentMonth: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Enable Notifications
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          notifications: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Auto Sync GST Folder
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.autoSyncGst}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          autoSyncGst: e.target.checked,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Sync Interval (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className={`w-full border rounded-lg px-3 py-2 ${theme.input}`}
                      value={settings.syncInterval}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          syncInterval: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Reset Section */}
              <div className="border rounded-xl p-5 bg-red-50">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Reset Configuration
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  This will reset all folder selections and start the setup
                  process over.
                </p>
                <button
                  onClick={handleResetConfiguration}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Reset All Folders
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4 ${theme.container}`}
      >
        <div
          className={`${theme.card} rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bill-tracker-title"
          data-metrics-version={metricsVersion}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                <span className="text-2xl text-white">🧾</span>
              </div>
              <div>
                <h1 id="bill-tracker-title" className="text-2xl font-bold">
                  Bill Tracker
                </h1>
                <p className="text-sm">Bill management dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Statistics"
                aria-pressed={showStats}
                aria-label={showStats ? "Hide statistics" : "Show statistics"}
              >
                📊
              </button>
              <button
                onClick={() => setShowReports(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reports"
                aria-haspopup="dialog"
                aria-label="Open reports"
              >
                📈
              </button>
              <button
                onClick={handleExportData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export Data"
                aria-label="Export bill data"
              >
                📤
              </button>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Keyboard Shortcuts"
                aria-label="Show keyboard shortcuts"
              >
                ⌨️
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
                aria-haspopup="dialog"
                aria-label="Open settings"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                aria-label="Refresh bills"
              >
                ↻ Refresh
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close bill tracker"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && step === 1
              ? <div className="flex items-center justify-center py-20">
                  <LoadingSpinner text="Loading configuration..." />
                </div>
              : step === 1
                ? /* Step 1: Folder Selection */
                  <div className="p-12 max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg
                          className="w-12 h-12 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold mb-3">
                        Select Bills Folder
                      </h2>
                      <p className="text-lg max-w-md mx-auto">
                        Choose the main folder containing your bill subfolders
                        to get started
                      </p>
                    </div>

                    {selectedFolder && (
                      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border shadow-sm">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-blue-500 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Selected Folder
                            </p>
                            <p className="text-sm text-blue-700 truncate font-mono mt-1">
                              {selectedFolder}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mb-8 p-5 bg-red-50 rounded-xl border">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-red-500 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleSelectFolder}
                      className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <svg
                        className="w-6 h-6 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Select Main Folder
                    </button>
                  </div>
                : step === 2
                  ? /* Step 2: Subfolder Selection */
                    <div className="p-8">
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">
                          Select Subfolders
                        </h2>
                        <p className="">
                          Choose which bill folders to track and manage
                        </p>
                        {selectedFolder && (
                          <div className="mt-4 flex items-center text-sm bg-blue-50 p-3 rounded-lg">
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                              />
                            </svg>
                            <span className="truncate font-mono">
                              {selectedFolder}
                            </span>
                          </div>
                        )}
                      </div>

                      {error && (
                        <div className="mb-8 p-4 bg-red-50 rounded-lg border">
                          <div className="flex items-center">
                            <svg
                              className="w-5 h-5 text-red-500 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      )}

                      {/* Subfolder Selection Controls */}
                      <div className="mb-6 flex flex-wrap gap-3">
                        <button
                          onClick={handleSelectAllSubfolders}
                          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={handleDeselectAllSubfolders}
                          className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Deselect All
                        </button>
                        <button
                          onClick={handleIgnoreAllSubfolders}
                          className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          Ignore All
                        </button>
                        <button
                          onClick={handleUnignoreAllSubfolders}
                          className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Unignore All
                        </button>
                      </div>

                      <div className="mb-8">
                        <div className="border rounded-xl max-h-96 overflow-y-auto shadow-sm">
                          {subfolderTree.length > 0
                            ? <div className="p-4">
                                {subfolderTree.map((folder) => (
                                  <div
                                    key={folder.path}
                                    className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedSubfolders.has(
                                        folder.path,
                                      )}
                                      onChange={() =>
                                        handleToggleSubfolder(folder.path)
                                      }
                                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <svg
                                      className="w-6 h-6 text-gray-500 mx-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                      />
                                    </svg>
                                    <span className="flex-1 font-medium">
                                      {folder.name}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleToggleIgnoredSubfolder(
                                          folder.path,
                                        )
                                      }
                                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                        ignoredSubfolders.has(folder.path)
                                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      }`}
                                    >
                                      {ignoredSubfolders.has(folder.path)
                                        ? "Ignored"
                                        : "Ignore"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            : subfolders.length > 0
                              ? <div className="p-4">
                                  {subfolders.map((subfolder) => (
                                    <div
                                      key={subfolder.path}
                                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedSubfolders.has(
                                          subfolder.path,
                                        )}
                                        onChange={() =>
                                          handleToggleSubfolder(subfolder.path)
                                        }
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <svg
                                        className="w-6 h-6 text-gray-500 mx-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                        />
                                      </svg>
                                      <span className="flex-1 font-medium">
                                        {subfolder.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleToggleIgnoredSubfolder(
                                            subfolder.path,
                                          )
                                        }
                                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                          ignoredSubfolders.has(subfolder.path)
                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                      >
                                        {ignoredSubfolders.has(subfolder.path)
                                          ? "Ignored"
                                          : "Ignore"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              : <div className="text-center py-16 text-gray-400">
                                  <svg
                                    className="w-16 h-16 mx-auto mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                    />
                                  </svg>
                                  <p className="text-lg">No subfolders found</p>
                                  <p className="text-sm mt-1">
                                    Please select a different folder
                                  </p>
                                </div>}
                        </div>
                      </div>

                      {/* GST Submitted Folder */}
                      <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border">
                        <h3 className="font-semibold mb-3 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          GST Submitted Folder (Optional)
                        </h3>
                        <p className="text-sm mb-5">
                          Select folder for automatic status detection and
                          synchronization. Structure:
                          YEAR-FOLDER/BILL-MONTH-SENT-MONTH-FOLDER
                        </p>

                        {gstSubmittedFolder && (
                          <div className="mb-5 p-4 bg-green-50 rounded-lg border">
                            <div className="flex items-center">
                              <svg
                                className="w-5 h-5 text-green-500 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-green-800">
                                  GST Folder
                                </p>
                                <p className="text-xs text-green-700 truncate font-mono mt-1">
                                  {gstSubmittedFolder}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleSelectGstSubmittedFolder}
                          disabled={isLoading}
                          className="w-full px-4 py-3 text-sm font-medium text-green-700 bg-white border rounded-lg hover:bg-green-50 transition-colors shadow-sm"
                        >
                          {gstSubmittedFolder
                            ? "Change GST Folder"
                            : "Select GST Folder"}
                        </button>
                      </div>

                      <div className="flex justify-between pt-6 border-t">
                        <button
                          onClick={() => setStep(1)}
                          className="px-6 py-3 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handleSaveConfiguration}
                          disabled={isLoading}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {isLoading ? "Saving..." : "Continue →"}
                        </button>
                      </div>
                    </div>
                  : /* Step 3: Tracking View */
                    <div className="p-6">
                      {/* Stats Dashboard */}
                      {showStats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900">
                              File Types
                            </h4>
                            <div className="mt-2 space-y-1">
                              {Object.entries(getDetailedStats().byType).map(
                                ([type, count]) => (
                                  <div
                                    key={type}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>{type}</span>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900">
                              Monthly Distribution
                            </h4>
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                              {Object.entries(getDetailedStats().byMonth).map(
                                ([month, count]) => (
                                  <div
                                    key={month}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>{formatMonth(month)}</span>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="font-medium text-purple-900">
                              Size Distribution
                            </h4>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Small (&lt;1MB)</span>
                                <span className="font-medium">
                                  {
                                    getDetailedStats().fileSizeDistribution
                                      .small
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Medium (1-10MB)</span>
                                <span className="font-medium">
                                  {
                                    getDetailedStats().fileSizeDistribution
                                      .medium
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Large (&gt;10MB)</span>
                                <span className="font-medium">
                                  {
                                    getDetailedStats().fileSizeDistribution
                                      .large
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-700 text-xs font-bold uppercase tracking-wide">
                                Total Bills
                              </p>
                              <p className="text-4xl font-bold text-blue-900 mt-2">
                                {getSummaryStats().total}
                              </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-amber-700 text-xs font-bold uppercase tracking-wide">
                                Pending
                              </p>
                              <p className="text-4xl font-bold text-amber-900 mt-2">
                                {getSummaryStats().pending}
                              </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-700 text-xs font-bold uppercase tracking-wide">
                                Sent
                              </p>
                              <p className="text-4xl font-bold text-green-900 mt-2">
                                {getSummaryStats().sent}
                              </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-700 text-xs font-bold uppercase tracking-wide">
                                Completion
                              </p>
                              <p className="text-4xl font-bold text-purple-900 mt-2">
                                {getSummaryStats().percentage}%
                              </p>
                              <div className="mt-3 h-2 bg-purple-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, getSummaryStats().percentage),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Filters and Controls */}
                      <div className="rounded-2xl p-6 mb-8 border border-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-white">
                        <h3 className="text-sm font-bold text-gray-700 mb-5 flex items-center uppercase tracking-wider">
                          <svg
                            className="w-4 h-4 mr-2 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 3a1 1 0 011-1h12a1 1 0 011 1H3zm0 2h14v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1h10v10H5V4z"
                            />
                          </svg>
                          Filters & View
                        </h3>
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 flex-1">
                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Month
                              </label>
                              <input
                                type="month"
                                value={currentMonth}
                                onChange={handleMonthChange}
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              />
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Search
                              </label>
                              <input
                                type="text"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              />
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Type
                              </label>
                              <select
                                value={fileTypeFilter}
                                onChange={(e) =>
                                  setFileTypeFilter(e.target.value)
                                }
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              >
                                <option value="all">All Types</option>
                                <option value=".pdf">PDF</option>
                                <option value=".json">JSON</option>
                              </select>
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Status
                              </label>
                              <select
                                value={statusFilter}
                                onChange={(e) =>
                                  setStatusFilter(e.target.value)
                                }
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="sent">Sent</option>
                              </select>
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Min Size (KB)
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={
                                  minFileSize > 0 ? minFileSize / 1024 : ""
                                }
                                onChange={handleMinFileSizeChange}
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              />
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Max Size (MB)
                              </label>
                              <input
                                type="number"
                                placeholder="∞"
                                value={
                                  maxFileSize < Infinity
                                    ? maxFileSize / (1024 * 1024)
                                    : ""
                                }
                                onChange={handleMaxFileSizeChange}
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              />
                            </div>

                            <div className="group">
                              <label className="text-xs font-semibold mb-2 block text-gray-700">
                                Page Size
                              </label>
                              <select
                                value={pageSize}
                                onChange={(e) =>
                                  setPageSize(Number(e.target.value))
                                }
                                className={`w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200 ${theme.input}`}
                              >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() =>
                                setViewMode(
                                  viewMode === "table" ? "grid" : "table",
                                )
                              }
                              className="px-4 py-2.5 text-sm font-semibold bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all shadow-md hover:shadow-lg text-blue-700"
                            >
                              {viewMode === "table"
                                ? "Grid View"
                                : "Table View"}
                            </button>
                            <button
                              onClick={openChangeFoldersModal}
                              className="px-4 py-2.5 text-sm font-medium text-indigo-700 bg-white border rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
                              title="Change Folders"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="text-xs font-medium mb-2 block">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) =>
                                handleDateRangeChange("start", e.target.value)
                              }
                              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${theme.input}`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-2 block">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) =>
                                handleDateRangeChange("end", e.target.value)
                              }
                              className={`w-full px-4 py-2.5 border rounded-lg text-sm ${theme.input}`}
                            />
                          </div>
                        </div>

                        {showBulkActions && (
                          <div className="mt-6 bg-blue-50 p-5 rounded-xl border">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm font-medium">
                                {selectedFiles.size} file(s) selected
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={clearSelection}
                                  className="text-xs hover:text-gray-800"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={handleBatchIgnore}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                >
                                  Ignore
                                </button>
                                <button
                                  onClick={handleBatchDelete}
                                  className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={handleBatchMove}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  Move
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs mb-2">
                                  Bill Month
                                </label>
                                <input
                                  type="month"
                                  value={bulkBillMonth}
                                  onChange={(e) =>
                                    setBulkBillMonth(e.target.value)
                                  }
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.input}`}
                                />
                              </div>

                              <div>
                                <label className="block text-xs mb-2">
                                  Sent Month
                                </label>
                                <input
                                  type="month"
                                  value={bulkSentMonth}
                                  onChange={(e) =>
                                    setBulkSentMonth(e.target.value)
                                  }
                                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.input}`}
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  onClick={handleBulkMarkAsSent}
                                  disabled={
                                    isLoading ||
                                    !bulkBillMonth ||
                                    !bulkSentMonth
                                  }
                                  title={
                                    !bulkBillMonth || !bulkSentMonth
                                      ? "Please set both bill month and sent month"
                                      : ""
                                  }
                                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isLoading ? "Updating..." : "Mark as Sent"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {config && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
                          <div className="flex items-center justify-between">
                            <p className="text-xs truncate font-mono">
                              {config.folderPath}
                            </p>
                            <button
                              onClick={() => setShowSettings(true)}
                              className="text-xs hover:text-blue-800 font-medium"
                            >
                              Change Paths
                            </button>
                          </div>
                        </div>
                      )}

                      {isLoading
                        ? <div className="flex items-center justify-center py-20">
                            <LoadingSpinner text="Loading bills..." />
                          </div>
                        : getFilteredAndSortedFiles().length === 0
                          ? <div className="text-center py-20 rounded-2xl border">
                              <div className="text-7xl mb-6">📂</div>
                              <h3 className="text-2xl font-medium mb-3">
                                No bills found
                              </h3>
                              <p className="mb-6 max-w-md mx-auto">
                                Try adjusting your filters or refresh the list
                                to see your bills
                              </p>
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setFileTypeFilter("all");
                                  setStatusFilter("all");
                                  setDateRange({ start: "", end: "" });
                                  setMinFileSize(0);
                                  setMaxFileSize(Infinity);
                                }}
                                className="px-6 py-3 text-sm font-medium hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                Clear all filters
                              </button>
                            </div>
                          : <div className="flex flex-col h-full">
                              {viewMode === "grid"
                                ? /* Grid View with Pagination */
                                  <div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2"
                                    style={{
                                      minHeight: "400px",
                                      maxHeight: "calc(100vh - 450px)",
                                    }}
                                  >
                                    {paginatedFiles.map((file) => {
                                      const status = getBillStatus(
                                        file.path,
                                        file.name,
                                      );
                                      const billMonth = getBillMonth(
                                        file.createdDate,
                                        file.modifiedDate,
                                      );
                                      const sentMonth = getBillSentMonth(
                                        file.path,
                                      );
                                      const fileTags = tags[file.path] || [];

                                      return (
                                        <div
                                          key={file.path}
                                          className={`border rounded-2xl p-5 transition-all hover:shadow-md bg-white ${
                                            selectedFiles.has(file.path)
                                              ? "ring-2 ring-blue-500 bg-blue-50 border-blue-300"
                                              : "border-gray-200"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between">
                                            <div
                                              className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${getFileColor(
                                                file.extension,
                                              )} shadow-sm`}
                                            >
                                              <span className="text-xl">
                                                {getFileIcon(file.extension)}
                                              </span>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                              <input
                                                type="checkbox"
                                                checked={selectedFiles.has(
                                                  file.path,
                                                )}
                                                onChange={() =>
                                                  toggleFileSelection(file.path)
                                                }
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                              />
                                              <button
                                                onClick={() =>
                                                  handleToggleIgnoredFile(
                                                    file.path,
                                                  )
                                                }
                                                className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
                                              >
                                                Ignore
                                              </button>
                                            </div>
                                          </div>

                                          <div className="mt-4">
                                            <h3
                                              className="text-sm font-bold truncate text-gray-900"
                                              title={file.name}
                                            >
                                              {file.name}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 mt-0.5 truncate uppercase tracking-tight">
                                              {file.folder}
                                            </p>
                                          </div>

                                          <div className="mt-3 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600 uppercase">
                                              {file.extension.replace(".", "")}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-600">
                                              {formatFileSize(file.size)}
                                            </span>
                                            {fileTags.map((tag) => (
                                              <span
                                                key={tag}
                                                className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700"
                                              >
                                                {tag}
                                              </span>
                                            ))}
                                          </div>

                                          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                Bill Month
                                              </label>
                                              <div className="mt-1">
                                                {editingBillMonth === file.path
                                                  ? <input
                                                      type="month"
                                                      value={billMonth || ""}
                                                      onChange={(e) =>
                                                        handleUpdateBillMonth(
                                                          file.path,
                                                          e.target.value,
                                                        )
                                                      }
                                                      onBlur={() =>
                                                        setEditingBillMonth(
                                                          null,
                                                        )
                                                      }
                                                      onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                          setEditingBillMonth(
                                                            null,
                                                          );
                                                        if (e.key === "Escape")
                                                          setEditingBillMonth(
                                                            null,
                                                          );
                                                      }}
                                                      autoFocus
                                                      className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                  : <button
                                                      onClick={() =>
                                                        setEditingBillMonth(
                                                          file.path,
                                                        )
                                                      }
                                                      className="w-full text-left text-xs font-semibold text-gray-700 hover:text-blue-600"
                                                    >
                                                      {billMonth
                                                        ? formatMonth(billMonth)
                                                        : "Set Month"}
                                                    </button>}
                                              </div>
                                            </div>

                                            <div>
                                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                                Sent Month
                                              </label>
                                              <div className="mt-1">
                                                {editingSentMonth === file.path
                                                  ? <input
                                                      type="month"
                                                      value={sentMonth || ""}
                                                      onChange={(e) =>
                                                        handleUpdateSentMonth(
                                                          file.path,
                                                          e.target.value,
                                                        )
                                                      }
                                                      onBlur={() =>
                                                        setEditingSentMonth(
                                                          null,
                                                        )
                                                      }
                                                      onKeyDown={(e) => {
                                                        if (e.key === "Enter")
                                                          setEditingSentMonth(
                                                            null,
                                                          );
                                                        if (e.key === "Escape")
                                                          setEditingSentMonth(
                                                            null,
                                                          );
                                                      }}
                                                      autoFocus
                                                      className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                  : <button
                                                      onClick={() =>
                                                        setEditingSentMonth(
                                                          file.path,
                                                        )
                                                      }
                                                      className="w-full text-left text-xs font-semibold text-gray-700 hover:text-blue-600"
                                                    >
                                                      {sentMonth
                                                        ? formatMonth(sentMonth)
                                                        : "Pending"}
                                                    </button>}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="mt-4 flex items-center justify-between">
                                            {status === "sent"
                                              ? <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                                                  ✓ Sent
                                                </span>
                                              : <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                                                  ● Pending
                                                </span>}

                                            <div className="flex space-x-1">
                                              {status === "sent"
                                                ? <button
                                                    onClick={() =>
                                                      handleMarkAsPending(
                                                        file.path,
                                                      )
                                                    }
                                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50 uppercase tracking-wider"
                                                  >
                                                    Revert
                                                  </button>
                                                : <button
                                                    onClick={() =>
                                                      handleMarkAsSent(
                                                        file.path,
                                                        file.createdDate,
                                                        file.modifiedDate,
                                                      )
                                                    }
                                                    disabled={
                                                      !trackingData.bills?.[
                                                        file.path
                                                      ]?.billMonth
                                                    }
                                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
                                                  >
                                                    Mark Sent
                                                  </button>}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                : /* Table View with Pagination */
                                  <div
                                    className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col"
                                    style={{
                                      minHeight: "400px",
                                      maxHeight: "calc(100vh - 450px)",
                                    }}
                                  >
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                          <tr>
                                            <th className="px-6 py-4 w-10">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  selectedFiles.size > 0 &&
                                                  selectedFiles.size ===
                                                    filteredAndSortedFiles.length
                                                }
                                                onChange={
                                                  selectedFiles.size > 0
                                                    ? clearSelection
                                                    : selectAllFiles
                                                }
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                              />
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              File Details
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              Folder
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              Size
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              Bill Month
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                              Status
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {paginatedFiles.map((file) => {
                                            const status = getBillStatus(
                                              file.path,
                                              file.name,
                                            );
                                            const billMonth = getBillMonth(
                                              file.createdDate,
                                              file.modifiedDate,
                                            );
                                            const isSelected =
                                              selectedFiles.has(file.path);
                                            const fileTags =
                                              tags[file.path] || [];

                                            return (
                                              <tr
                                                key={file.path}
                                                className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50/50" : ""}`}
                                              >
                                                <td className="px-6 py-4">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                      toggleFileSelection(
                                                        file.path,
                                                      )
                                                    }
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                  />
                                                </td>
                                                <td className="px-6 py-4">
                                                  <div className="flex items-center space-x-3">
                                                    <div
                                                      className={`w-9 h-9 flex items-center justify-center rounded-lg ${getFileColor(file.extension)} text-lg shadow-sm`}
                                                    >
                                                      {getFileIcon(
                                                        file.extension,
                                                      )}
                                                    </div>
                                                    <div className="min-w-0">
                                                      <p
                                                        className="text-sm font-bold text-gray-900 truncate max-w-[200px]"
                                                        title={file.name}
                                                      >
                                                        {file.name}
                                                      </p>
                                                      <div className="flex gap-1 mt-1">
                                                        {fileTags.map((tag) => (
                                                          <span
                                                            key={tag}
                                                            className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold uppercase"
                                                          >
                                                            {tag}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-tighter truncate max-w-[150px]">
                                                  {file.folder}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-600">
                                                  {formatFileSize(file.size)}
                                                </td>
                                                <td className="px-6 py-4">
                                                  {editingBillMonth ===
                                                  file.path
                                                    ? <input
                                                        type="month"
                                                        value={billMonth || ""}
                                                        onChange={(e) =>
                                                          handleUpdateBillMonth(
                                                            file.path,
                                                            e.target.value,
                                                          )
                                                        }
                                                        onBlur={() =>
                                                          setEditingBillMonth(
                                                            null,
                                                          )
                                                        }
                                                        className="text-xs border rounded p-1"
                                                        autoFocus
                                                      />
                                                    : <button
                                                        onClick={() =>
                                                          setEditingBillMonth(
                                                            file.path,
                                                          )
                                                        }
                                                        className="text-xs font-bold text-gray-700 hover:text-blue-600"
                                                      >
                                                        {billMonth
                                                          ? formatMonth(
                                                              billMonth,
                                                            )
                                                          : "Set Month"}
                                                      </button>}
                                                </td>
                                                <td className="px-6 py-4">
                                                  <span
                                                    className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                                                      status === "sent"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-100 text-amber-700"
                                                    }`}
                                                  >
                                                    {status}
                                                  </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                  <div className="flex justify-end space-x-2">
                                                    {status === "sent"
                                                      ? <button
                                                          onClick={() =>
                                                            handleMarkAsPending(
                                                              file.path,
                                                            )
                                                          }
                                                          className="text-[10px] font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded"
                                                        >
                                                          REVERT
                                                        </button>
                                                      : <button
                                                          onClick={() =>
                                                            handleMarkAsSent(
                                                              file.path,
                                                              file.createdDate,
                                                              file.modifiedDate,
                                                            )
                                                          }
                                                          disabled={
                                                            !trackingData
                                                              .bills?.[
                                                              file.path
                                                            ]?.billMonth
                                                          }
                                                          className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded disabled:opacity-30"
                                                        >
                                                          MARK SENT
                                                        </button>}
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>}

                              {/* Pagination Controls */}
                              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                      Page Size:
                                    </span>
                                    <select
                                      value={pageSize}
                                      onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                        setPageInput("1");
                                      }}
                                      className="text-xs font-bold border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                      {[10, 25, 50, 100].map((size) => (
                                        <option key={size} value={size}>
                                          {size} items
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Showing{" "}
                                    <span className="text-gray-900">
                                      {Math.min(
                                        totalItems,
                                        (currentPage - 1) * pageSize + 1,
                                      )}
                                    </span>{" "}
                                    to{" "}
                                    <span className="text-gray-900">
                                      {Math.min(
                                        totalItems,
                                        currentPage * pageSize,
                                      )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="text-gray-900">
                                      {totalItems}
                                    </span>{" "}
                                    bills
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="First Page"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                      />
                                    </svg>
                                  </button>

                                  <div className="flex items-center gap-2 px-2">
                                    <input
                                      type="text"
                                      value={pageInput}
                                      onChange={(e) =>
                                        setPageInput(e.target.value)
                                      }
                                      onBlur={handlePageInputBlur}
                                      onKeyDown={handlePageInputKeyDown}
                                      className="w-12 text-center text-xs font-bold border rounded-lg py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <span className="text-xs font-bold text-gray-400 uppercase">
                                      of {totalPages}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() =>
                                      handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title="Last Page"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {/* Undo/Redo Controls */}
                              {(undoStack.length > 0 ||
                                redoStack.length > 0) && (
                                <div className="flex justify-center mt-6 gap-4">
                                  <button
                                    onClick={handleUndo}
                                    disabled={undoStack.length === 0}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest"
                                  >
                                    Undo Action ({undoStack.length})
                                  </button>
                                  <button
                                    onClick={handleRedo}
                                    disabled={redoStack.length === 0}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors uppercase text-xs tracking-widest"
                                  >
                                    Redo Action ({redoStack.length})
                                  </button>
                                </div>
                              )}
                            </div>}
                    </div>}
          </div>
        </div>
      </div>

      {/* Reports Modal */}
      {showReports && (
        <ReportGenerator
          files={allFiles}
          trackingData={trackingData}
          tags={tags}
          onClose={() => setShowReports(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Navigation & Search
                </h4>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+F
                  </span>
                  <span className="text-gray-600">Focus search input</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+R
                  </span>
                  <span className="text-gray-600">Refresh data</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Esc
                  </span>
                  <span className="text-gray-600">Clear selection</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 mb-2">Actions</h4>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+A
                  </span>
                  <span className="text-gray-600">Select all files</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+S
                  </span>
                  <span className="text-gray-600">Save configuration</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+Z
                  </span>
                  <span className="text-gray-600">Undo last action</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Ctrl+Y
                  </span>
                  <span className="text-gray-600">Redo last action</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    Delete
                  </span>
                  <span className="text-gray-600">Delete selected files</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

BillFolderTracker.propTypes = BillFolderTrackerPropTypes;

export const BillFolderTrackerMeta = {
  props: {
    isVisible: "boolean",
    onClose: "function",
  },
  behavior:
    "Modal dashboard for configuring bill folders, tracking statuses, and managing GST submissions.",
};
