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
    async (data, filePath) => {
      try {
        // Validate that this is a bill file
        if (!data || typeof data !== "object") {
          throw new Error(
            "Invalid file format. Please select a valid bill JSON file.",
          );
        }

        // Check if it's a bill format preset
        if (data.billData && data.name && data.savedAt) {
          toast.info("Loading bill format preset...");
          if (data.billData.billData) {
            setBillData(data.billData.billData);
          } else {
            setBillData(data.billData);
          }
          if (data.billData.companyInfo) {
            setCompanyInfo(data.billData.companyInfo);
          }
          toast.success(
            `Bill format preset "${data.name}" loaded successfully!`,
          );
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
          toast.warning(
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

        toast.success(`Bill loaded successfully from: ${filePath}`);
      } catch (error) {
        console.error("Error loading bill data:", error);
        toast.error(`Error loading bill data: ${error.message}`);
      }
    },
    [setBillData, setCompanyInfo],
  );

  // Desktop file operation handlers
  const handleOpenBillFile = useCallback(async () => {
    if (!window.electronAPI) {
      // Web-based file opening
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
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
      window.dispatchEvent(new CustomEvent('save-bill-request', { 
        detail: completeBillData 
      }));
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
      const jsonFiles = files.filter(
        (file) =>
          file.type === "application/json" || file.name.endsWith(".json"),
      );
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
