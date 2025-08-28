"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import CompanyInfo from "../components/CompanyInfo";
import CustomerInfo from "../components/CustomerInfo";
import ItemsTable from "../components/ItemsTable";
import Totals from "../components/Totals";
import BillGenerator from "../components/BillGenerator";
import SplashScreen from "../components/SplashScreen";
import LoadingSpinner from "../components/LoadingSpinner";
import CredentialManager from "../components/CredentialManager";
import toast from "react-hot-toast";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialManager, setShowCredentialManager] = useState(false);
  const [savedBills, setSavedBills] = useState([]);
  const [isItemsFullscreen, setIsItemsFullscreen] = useState(false);

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
    const fyString = `${fyStart.toString().slice(-2)}${fyEnd.toString().slice(-2)}`;
    
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

  useEffect(() => {
    // Load saved bills from localStorage
    const saved = JSON.parse(localStorage.getItem("savedBills") || "[]");
    setSavedBills(saved);

    // Load company info from localStorage
    const savedCompanyInfo = JSON.parse(
      localStorage.getItem("companyInfo") || "null"
    );
    if (savedCompanyInfo) {
      setCompanyInfo(savedCompanyInfo);
    }

    // Set up event listener for credential manager
    const handleOpenCredentialManager = () => {
      setShowCredentialManager(true);
    };

    document.addEventListener(
      "openCredentialManager",
      handleOpenCredentialManager
    );

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

      // Save to localStorage with preset name
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

      // Check if preset already exists
      const existingIndex = savedBills.findIndex(
        (bill) => bill.billName === "rcf chembur"
      );
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
      // Handle open file from menu
      window.electronAPI.onOpenBillFile(() => {
        handleOpenBillFile();
      });

      // Handle save file from menu
      window.electronAPI.onSaveBillFile(() => {
        handleSaveBillFile();
      });

      // Handle open file from command line
      window.electronAPI.onOpenFileFromCommand(async (event, filePath) => {
        try {
          const result = await window.electronAPI.openFileFromCommand(filePath);
          if (result.success) {
            await handleLoadBillData(result.data, result.filePath);
          } else {
            toast.error(`Error loading file: ${result.error}`);
          }
        } catch (error) {
          console.error("Error opening file from command:", error);
          toast.error("Error opening file from command line.");
        }
      });
    }

    return () => {
      document.removeEventListener(
        "openCredentialManager",
        handleOpenCredentialManager
      );

      // Clean up desktop listeners
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners("open-bill-file");
        window.electronAPI.removeAllListeners("save-bill-file");
        window.electronAPI.removeAllListeners("open-file-from-command");
      }
    };
  }, []);

  // Enhanced bill data loading function
  const handleLoadBillData = async (data, filePath) => {
    try {
      // Load the bill data
      if (data.billData) {
        setBillData(data.billData);
      } else {
        setBillData(data);
      }

      // Load company info if available
      if (data.companyInfo) {
        setCompanyInfo(data.companyInfo);
      }

      toast.success(`Bill loaded successfully from: ${filePath}`);
    } catch (error) {
      console.error("Error loading bill data:", error);
      toast.error("Error loading bill data. Please try again.");
    }
  };

  // Desktop file operation handlers
  const handleOpenBillFile = async () => {
    if (!window.electronAPI) {
      toast.error("Desktop file operations are only available in the desktop app.");
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
    if (!window.electronAPI) {
      toast.error("Desktop file operations are only available in the desktop app.");
      return;
    }

    try {
      const completeBillData = {
        ...billData,
        companyInfo,
        savedAt: new Date().toISOString(),
        total: calculateTotal(),
        subtotal: calculateSubtotal(),
        totalCGST: calculateTotalCGST(),
        totalSGST: calculateTotalSGST(),
      };

      const result = await window.electronAPI.saveFile(completeBillData);
      if (result.success) {
        toast.success(`Bill saved successfully to: ${result.filePath}`);
      } else {
        toast.error(`Error saving bill: ${result.error}`);
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
      setSavedBills((prev) => {
        const updated = [...prev, savedBill];
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

  const loadSavedBill = async (savedBill) => {
    try {
      // If it's a desktop file, load it from the file system
      if (savedBill.filePath && window.electronAPI) {
        const result = await window.electronAPI.openFileFromCommand(
          savedBill.filePath
        );
        if (result.success) {
          await handleLoadBillData(result.data, savedBill.filePath);
          return;
        }
      }

      // Otherwise, load from localStorage data
      setBillData({
        billNumber: savedBill.billNumber || "",
        date: savedBill.date || new Date().toISOString().split("T")[0],
        customerName: savedBill.customerName || "",
        plantName: savedBill.plantName || "",
        customerAddress: savedBill.customerAddress || "",
        customerPhone: savedBill.customerPhone || "",
        customerGST: savedBill.customerGST || "",
        items:
          savedBill.items && savedBill.items.length > 0
            ? savedBill.items
            : [
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

      // Load company info if available
      if (savedBill.companyInfo) {
        setCompanyInfo(savedBill.companyInfo);
      }

      toast.success("Bill loaded successfully!");
    } catch (error) {
      console.error("Error loading bill:", error);
      toast.error("Error loading bill. Please try again.");
    }
  };

  const deleteSavedBill = async (index) => {
    if (confirm("Are you sure you want to delete this saved bill?")) {
      try {
        const billToDelete = savedBills[index];

        // If it's a desktop file, delete the actual file
        if (billToDelete.filePath && window.electronAPI) {
          try {
            // Note: We'll need to add a delete file API to Electron
            // For now, we'll just remove it from the list
            console.log("Desktop file deletion not yet implemented");
          } catch (error) {
            console.error("Error deleting desktop file:", error);
          }
        }

        // Remove from saved bills list
        setSavedBills((prev) => {
          const updated = prev.filter((_, i) => i !== index);
          localStorage.setItem("savedBills", JSON.stringify(updated));
          return updated;
        });

        toast.error("Bill deleted successfully!");
      } catch (error) {
        console.error("Error deleting bill:", error);
        toast.error("Error deleting bill. Please try again.");
      }
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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

            {/* Customer Information Section */}
            <section className="bg-white shadow-xl border border-gray-200">
              <CustomerInfo billData={billData} setBillData={setBillData} />
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
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        📄
                      </span>
                      <span>Generate Professional Bill</span>
                      <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                        →
                      </span>
                    </>
                  )}
                </button>

                {typeof window !== "undefined" && window.electronAPI && (
                  <>
                    <button
                      onClick={handleOpenBillFile}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-6 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center space-x-4 group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        📂
                      </span>
                      <span>Open Bill</span>
                    </button>
                    <button
                      onClick={handleSaveBillFile}
                      className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-6 hover:from-orange-700 hover:to-red-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center space-x-4 group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        💾
                      </span>
                      <span>Save Bill</span>
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Bill Generator Modal */}
        {showBill && (
          <BillGenerator
            billData={billData}
            companyInfo={companyInfo}
            isVisible={showBill}
            onClose={closeBill}
            onEdit={() => {
              setShowBill(false);
              // The form is already editable, so just close the bill view
            }}
            onSave={handleSaveBillFromGenerator}
          />
        )}

        {/* Credential Manager Modal */}
        <CredentialManager
          isVisible={showCredentialManager}
          onClose={() => setShowCredentialManager(false)}
          onSave={handleSaveBill}
          billData={billData}
          companyInfo={companyInfo}
        />
      </main>
    </div>
  );
}
