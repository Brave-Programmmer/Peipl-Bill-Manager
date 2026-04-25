"use client";

import {
  useState,
  useEffect,
  Suspense,
  memo,
  useMemo,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import AIAssistant from "../components/AIAssistant";
import CustomTitleBar from "../components/CustomTitleBar";
import toast from "react-hot-toast";
import {
  validateCompleteBillData,
  generateDefaultFileName,
} from "../utils/billValidation";
import {
  calculateSubtotal,
  calculateTotalCGST,
  calculateTotalSGST,
  calculateTotal,
} from "../utils/billCalculations";
import {
  getNextBillNumber,
  incrementBillNumberCounter,
} from "../utils/idGenerator";
import { useFileHandler } from "../hooks/useFileHandler";
import { useFileParser } from "../hooks/useFileParser";

// Create a loading spinner component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);

// Memoized core components (loaded immediately - needed on initial render)
const Header = dynamic(() => import("../components/Header"), { ssr: false });
const CompanyInfo = dynamic(() => import("../components/CompanyInfo"), { ssr: false });
const CustomerInfo = dynamic(() => import("../components/CustomerInfo"), { ssr: false });
const ItemsTable = dynamic(() => import("../components/ItemsTable"), { ssr: false });
const Totals = dynamic(() => import("../components/Totals"), { ssr: false });
const LoadingSpinner = dynamic(() => import("../components/LoadingSpinner"), { ssr: false });

// Lazy load heavy modals/components with Suspense fallback
const BillGenerator = dynamic(() => import("../components/BillGenerator"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});
const CredentialManager = dynamic(
  () => import("../components/CredentialManager"),
  {
    ssr: false,
    loading: () => <LoadingFallback />,
  },
);
const FileAssociationSetup = dynamic(
  () => import("../components/FileAssociationSetup"),
  {
    ssr: false,
    loading: () => <LoadingFallback />,
  },
);
const UserManual = dynamic(() => import("../components/UserManual"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});
const WelcomeGuide = dynamic(() => import("../components/WelcomeGuide"), {
  ssr: false,
  loading: () => <LoadingFallback />,
});
const BillFolderTracker = dynamic(
  () => import("../components/BillFolderTracker"),
  {
    ssr: false,
    loading: () => <LoadingFallback />,
  },
);
const FileRecoveryModal = dynamic(
  () => import("../components/FileRecoveryModal"),
  {
    ssr: false,
    loading: () => <LoadingFallback />,
  },
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [savedBills, setSavedBills] = useState([]);
  const [isItemsFullscreen, setIsItemsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileAssociationSetup, setShowFileAssociationSetup] =
    useState(false);
  const [showUserManual, setShowUserManual] = useState(false);
  const [showBillFolderTracker, setShowBillFolderTracker] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default
  const [isElectron, setIsElectron] = useState(false);
  const [pendingFileData, setPendingFileData] = useState(null);
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [isEditingExistingBill, setIsEditingExistingBill] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalBillData, setOriginalBillData] = useState(null);

  // Check if running in Electron
  useEffect(() => {
    const electron = typeof window !== "undefined" && !!window.electronAPI;
    setIsElectron(electron);
    if (electron) {
      document.body.classList.add("is-electron");
    } else {
      document.body.classList.remove("is-electron");
    }
  }, []);

  // Initialize file parser
  const fileParser = useFileParser({
    onLoadBillData: async (data, filePath, warnings) => {
      await handleLoadBillData(data, filePath, warnings);
    },
    onCloseFile: () => {
      setCurrentFilePath(null);
      setIsEditingExistingBill(false);
      setOriginalBillData(null);
      setHasUnsavedChanges(false);
    },
  });

  // Early listener registration for file associations to avoid race conditions
  // This runs immediately and buffers file data if it arrives before the component is ready
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      console.log("[File Association] Setting up early listeners...");

      // Set up listeners that will buffer events until the component is ready
      window.electronAPI.onOpenFile(({ data, filePath }) => {
        console.log("[File Association] File open event received:", {
          filePath,
          dataType: typeof data,
        });
        // Buffer the file data to be processed once the component is fully initialized
        setPendingFileData({ data, filePath });
      });

      window.electronAPI.onOpenFileError(({ error, filePath }) => {
        console.log("[File Association] File open error received:", {
          filePath,
          error,
        });
        const fileName = filePath
          ? filePath.split(/[\/]/).pop()
          : "Unknown file";
        toast.error(`Error opening ${fileName}: ${error}`, {
          duration: 5000,
        });
      });

      // New: Handle raw file content from main process
      window.electronAPI.onOpenFileRaw(async ({ filePath, content }) => {
        console.log("[File Association] Raw file content received:", {
          filePath,
          contentLength: content.length,
        });

        if (!initialized) {
          // Buffer until component is ready
          setPendingFileData({ filePath, content, isRaw: true });
        } else {
          // Parse immediately
          try {
            await fileParser.parseFileContent(filePath, content);
          } catch (error) {
            console.error("[File Association] Error parsing file:", error);
            toast.error(`Error parsing file: ${error.message}`, {
              duration: 5000,
            });
          }
        }
      });
    }
  }, [initialized, fileParser]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Check if user has seen tooltips before
  useEffect(() => {
    try {
      const hasSeenTooltips = localStorage.getItem("hasSeenTooltips");
      if (!hasSeenTooltips) {
        setShowTooltips(true);
        // Hide tooltips after 10 seconds
        setTimeout(() => {
          try {
            localStorage.setItem("hasSeenTooltips", "true");
          } catch (storageError) {
            console.error("Failed to save tooltips state:", storageError);
          }
          setShowTooltips(false);
        }, 10000);
      }
    } catch (storageError) {
      console.error("Failed to read tooltips state:", storageError);
      setShowTooltips(true); // Default to showing tooltips if localStorage fails
    }
  }, []);
  const toggleItemsFullscreen = useCallback(
    () => setIsItemsFullscreen((prev) => !prev),
    [],
  );
  // Function to generate initial bill number (memoized)
  const generateInitialBillNumber = useCallback(() => {
    // During SSR, return a default value
    if (typeof window === "undefined") {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      // If month is Jan-March, use previous year as start of financial year
      const fyStart = month <= 3 ? year - 1 : year;
      const fyEnd = fyStart + 1;
      // Create financial year string (e.g., "2526" for 2025-26)
      const fyString = `${fyStart.toString().slice(-2)}${fyEnd.toString().slice(-2)}`;
      return `PEIPLCH${fyString}/01`;
    }
    return getNextBillNumber();
  }, []);
  const [billData, setBillData] = useState({
    billNumber: generateInitialBillNumber(),
    date: new Date().toISOString().split("T")[0],
    customerName: "RASHTRIYA CHEMICALS & FERTILIZERS LTD",
    plantName: "AMMONIA V PLANT",
    customerAddress: "TROMBAY UNIT\nMUMBAI.400 074",
    customerPhone: "",
    customerGST: "27AAACR2831H1ZK",
    items: [
      {
        id: 1,
        description: "",
        sacHsn: "",
        quantity: 1,
        unit: "PCS",
        rate: 0,
        amount: 0,
        cgstRate: 9,
        cgstAmount: 0,
        sgstRate: 9,
        sgstAmount: 0,
        totalWithGST: 0,
        dates: [new Date().toISOString().split("T")[0]],
      },
    ],
  });
  const [companyInfo, setCompanyInfo] = useState({
    name: "PUJARI ENGINEERS INDIA (P) LTD.",
    services:
      "ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING • SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS",
    address:
      "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701.",
    phone: "9820027556",
    email: "spujari79@gmail.com",
    gst: "27AADCP2938G1ZD",
    pan: "AADCP2938G",
  });
  const [showBill, setShowBill] = useState(false);
  // Initialize setup immediately without splash screen delay
  useEffect(() => {
    if (!initialized) {
      // Load saved bills from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem("savedBills") || "[]");
        setSavedBills(saved);
      } catch (err) {
        console.error("Failed to load saved bills:", err);
        setSavedBills([]);
      }
      // Load company info from localStorage
      try {
        const savedCompanyInfo = JSON.parse(
          localStorage.getItem("companyInfo") || "null",
        );
        if (savedCompanyInfo) {
          setCompanyInfo(savedCompanyInfo);
        }
      } catch (err) {
        console.error("Failed to load company info:", err);
      }
      // Set up event listener for credential manager
      const handleOpenCredentialManager = () => {
        setShowCredentialManager(true);
      };
      document.addEventListener(
        "openCredentialManager",
        handleOpenCredentialManager,
      );
      // Add drag and drop functionality for JSON files
      const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
      };
      const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      };
      const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
          setIsDragOver(false);
        }
      };
      const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const billFiles = files.filter(
          (file) =>
            file.type === "application/json" ||
            file.name.endsWith(".json") ||
            file.name.endsWith(".peiplbill"),
        );
        if (billFiles.length > 0) {
          const file = billFiles[0];
          try {
            toast.loading("Loading file...", { id: "file-loading" });
            const text = await file.text();
            const data = JSON.parse(text);
            await handleLoadBillData(data, file.name);
            toast.success("File loaded successfully!", { id: "file-loading" });
          } catch (error) {
            console.error("Error reading dropped file:", error);
            toast.error(
              "Error reading file. Please ensure it's a valid JSON or .peiplbill file.",
              { id: "file-loading" },
            );
          }
        } else {
          toast.error("Please drop a valid JSON or .peiplbill file.");
        }
      };
      document.addEventListener("dragover", handleDragOver);
      document.addEventListener("dragenter", handleDragEnter);
      document.addEventListener("dragleave", handleDragLeave);
      document.addEventListener("drop", handleDrop);
      // Auto-save the RCF Chembur preset after component mounts
      const saveRCFPreset = () => {
        const rcfBillData = {
          billNumber:
            "RCF-" +
            new Date().getFullYear() +
            "-" +
            String(new Date().getMonth() + 1).padStart(2, "0"),
          date: new Date().toISOString().split("T")[0],
          customerName: "RASHTRIYA CHEMICALS & FERTILIZERS LTD",
          plantName: "AMMONIA V PLANT",
          customerAddress: "TROMBAY UNIT\nMUMBAI.400 074",
          customerPhone: "",
          customerGST: "27AAACR2831H1ZK",
          items: [
            {
              id: 1,
              description: "",
              sacHsn: "",
              quantity: 1,
              unit: "PCS",
              rate: 0,
              cgstRate: 9,
              cgstAmount: 0,
              sgstRate: 9,
              sgstAmount: 0,
              totalWithGST: 0,
              dates: [new Date().toISOString().split("T")[0]],
            },
          ],
        };
        let savedBills = [];
        try {
          const savedBillsData = localStorage.getItem("savedBills");
          if (savedBillsData) {
            savedBills = JSON.parse(savedBillsData);
            if (!Array.isArray(savedBills)) {
              savedBills = [];
            }
          }
        } catch (parseError) {
          console.error("Error parsing savedBills for RCF preset:", parseError);
          savedBills = [];
        }
        const rcfPreset = {
          ...rcfBillData,
          companyInfo: {
            name: "PUJARI ENGINEERS INDIA (P) LTD.",
            services:
              "ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING • SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS",
            address:
              "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701.",
            phone: "9820027556",
            email: "spujari79@gmail.com",
            gst: "27AADCP2938G1ZD",
            pan: "AADCP2938G",
          },
          savedBy: "System",
          savedAt: new Date().toISOString(),
          billName: "rcf chembur",
          total: 0,
        };
        const existingIndex = savedBills.findIndex(
          (bill) => bill.billName === "rcf chembur",
        );
        if (existingIndex >= 0) {
          savedBills[existingIndex] = rcfPreset;
        } else {
          savedBills.push(rcfPreset);
        }
        try {
          localStorage.setItem("savedBills", JSON.stringify(savedBills));
          setSavedBills(savedBills);
        } catch (storageError) {
          console.error("Failed to save RCF preset:", storageError);
        }
      };
      saveRCFPreset();
      // Desktop app file operation handlers
      if (window.electronAPI) {
        window.electronAPI.onOpenBillFile(() => {
          handleOpenBillFile();
        });
        window.electronAPI.onSaveBillFile(() => {
          handleSaveBillFile();
        });
        // Note: onOpenFile listeners are now set up earlier to avoid race conditions
        // See the early listener registration effect above
      }
      setInitialized(true);
      return () => {
        document.removeEventListener(
          "openCredentialManager",
          handleOpenCredentialManager,
        );
        document.removeEventListener("dragover", handleDragOver);
        document.removeEventListener("dragenter", handleDragEnter);
        document.removeEventListener("dragleave", handleDragLeave);
        document.removeEventListener("drop", handleDrop);
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners("open-bill-file");
          window.electronAPI.removeAllListeners("save-bill-file");
          window.electronAPI.removeAllListeners("open-file");
          window.electronAPI.removeAllListeners("open-file-error");
        }
      };
    }
  }, [initialized]);

  // Process pending file data once the component is fully initialized
  // This handles the case where file association event fires before listeners are registered
  useEffect(() => {
    if (pendingFileData && initialized) {
      console.log("[File Association] Processing pending file data...", {
        filePath: pendingFileData.filePath,
        isRaw: pendingFileData.isRaw,
      });

      const processPendingFile = async () => {
        try {
          if (pendingFileData.isRaw) {
            // Handle raw file content (new approach)
            await fileParser.parseFileContent(
              pendingFileData.filePath,
              pendingFileData.content,
            );
          } else {
            // Handle parsed data (legacy approach)
            const bill =
              typeof pendingFileData.data === "string"
                ? JSON.parse(pendingFileData.data)
                : pendingFileData.data;

            await handleLoadBillData(
              bill,
              pendingFileData.filePath,
              pendingFileData.warnings,
            );
          }
        } catch (err) {
          console.error("Error loading pending file:", err);
          toast.error(`Error loading bill: ${err.message}`, {
            duration: 5000,
          });
        }
      };

      processPendingFile();

      // Clear pending data
      setPendingFileData(null);
    }
  }, [pendingFileData, initialized, fileParser]);

  // Enhanced bill data loading function
  const handleLoadBillData = async (data, filePath) => {
    try {
      // Validate that this is a bill file
      if (!data || typeof data !== "object") {
        throw new Error(
          "Invalid file format. Please select a valid bill JSON file.",
        );
      }

      // Check if it's a bill format preset
      if (data.billData && data.name && data.savedAt) {
        // This is a bill format preset
        toast.info("Loading bill format preset...");
        if (data.billData.billData) {
          setBillData(data.billData.billData);
        } else {
          setBillData(data.billData);
        }
        if (data.billData.companyInfo) {
          setCompanyInfo(data.billData.companyInfo);
        }
        toast.success(`Bill format preset "${data.name}" loaded successfully!`);
        return;
      }

      // Check if it's a saved bill with billData wrapper
      if (data.billData) {
        setBillData(data.billData);
      } else {
        // Direct bill data
        setBillData(data);
      }

      // Load company info if available
      if (data.companyInfo) {
        setCompanyInfo(data.companyInfo);
      }

      // Validate essential bill fields
      const billToValidate = data.billData || data;
      if (!billToValidate.items || !Array.isArray(billToValidate.items)) {
        console.warn(
          "Loaded file doesn't contain bill items. Starting with empty bill.",
        );
        setBillData((prev) => ({
          ...prev,
          items: [
            {
              id: 1,
              description: "",
              sacHsn: "",
              quantity: 1,
              unit: "PCS",
              rate: 0,
              amount: 0,
              cgstRate: 9,
              cgstAmount: 0,
              sgstRate: 9,
              sgstAmount: 0,
              totalWithGST: 0,
              dates: [new Date().toISOString().split("T")[0]],
            },
          ],
        }));
      }

      // Set current file path and editing status
      if (filePath) {
        setCurrentFilePath(filePath);
        setIsEditingExistingBill(true);
        // Set original data to track changes
        const billToTrack = data.billData || data;
        setOriginalBillData(JSON.stringify(billToTrack));
        setHasUnsavedChanges(false);
      }

      const fileName = filePath.split(/[\\/]/).pop();
      toast.success(`Bill loaded successfully: ${fileName}`, {
        duration: 3000,
      });
    } catch (error) {
      console.error("Error loading bill data:", error);
      toast.error(`Error loading bill data: ${error.message}`);
    }
  };

  // Desktop file operation handlers
  const handleOpenBillFile = async () => {
    if (!window.electronAPI) {
      // Web-based file opening
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.peiplbill";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            await handleLoadBillData(data, file.name);
          } catch (error) {
            console.error("Error reading file:", error);
            toast.error(
              "Error reading file. Please ensure it's a valid JSON file.",
            );
          }
        }
      };
      input.click();
      return;
    }

    try {
      const result = await window.electronAPI.openFile();
      if (result.success) {
        await handleLoadBillData(result.data, result.filePath);
      } else {
        toast.error(`Error loading bill: ${result.error}`);
      }
    } catch (error) {
      console.error("Error opening bill file:", error);
      toast.error("Error opening bill file. Please try again.");
    }
  };

  // Memoized calculation functions for desktop handlers
  const calculateSubtotalMemo = useMemo(() => {
    return calculateSubtotal(billData.items);
  }, [billData.items]);

  const calculateTotalCGSTMemo = useMemo(() => {
    return calculateTotalCGST(billData.items);
  }, [billData.items]);

  const calculateTotalSGSTMemo = useMemo(() => {
    return calculateTotalSGST(billData.items);
  }, [billData.items]);

  const calculateTotalMemo = useMemo(() => {
    return calculateTotal(billData.items);
  }, [billData.items]);

  const handleNewBill = useCallback(() => {
    // Reset editing state for new bills
    setCurrentFilePath(null);
    setIsEditingExistingBill(false);
    setHasUnsavedChanges(false);
    setOriginalBillData(null);

    // Reset bill data to initial state
    const newBillData = {
      billNumber: generateInitialBillNumber(),
      date: new Date().toISOString().split("T")[0],
      customerName: "RASHTRIYA CHEMICALS & FERTILIZERS LTD",
      plantName: "AMMONIA V PLANT",
      customerAddress: "TROMBAY UNIT\nMUMBAI.400 074",
      customerPhone: "",
      customerGST: "27AAACR2831H1ZK",
      items: [
        {
          id: 1,
          description: "",
          sacHsn: "",
          quantity: 1,
          unit: "PCS",
          rate: 0,
          amount: 0,
          cgstRate: 9,
          cgstAmount: 0,
          sgstRate: 9,
          sgstAmount: 0,
          totalWithGST: 0,
          dates: [new Date().toISOString().split("T")[0]],
        },
      ],
    };

    setBillData(newBillData);
    setOriginalBillData(JSON.stringify(newBillData));

    toast.success("New bill created successfully!");
  }, [generateInitialBillNumber]);

  // Detect unsaved changes
  useEffect(() => {
    if (originalBillData) {
      const currentDataString = JSON.stringify(billData);
      setHasUnsavedChanges(currentDataString !== originalBillData);
    }
  }, [billData, originalBillData]);

  // Handle unsaved changes before navigation
  const handleUnsavedChanges = useCallback(
    (callback) => {
      if (hasUnsavedChanges) {
        if (
          window.confirm(
            "You have unsaved changes. Do you want to save them before continuing?",
          )
        ) {
          handleSaveBillFile().then(() => {
            if (callback) callback();
          });
        } else {
          if (callback) callback();
        }
      } else {
        if (callback) callback();
      }
    },
    [hasUnsavedChanges],
  );

  const handleSaveBillFile = useCallback(async () => {
    // Prevent duplicate submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // Only save raw bill data and company info, not calculated totals
      const { subtotal, totalCGST, totalSGST, total, ...rawBillData } =
        billData;
      const completeBillData = {
        ...rawBillData,
        companyInfo: companyInfo || {},
        savedAt: new Date().toISOString(),
        version: "2.5.0", // Add version tracking
        itemCount: billData?.items?.length || 0,
      };

      if (window.electronAPI) {
        // Desktop app - handle update vs new save
        let result;

        if (isEditingExistingBill && currentFilePath) {
          // Update existing file directly
          result = await window.electronAPI.updateExistingFile(
            completeBillData,
            currentFilePath,
          );
        } else {
          // Save new file
          result = await window.electronAPI.saveFile(completeBillData);
        }

        if (result.success) {
          if (result.updated) {
            toast.success("Bill updated successfully!");
          } else {
            toast.success(
              `Bill saved successfully to: ${result.fileName || result.filePath}`,
            );
            // Update current file path for future edits
            setCurrentFilePath(result.filePath);
            setIsEditingExistingBill(true);
          }

          // Update original data to mark as saved
          setOriginalBillData(JSON.stringify(billData));
          setHasUnsavedChanges(false);

          // Increment bill number counter for next bill
          incrementBillNumberCounter(billData.billNumber);

          // Update window title with saved file name
          if (result.fileName) {
            document.title = `PEIPL Bill Manager - ${result.fileName}`;
          }
        } else {
          toast.error(`Error saving bill: ${result.error}`);
        }
      } else {
        // Web browser - use download (always new file)
        try {
          const blob = new Blob([JSON.stringify(completeBillData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = generateDefaultFileName(billData);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success("Bill downloaded successfully!");

          // Update original data to mark as saved
          setOriginalBillData(JSON.stringify(billData));
          setHasUnsavedChanges(false);

          // Increment bill number counter for next bill
          incrementBillNumberCounter(billData.billNumber);
        } catch (downloadError) {
          console.error("Download error:", downloadError);
          toast.error("Failed to download bill. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error saving bill file:", error);
      toast.error(
        `Error saving bill file: ${error.message || "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    billData,
    companyInfo,
    isLoading,
    isEditingExistingBill,
    currentFilePath,
    generateDefaultFileName,
    incrementBillNumberCounter,
    setIsLoading,
    setOriginalBillData,
    setHasUnsavedChanges,
    setCurrentFilePath,
  ]);

  const handleQuickSave = useCallback(() => {
    handleSaveBillFile();
  }, [handleSaveBillFile]);

  // Keyboard shortcuts (added after function definitions to avoid circular dependencies)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in input fields or contenteditable areas
      const activeElement = document.activeElement;
      const isInputElement =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true" ||
          activeElement.closest('[contenteditable="true"]'));

      // Also check if we're in a modal or dialog
      const isInModal =
        activeElement &&
        (activeElement.closest(".modal") ||
          activeElement.closest('[role="dialog"]') ||
          activeElement.closest(".fixed"));

      if (isInputElement || isInModal) return; // Don't interfere with typing

      // Only handle modifier key combinations
      if (!event.ctrlKey && !event.metaKey && !event.altKey) return;

      // Ctrl+S: Save bill
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSaveBillFile();
      }
      // Ctrl+N: New bill (with unsaved changes check)
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault();
        handleUnsavedChanges(() => handleNewBill());
      }
      // Ctrl+O: Open bill (with unsaved changes check)
      if ((event.ctrlKey || event.metaKey) && event.key === "o") {
        event.preventDefault();
        handleUnsavedChanges(() => handleOpenBillFile());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleSaveBillFile,
    handleNewBill,
    handleOpenBillFile,
    handleUnsavedChanges,
  ]);

  // Listen for save bill requests from other components
  useEffect(() => {
    const handleSaveRequest = (event) => {
      handleSaveBillFile();
    };

    window.addEventListener("save-bill-request", handleSaveRequest);
    return () => {
      window.removeEventListener("save-bill-request", handleSaveRequest);
    };
  }, [handleSaveBillFile]);

  // Persist company info on change
  useEffect(() => {
    try {
      localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    } catch {}
  }, [companyInfo]);

  const generateBill = useCallback(async () => {
    // Remove validation checks - allow generating with any data
    setIsLoading(true);
    try {
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowBill(true);
      toast.success("Bill generated successfully!", {
        icon: "",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Error generating bill. Please try again.", {
        icon: "",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQuickGenerate = useCallback(() => {
    generateBill();
  }, [generateBill]);

  const closeBill = useCallback(() => {
    setShowBill(false);
  }, []);

  const handleSaveBill = useCallback((savedBill) => {
    try {
      // Only save raw bill data, not calculated totals
      const { subtotal, totalCGST, totalSGST, total, ...rawBill } = savedBill;
      setSavedBills((prev) => {
        const updated = [...prev, rawBill];
        // Keep only last 50 saved bills to prevent localStorage overflow
        return updated.slice(-50);
      });
      toast.success("Bill saved successfully!");
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error("Error saving bill. Please try again.");
    }
  }, []);

  const handleSaveBillFromGenerator = useCallback((billDataToSave) => {
    try {
      // Open credential manager to save the bill
      setShowCredentialManager(true);
      // Store the bill data temporarily for the credential manager
      localStorage.setItem("tempBillData", JSON.stringify(billDataToSave));
    } catch (error) {
      console.error("Error preparing bill for save:", error);
      toast.error("Error preparing bill for save. Please try again.");
    }
  }, []);
  return (
    <div className="min-h-screen bg-bg relative">
      {/* Custom Title Bar (Electron only) */}
      {isElectron && (
        <CustomTitleBar
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          onGenerateBill={generateBill}
          onOpenBill={handleOpenBillFile}
          onSaveBill={handleSaveBillFile}
          onShowUserManual={() => setShowUserManual(true)}
          onShowBillFolderTracker={() => setShowBillFolderTracker(true)}
          onShowFileAssociationSetup={() => setShowFileAssociationSetup(true)}
          isLoading={isLoading}
          showTooltips={showTooltips}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}

      <Header
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        onQuickSave={handleQuickSave}
        onQuickGenerate={handleQuickGenerate}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <main className="section-container">
        {isLoading
          ? <div className="flex items-center justify-center min-h-[60vh]">
              <LoadingSpinner
                size="xl"
                text="Preparing your bill..."
                color="blue"
              />
            </div>
          : <div className="space-y-6">
              <div
                className={`grid-dashboard relative ${!sidebarOpen ? "sidebar-collapsed" : ""}`}
              >
                {/* Mobile Sidebar Backdrop */}
                {sidebarOpen && (
                  <div
                    className="sidebar-backdrop lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}

                {/* Sidebar / Left Column */}
                <div
                  className={`dashboard-sidebar space-y-6 ${!sidebarOpen ? "collapsed" : ""}`}
                >
                  {/* Business Profile */}
                  <section className="card card-accent">
                    <div className="card-header">
                      <h2 className="card-title flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        Business Profile
                      </h2>
                    </div>
                    <CompanyInfo
                      billData={billData}
                      setBillData={setBillData}
                      companyInfo={companyInfo}
                      setCompanyInfo={setCompanyInfo}
                    />
                  </section>

                  {/* Customer & Bill Details */}
                  <section className="card">
                    <div className="card-header">
                      <h2 className="card-title flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-secondary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Customer Details
                      </h2>
                    </div>
                    <CustomerInfo
                      billData={billData}
                      setBillData={setBillData}
                    />
                  </section>
                </div>

                {/* Main Content / Right Column */}
                <div className="dashboard-content space-y-6">
                  {/* Items Table Section - Now inside dashboard content to move with it */}
                  <section className="card min-h-[500px] flex flex-col border-2 border-primary/20">
                    <div className="card-header border-none pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="card-title text-xl">Bill Items</h2>
                          <p className="text-xs text-text-muted font-normal">
                            {billData?.items?.length || 0} item
                            {billData?.items?.length !== 1 ? "s" : ""} added
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={toggleItemsFullscreen}
                          className="btn-icon btn-sm"
                          title={
                            isItemsFullscreen
                              ? "Exit Fullscreen"
                              : "Fullscreen View"
                          }
                        >
                          {isItemsFullscreen
                            ? <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            : <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                />
                              </svg>}
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ItemsTable
                        billData={billData}
                        setBillData={setBillData}
                        compact
                        toggleFullscreen={toggleItemsFullscreen}
                        isFullscreen={isItemsFullscreen}
                      />
                    </div>
                  </section>

                  {/* Summary & Actions Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="card bg-bg-alt/30 border border-primary/20 hover:border-primary/40 transition-all">
                      <div className="card-header border-none mb-2">
                        <h2 className="card-title flex items-center gap-2 text-base">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01m-6 0h.01"
                            />
                          </svg>
                          Payment Summary
                        </h2>
                      </div>
                      <Totals billData={billData} />
                    </section>

                    <section className="card bg-gradient-to-br from-primary to-primary-dark text-inverse shadow-lg hover:shadow-xl transition-all">
                      <div className="card-header border-white/10">
                        <h2 className="card-title text-inverse flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Finalize Bill
                        </h2>
                      </div>
                      <div className="p-2 space-y-4">
                        <p className="text-sm opacity-90">
                          Review all details carefully. Once generated, you can
                          save the bill as a PDF for your records.
                        </p>
                        <button
                          onClick={generateBill}
                          className="btn w-full bg-white text-primary hover:bg-white/90 font-bold py-3 shadow-md hover:shadow-lg transition-all"
                        >
                          Generate Bill PDF
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* Utility Actions */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => setShowUserManual(true)}
                      className="btn-outline btn-sm flex items-center gap-1.5"
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
                          strokeWidth={1.5}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span>User Manual</span>
                    </button>
                    {isElectron && (
                      <>
                        <button
                          onClick={() => setShowBillFolderTracker(true)}
                          className="btn-outline btn-sm flex items-center gap-1.5"
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
                              strokeWidth={1.5}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          <span>Tracker</span>
                        </button>
                        <button
                          onClick={() => setShowFileAssociationSetup(true)}
                          className="btn-outline btn-sm flex items-center gap-1.5"
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
                              strokeWidth={1.5}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <span>Setup</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>}
        {/* Bill Generator Modal */}
        <Suspense
          fallback={<LoadingSpinner text="Loading Bill Generator..." />}
        >
          {showBill && (
            <BillGenerator
              billData={billData}
              companyInfo={companyInfo}
              isVisible={showBill}
              onClose={closeBill}
              onEdit={() => {
                setShowBill(false);
              }}
              onSave={handleSaveBillFromGenerator}
            />
          )}
        </Suspense>
        {/* Credential Manager Modal */}
        <Suspense
          fallback={<LoadingSpinner text="Loading Credential Manager..." />}
        >
          <CredentialManager
            isVisible={showCredentialManager}
            onClose={() => setShowCredentialManager(false)}
            onSave={handleSaveBill}
            billData={billData}
            companyInfo={companyInfo}
          />
        </Suspense>
        {/* File Association Setup Modal */}
        <Suspense
          fallback={<LoadingSpinner text="Loading File Association Setup..." />}
        >
          <FileAssociationSetup
            isVisible={showFileAssociationSetup}
            onClose={() => setShowFileAssociationSetup(false)}
          />
        </Suspense>
        {/* User Manual Modal */}
        <Suspense fallback={<LoadingSpinner text="Loading User Manual..." />}>
          <UserManual
            isVisible={showUserManual}
            onClose={() => setShowUserManual(false)}
          />
        </Suspense>
        {/* Bill Folder Tracker Modal */}
        <Suspense
          fallback={<LoadingSpinner text="Loading Bill Folder Tracker..." />}
        >
          <BillFolderTracker
            isVisible={showBillFolderTracker}
            onClose={() => setShowBillFolderTracker(false)}
          />
        </Suspense>
        {/* Welcome Guide for First-Time Users */}
        <Suspense fallback={null}>
          <WelcomeGuide />
        </Suspense>
        {/* AI Assistant */}
        <Suspense fallback={null}>
          <AIAssistant
            onSaveBill={handleSaveBillFile}
            onOpenBill={handleOpenBillFile}
            onGenerateBill={generateBill}
            onShowUserManual={() => setShowUserManual(true)}
            billData={billData}
            companyInfo={companyInfo}
            pdfPath={billData?.pdfPath}
          />
        </Suspense>
        {/* File Recovery Modal */}
        <Suspense
          fallback={<LoadingSpinner text="Loading Recovery Interface..." />}
        >
          <FileRecoveryModal
            isVisible={fileParser.isRecoveryMode}
            onAccept={fileParser.acceptRecoveredData}
            onReject={fileParser.rejectRecoveredData}
            corruptedData={fileParser.corruptedData}
            recoveredData={fileParser.recoveredData}
            filePath={fileParser.currentFilePath}
          />
        </Suspense>
      </main>
    </div>
  );
}
