import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export function useFileHandler({
  billData,
  setBillData,
  setCompanyInfo,
  onLoadBillData,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Enhanced bill data loading function
  const handleLoadBillData = useCallback(
    async (data, filePath, warnings = []) => {
      try {
        console.log("[File Handler] Loading bill data:", {
          filePath,
          dataType: typeof data,
          warnings,
        });

        // Show any warnings first
        if (warnings && warnings.length > 0) {
          warnings.forEach((warning) => {
            toast(warning, { icon: "⚠️", duration: 4000 });
          });
        }

        // Validate that this is a bill file
        if (!data || typeof data !== "object") {
          throw new Error(
            "Invalid file format. Please select a valid bill JSON file.",
          );
        }

        // Check if it's a .peiplbill file with magic header
        if (data.__type === "PEIPL_BILL") {
          toast.info("Loading PEIPL Bill file...");
          const billDataToLoad = data.billData;
          setBillData(billDataToLoad);

          if (billDataToLoad.companyInfo) {
            setCompanyInfo(billDataToLoad.companyInfo);
          }
          toast.success(
            `PEIPL Bill file v${data.version} loaded successfully!`,
          );
          return;
        }

        // Check if it's a bill format preset
        if (data.billData && data.name && data.savedAt) {
          toast.info("Loading bill format preset...");
          const billDataToLoad = data.billData.billData || data.billData;
          setBillData(billDataToLoad);

          if (billDataToLoad.companyInfo) {
            setCompanyInfo(billDataToLoad.companyInfo);
          }
          toast.success(
            `Bill format preset "${data.name}" loaded successfully!`,
          );
          return;
        }

        // Handle different bill data formats
        let billDataToLoad = data;
        let companyInfoToLoad = data.companyInfo;

        // Check if it's a saved bill with billData wrapper
        if (data.billData) {
          billDataToLoad = data.billData;
          companyInfoToLoad = data.billData.companyInfo || companyInfoToLoad;
        }

        // Enhanced validation and data recovery
        const validatedBillData = validateAndRecoverBillData(billDataToLoad);

        // Load the validated bill data
        setBillData(validatedBillData);

        // Load company info if available
        if (companyInfoToLoad) {
          setCompanyInfo(companyInfoToLoad);
        }

        // Show success message with details
        const itemCount = validatedBillData.items
          ? validatedBillData.items.length
          : 0;
        const billNumber =
          validatedBillData.billNumber ||
          validatedBillData.invoiceNumber ||
          "Unknown";

        toast.success(
          `Bill "${billNumber}" loaded successfully! (${itemCount} items)`,
          { duration: 4000 },
        );
      } catch (error) {
        console.error("Error loading bill data:", error);
        toast.error(`Error loading bill data: ${error.message}`, {
          duration: 5000,
        });
      }
    },
    [setBillData, setCompanyInfo],
  );

  // Helper function to validate and recover bill data
  const validateAndRecoverBillData = (billData) => {
    const recovered = { ...billData };
    const recoveryActions = [];

    // Ensure bill number exists
    if (!recovered.billNumber && !recovered.invoiceNumber) {
      recovered.billNumber = `BILL_${Date.now()}`;
      recoveryActions.push("Generated missing bill number");
    }

    // Ensure items array exists and is valid
    if (!recovered.items || !Array.isArray(recovered.items)) {
      recovered.items = [];
      recoveryActions.push("Created missing items array");
    }

    // Validate and fix each item
    if (recovered.items.length > 0) {
      recovered.items = recovered.items.map((item, index) => {
        const fixedItem = { ...item };

        // Ensure required fields
        if (!fixedItem.id) fixedItem.id = index + 1;
        if (!fixedItem.description) fixedItem.description = "";
        if (!fixedItem.sacHsn) fixedItem.sacHsn = "";
        if (!fixedItem.quantity || fixedItem.quantity <= 0) {
          fixedItem.quantity = 1;
          recoveryActions.push(`Fixed quantity for item ${index + 1}`);
        }
        if (!fixedItem.unit) fixedItem.unit = "PCS";
        if (!fixedItem.rate || fixedItem.rate < 0) {
          fixedItem.rate = 0;
          recoveryActions.push(`Fixed rate for item ${index + 1}`);
        }

        // Recalculate amount if needed
        const calculatedAmount = fixedItem.quantity * fixedItem.rate;
        if (!fixedItem.amount || fixedItem.amount !== calculatedAmount) {
          fixedItem.amount = calculatedAmount;
          recoveryActions.push(`Recalculated amount for item ${index + 1}`);
        }

        // Ensure GST fields exist
        if (!fixedItem.cgstRate) fixedItem.cgstRate = 9;
        if (!fixedItem.sgstRate) fixedItem.sgstRate = 9;
        if (!fixedItem.cgstAmount) fixedItem.cgstAmount = 0;
        if (!fixedItem.sgstAmount) fixedItem.sgstAmount = 0;
        if (!fixedItem.totalWithGST) fixedItem.totalWithGST = fixedItem.amount;

        // Ensure dates array exists
        if (!fixedItem.dates || !Array.isArray(fixedItem.dates)) {
          fixedItem.dates = [new Date().toISOString().split("T")[0]];
        }

        return fixedItem;
      });
    }

    // Show recovery actions if any
    if (recoveryActions.length > 0) {
      console.log("[File Handler] Data recovery actions:", recoveryActions);
      toast(
        `File loaded with ${recoveryActions.length} automatic fix${recoveryActions.length > 1 ? "es" : ""}`,
        { icon: "🔧", duration: 4000 },
      );
    }

    return recovered;
  };

  // Desktop file operation handlers
  const handleOpenBillFile = useCallback(async () => {
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
  }, [handleLoadBillData]);

  const handleSaveBillFile = useCallback(async (completeBillData) => {
    // Delegate to the main save handler in page.js
    // This prevents duplicate save logic and race conditions
    if (window.electronAPI) {
      // Trigger the main save handler via event
      window.dispatchEvent(
        new CustomEvent("save-bill-request", {
          detail: completeBillData,
        }),
      );
    }
    return { success: true };
  }, []);

  // Drag and Drop handlers
  useEffect(() => {
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
            "Error reading file. Please ensure it's a valid JSON file.",
            { id: "file-loading" },
          );
        }
      } else {
        toast.error("Please drop a valid JSON file.");
      }
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [handleLoadBillData]);

  return {
    isDragOver,
    handleOpenBillFile,
    handleSaveBillFile,
    handleLoadBillData,
  };
}
