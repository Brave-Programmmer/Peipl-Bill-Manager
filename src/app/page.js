"use client";

import { useState, useEffect, Suspense, memo } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "../components/SplashScreen";
const Header = memo(require("../components/Header").default);
const CompanyInfo = memo(require("../components/CompanyInfo").default);
const ItemsTable = memo(require("../components/ItemsTable").default);
const Totals = memo(require("../components/Totals").default);
const LoadingSpinner = memo(require("../components/LoadingSpinner").default);

// Lazy load heavy modals/components with Suspense fallback
const BillGenerator = dynamic(() => import("../components/BillGenerator"), { ssr: false });
const CredentialManager = dynamic(() => import("../components/CredentialManager"), { ssr: false });
const FileAssociationSetup = dynamic(() => import("../components/FileAssociationSetup"), { ssr: false });
import toast from "react-hot-toast";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [savedBills, setSavedBills] = useState([]);
  const [isItemsFullscreen, setIsItemsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileAssociationSetup, setShowFileAssociationSetup] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const toggleItemsFullscreen = () => setIsItemsFullscreen((prev) => !prev);
  // Function to generate initial bill number
  const generateInitialBillNumber = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    // If month is Jan-March, use previous year as start of financial year
    const fyStart = month <= 3 ? year - 1 : year;
    const fyEnd = fyStart + 1;
    // Create financial year string (e.g., "2526" for 2025-26)
    const fyString = `${fyStart.toString().slice(-2)}${fyEnd
      .toString()
      .slice(-2)}`;
    return `PEIPLCH${fyString}/01`;
  };
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
  // Defer heavy setup until splash screen is complete
  useEffect(() => {
    if (!showSplash && !initialized) {
      // Load saved bills from localStorage
      const saved = JSON.parse(localStorage.getItem("savedBills") || "[]");
      setSavedBills(saved);
      // Load company info from localStorage
      const savedCompanyInfo = JSON.parse(localStorage.getItem("companyInfo") || "null");
      if (savedCompanyInfo) {
        setCompanyInfo(savedCompanyInfo);
      }
      // Set up event listener for credential manager
      const handleOpenCredentialManager = () => {
        setShowCredentialManager(true);
      };
      document.addEventListener("openCredentialManager", handleOpenCredentialManager);
      // Add drag and drop functionality for JSON files
      const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
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
        const jsonFiles = files.filter(file => file.type === 'application/json' || file.name.endsWith('.json'));
        if (jsonFiles.length > 0) {
          const file = jsonFiles[0];
          try {
            toast.loading("Loading file...", { id: "file-loading" });
            const text = await file.text();
            const data = JSON.parse(text);
            await handleLoadBillData(data, file.name);
            toast.success("File loaded successfully!", { id: "file-loading" });
          } catch (error) {
            console.error("Error reading dropped file:", error);
            toast.error("Error reading file. Please ensure it's a valid JSON file.", { id: "file-loading" });
          }
        } else {
          toast.error("Please drop a valid JSON file.");
        }
      };
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragenter', handleDragEnter);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('drop', handleDrop);
      // Auto-save the RCF Chembur preset after component mounts
      const saveRCFPreset = () => {
        const rcfBillData = {
          billNumber:
            "RCF-" + new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0"),
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
        const savedBills = JSON.parse(localStorage.getItem("savedBills") || "[]");
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
        const existingIndex = savedBills.findIndex((bill) => bill.billName === "rcf chembur");
        if (existingIndex >= 0) {
          savedBills[existingIndex] = rcfPreset;
        } else {
          savedBills.push(rcfPreset);
        }
        localStorage.setItem("savedBills", JSON.stringify(savedBills));
        setSavedBills(savedBills);
      };
      saveRCFPreset();
      // Desktop app file operation handlers
      if (window.electronAPI) {
        window.electronAPI.onOpenBillFile(() => { handleOpenBillFile(); });
        window.electronAPI.onSaveBillFile(() => { handleSaveBillFile(); });
        // Listen for file association open events
        window.electronAPI.onOpenFile(({ data, filePath }) => {
          try {
            const bill = JSON.parse(data);
            handleLoadBillData(bill, filePath);
            toast.success(`Bill loaded from file association: ${filePath}`);
          } catch (err) {
            toast.error('Invalid JSON file from file association.');
          }
        });
        window.electronAPI.onOpenFileError(({ error, filePath }) => {
          toast.error(`Error opening file: ${error}`);
        });
      }
      setInitialized(true);
      return () => {
        document.removeEventListener("openCredentialManager", handleOpenCredentialManager);
        document.removeEventListener('dragover', handleDragOver);
        document.removeEventListener('dragenter', handleDragEnter);
        document.removeEventListener('dragleave', handleDragLeave);
        document.removeEventListener('drop', handleDrop);
        if (window.electronAPI) {
          window.electronAPI.removeAllListeners("open-bill-file");
          window.electronAPI.removeAllListeners("save-bill-file");
          window.electronAPI.removeAllListeners("open-file");
          window.electronAPI.removeAllListeners("open-file-error");
        }
      };
    }
  }, [showSplash, initialized]);

  // Enhanced bill data loading function
  const handleLoadBillData = async (data, filePath) => {
    try {
      // Validate that this is a bill file
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid file format. Please select a valid bill JSON file.");
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
        toast.warning("Loaded file doesn't contain bill items. Starting with empty bill.");
        setBillData(prev => ({
          ...prev,
          items: [{
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
          }]
        }));
      }

      toast.success(`Bill loaded successfully from: ${filePath}`);
    } catch (error) {
      console.error("Error loading bill data:", error);
      toast.error(`Error loading bill data: ${error.message}`);
    }
  };

  // Desktop file operation handlers
  const handleOpenBillFile = async () => {
    if (!window.electronAPI) {
      // Web-based file opening
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            await handleLoadBillData(data, file.name);
          } catch (error) {
            console.error("Error reading file:", error);
            toast.error("Error reading file. Please ensure it's a valid JSON file.");
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

  // Calculation functions for desktop handlers
  const calculateSubtotal = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  };

  const calculateTotalCGST = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const cgstAmount = parseFloat(item.cgstAmount) || 0;
      return sum + cgstAmount;
    }, 0);
  };

  const calculateTotalSGST = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      return sum + sgstAmount;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalCGST() + calculateTotalSGST();
  };

  const handleSaveBillFile = async () => {
    try {
      // Only save raw bill data and company info, not calculated totals
      const { subtotal, totalCGST, totalSGST, total, ...rawBillData } = billData;
      const completeBillData = {
        ...rawBillData,
        companyInfo,
        savedAt: new Date().toISOString(),
      };

      if (window.electronAPI) {
        // Desktop app - use native file dialog
        const result = await window.electronAPI.saveFile(completeBillData);
        if (result.success) {
          toast.success(`Bill saved successfully to: ${result.filePath}`);
        } else {
          toast.error(`Error saving bill: ${result.error}`);
        }
      } else {
        // Web browser - use download
        const blob = new Blob([JSON.stringify(completeBillData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bill_${billData.billNumber || "invoice"}_${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Bill downloaded successfully!");
      }
    } catch (error) {
      console.error("Error saving bill file:", error);
      toast.error("Error saving bill file. Please try again.");
    }
  };

  // Persist company info on change
  useEffect(() => {
    try {
      localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    } catch {}
  }, [companyInfo]);

  const generateBill = async () => {
    // Enhanced validation
    const errors = [];

    if (!billData.billNumber.trim()) {
      errors.push("Please enter a Bill Number");
    }
    if (!billData.customerName.trim()) {
      errors.push("Please enter Customer Name");
    }
    if (!billData.customerAddress.trim()) {
      errors.push("Please enter Customer Address");
    }
    if (!billData.customerGST.trim()) {
      errors.push("Please enter Customer GST Number");
    }
    // Validate items
    if (billData.items.length === 0) {
      errors.push("Please add at least one item");
    } else {
      billData.items.forEach((item, index) => {
        if (!item.description.trim()) {
          errors.push(`Item ${index + 1}: Description is required`);
        }
        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (item.rate < 0) {
          errors.push(`Item ${index + 1}: Rate cannot be negative`);
        }
        if (item.cgstRate < 0 || item.cgstRate > 100) {
          errors.push(`Item ${index + 1}: CGST Rate must be between 0 and 100`);
        }
        if (item.sgstRate < 0 || item.sgstRate > 100) {
          errors.push(`Item ${index + 1}: SGST Rate must be between 0 and 100`);
        }
      });
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err)); // ✅ Show each error as a toast
      return;
    }

    setIsLoading(true);
    try {
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowBill(true);
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Error generating bill. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeBill = () => {
    setShowBill(false);
  };

  const handleSaveBill = (savedBill) => {
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
  };

  const handleSaveBillFromGenerator = (billDataToSave) => {
    try {
      // Open credential manager to save the bill
      setShowCredentialManager(true);
      // Store the bill data temporarily for the credential manager
      localStorage.setItem("tempBillData", JSON.stringify(billDataToSave));
    } catch (error) {
      console.error("Error preparing bill for save:", error);
      toast.error("Error preparing bill for save. Please try again.");
    }
  };
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-dashed border-blue-400 p-12 text-center max-w-md mx-4">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Drop JSON File Here</h3>
            <p className="text-gray-600">Release to load your bill data</p>
          </div>
        </div>
      )}
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <LoadingSpinner size="lg" text="Generating Bill..." color="blue" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Company Information Section */}
            <section className="bg-white shadow-xl border border-gray-200">
              <CompanyInfo
                billData={billData}
                setBillData={setBillData}
                companyInfo={companyInfo}
                setCompanyInfo={setCompanyInfo}
              />
            </section>
            {/* Items Table Section */}
            <section className="bg-white shadow-xl border border-gray-200">
              <ItemsTable
                billData={billData}
                setBillData={setBillData}
                compact
                toggleFullscreen={toggleItemsFullscreen}
                isFullscreen={isItemsFullscreen}
              />
            </section>
            {/* Totals Section */}
            <section className="bg-white shadow-xl border border-gray-200">
              <Totals billData={billData} />
            </section>
            {/* Generate Bill Button */}
            <section className="flex justify-center">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={generateBill}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white px-16 py-6 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 transition-all duration-300 font-bold text-2xl shadow-2xl hover:shadow-3xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center space-x-4 group"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" text="" color="white" />
                  ) : (
                    <>
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">📄</span>
                      <span>Generate Professional Bill</span>
                      <span className="text-xl group-hover:scale-110 transition-transform duration-300">→</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenBillFile}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-6 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center space-x-4 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📂</span>
                  <span>Open Bill</span>
                </button>
                <button
                  onClick={handleSaveBillFile}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-6 hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center space-x-4 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">💾</span>
                  <span>Save Bill</span>
                </button>
                {window.electronAPI && (
                  <button
                    onClick={() => setShowFileAssociationSetup(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center space-x-4 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🔗</span>
                    <span>Setup File Associations</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
        {/* Bill Generator Modal */}
        <Suspense fallback={<LoadingSpinner text="Loading Bill Generator..." />}>
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
        <Suspense fallback={<LoadingSpinner text="Loading Credential Manager..." />}>
          <CredentialManager
            isVisible={showCredentialManager}
            onClose={() => setShowCredentialManager(false)}
            onSave={handleSaveBill}
            billData={billData}
            companyInfo={companyInfo}
          />
        </Suspense>
        {/* File Association Setup Modal */}
        <Suspense fallback={<LoadingSpinner text="Loading File Association Setup..." />}>
          <FileAssociationSetup
            isVisible={showFileAssociationSetup}
            onClose={() => setShowFileAssociationSetup(false)}
          />
        </Suspense>
      </main>
    </div>
  );
}
