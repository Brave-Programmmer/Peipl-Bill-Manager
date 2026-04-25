import { useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Enhanced file parser with recovery system
 * Handles file parsing in renderer process with better error recovery
 */
export function useFileParser({ onLoadBillData, onCloseFile }) {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [corruptedData, setCorruptedData] = useState(null);
  const [recoveredData, setRecoveredData] = useState(null);
  const [currentFilePath, setCurrentFilePath] = useState(null);

  // Enhanced bill data parsing with recovery
  const parseFileContent = useCallback(
    async (filePath, content) => {
      try {
        setCurrentFilePath(filePath);
        setIsRecoveryMode(false);
        setCorruptedData(null);
        setRecoveredData(null);

        console.log("[File Parser] Parsing file:", filePath);

        // Parse JSON
        let billData;
        try {
          billData = JSON.parse(content);
        } catch (parseError) {
          console.error("[File Parser] JSON parse error:", parseError.message);

          // Try to recover corrupted JSON
          const recovered = attemptJsonRecovery(content);
          if (recovered) {
            setCorruptedData(content);
            setRecoveredData(recovered);
            setIsRecoveryMode(true);

            toast.error(
              "File appears to be corrupted. Attempted recovery - please review the data.",
              { duration: 6000 },
            );

            // Load recovered data
            await onLoadBillData(recovered, filePath, [
              "File was automatically recovered from corruption",
            ]);
            return {
              success: true,
              data: recovered,
              warnings: ["File was automatically recovered from corruption"],
            };
          }

          throw new Error(`Invalid JSON file: ${parseError.message}`);
        }

        // Security: Validate .peiplbill format if applicable
        if (filePath.toLowerCase().endsWith(".peiplbill")) {
          const validation = validatePeiplBillFormat(billData);
          if (!validation.isValid) {
            console.error(
              "[File Parser] Invalid .peiplbill format:",
              validation.error,
            );
            throw new Error(validation.error);
          }
        }

        // Enhanced bill validation with recovery
        const { validatedData, warnings, recoveryActions } =
          validateAndRecoverBillData(billData);

        console.log("[File Parser] Successfully parsed bill:", {
          filePath,
          billNumber: validatedData.billNumber,
          itemsCount: validatedData.items?.length || 0,
          warnings,
          recoveryActions,
        });

        // Load the validated data
        await onLoadBillData(validatedData, filePath, warnings);

        // Notify main process of successful parsing
        if (window.electronAPI?.fileParsed) {
          await window.electronAPI.fileParsed(
            filePath,
            true,
            validatedData,
            null,
            warnings,
          );
        }

        return { success: true, data: validatedData, warnings };
      } catch (error) {
        console.error("[File Parser] Error parsing file:", error);

        // Notify main process of parsing failure
        if (window.electronAPI?.fileParsed) {
          await window.electronAPI.fileParsed(
            filePath,
            false,
            null,
            error.message,
            null,
          );
        }

        throw error;
      }
    },
    [onLoadBillData],
  );

  // Attempt to recover corrupted JSON
  const attemptJsonRecovery = (content) => {
    try {
      console.log("[File Parser] Attempting JSON recovery...");

      // Strategy 1: Fix common JSON syntax errors
      let fixedContent = content
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
        .replace(/:\s*([^",\[\]{}0-9][^",\[\]{}]*?)(\s*[,\}])/g, ': "$1"$2'); // Quote unquoted values

      try {
        return JSON.parse(fixedContent);
      } catch (e) {
        console.log(
          "[File Parser] Basic fixes failed, trying advanced recovery...",
        );
      }

      // Strategy 2: Extract partial data using regex
      const billNumberMatch = content.match(
        /["']?billNumber["']?\s*:\s*["']([^"']+)["']/i,
      );
      const itemsMatch = content.match(/["']?items["']?\s*:\s*\[(.*?)\]/s);

      if (billNumberMatch || itemsMatch) {
        const recovered = {
          billNumber: billNumberMatch?.[1] || "RECOVERED_BILL",
          items: [],
        };

        if (itemsMatch) {
          try {
            // Try to parse items array
            const itemsString = "[" + itemsMatch[1] + "]";
            recovered.items = JSON.parse(itemsString);
          } catch (e) {
            // Create basic item structure
            recovered.items = [
              {
                id: 1,
                description: "Recovered item - please review",
                quantity: 1,
                rate: 0,
              },
            ];
          }
        }

        return recovered;
      }

      return null;
    } catch (error) {
      console.error("[File Parser] Recovery failed:", error);
      return null;
    }
  };

  // Validate .peiplbill format
  const validatePeiplBillFormat = (data) => {
    if (typeof data !== "object" || data === null) {
      return { isValid: false, error: "Invalid data format" };
    }

    // Check for magic header
    if (data.__type !== "PEIPL_BILL") {
      return {
        isValid: false,
        error: "Invalid .peiplbill format - missing magic header",
      };
    }

    // Check version compatibility
    if (!data.version || !data.version.match(/^\d+\.\d+$/)) {
      return { isValid: false, error: "Invalid or missing version" };
    }

    return { isValid: true, data };
  };

  // Enhanced bill validation with recovery
  const validateAndRecoverBillData = (billData) => {
    const warnings = [];
    const recoveryActions = [];

    // Check for different bill formats
    let validatedData = null;

    // Check if it's a .peiplbill file with magic header
    if (billData.__type === "PEIPL_BILL") {
      validatedData = billData.billData;
      warnings.push(`Loaded PEIPL Bill file v${billData.version}`);
    }
    // Check if it's a bill format preset
    else if (billData.billData && billData.name && billData.savedAt) {
      validatedData = billData.billData.billData || billData.billData;
      warnings.push(`Loaded bill format preset "${billData.name}"`);
    }
    // Check if it's a saved bill with billData wrapper
    else if (billData.billData) {
      validatedData = billData.billData;
    }
    // Direct bill data
    else if (billData.items && Array.isArray(billData.items)) {
      validatedData = billData;
    }
    // Bill with identifier but no items
    else if (billData.billNumber || billData.invoiceNumber) {
      validatedData = {
        ...billData,
        items: billData.items || [],
      };
      if (!billData.items || billData.items.length === 0) {
        warnings.push("Bill has no items - starting with empty items array");
        recoveryActions.push("Created empty items array");
      }
    }
    // Unknown format - try to salvage
    else {
      console.warn("[File Parser] Unknown bill format, attempting to salvage");
      validatedData = {
        billNumber: billData.billNumber || billData.invoiceNumber || "UNKNOWN",
        items: billData.items || [],
        ...billData,
      };
      warnings.push(
        "File format not recognized - attempting to load with basic structure",
      );
      recoveryActions.push("Attempted to salvage unknown format");
    }

    // Final validation of essential fields
    if (!validatedData.billNumber && !validatedData.invoiceNumber) {
      validatedData.billNumber = "UNKNOWN_BILL";
      warnings.push("Missing bill number - set to UNKNOWN_BILL");
      recoveryActions.push("Generated missing bill number");
    }

    if (!validatedData.items || !Array.isArray(validatedData.items)) {
      validatedData.items = [];
      warnings.push("Invalid or missing items array - initialized as empty");
      recoveryActions.push("Created missing items array");
    }

    // Validate and fix each item
    if (validatedData.items && validatedData.items.length > 0) {
      validatedData.items = validatedData.items.map((item, index) => {
        const fixedItem = { ...item };

        // Ensure required fields
        if (!fixedItem.id) {
          fixedItem.id = index + 1;
          recoveryActions.push(`Generated missing ID for item ${index + 1}`);
        }
        if (!fixedItem.description) {
          fixedItem.description = "";
          recoveryActions.push(`Cleared description for item ${index + 1}`);
        }
        if (!fixedItem.sacHsn) {
          fixedItem.sacHsn = "";
          recoveryActions.push(`Cleared HSN/SAC for item ${index + 1}`);
        }
        if (!fixedItem.quantity || fixedItem.quantity <= 0) {
          fixedItem.quantity = 1;
          recoveryActions.push(`Fixed quantity for item ${index + 1}`);
        }
        if (!fixedItem.unit) {
          fixedItem.unit = "PCS";
          recoveryActions.push(`Set default unit for item ${index + 1}`);
        }
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
        if (!fixedItem.cgstRate) {
          fixedItem.cgstRate = 9;
          recoveryActions.push(`Set default CGST rate for item ${index + 1}`);
        }
        if (!fixedItem.sgstRate) {
          fixedItem.sgstRate = 9;
          recoveryActions.push(`Set default SGST rate for item ${index + 1}`);
        }
        if (!fixedItem.cgstAmount) {
          fixedItem.cgstAmount = 0;
          recoveryActions.push(`Set default CGST amount for item ${index + 1}`);
        }
        if (!fixedItem.sgstAmount) {
          fixedItem.sgstAmount = 0;
          recoveryActions.push(`Set default SGST amount for item ${index + 1}`);
        }
        if (!fixedItem.totalWithGST) {
          fixedItem.totalWithGST = fixedItem.amount;
          recoveryActions.push(
            `Set default total with GST for item ${index + 1}`,
          );
        }

        // Ensure dates array exists
        if (!fixedItem.dates || !Array.isArray(fixedItem.dates)) {
          fixedItem.dates = [new Date().toISOString().split("T")[0]];
          recoveryActions.push(`Set default dates for item ${index + 1}`);
        }

        return fixedItem;
      });
    }

    if (recoveryActions.length > 0) {
      console.log("[File Parser] Recovery actions:", recoveryActions);
      toast(
        `File loaded with ${recoveryActions.length} automatic fix${recoveryActions.length > 1 ? "es" : ""}`,
        { icon: "🔧", duration: 4000 },
      );
    }

    return { validatedData, warnings, recoveryActions };
  };

  // Accept recovered data
  const acceptRecoveredData = useCallback(async () => {
    if (recoveredData && currentFilePath) {
      try {
        // Save recovered data
        if (window.electronAPI?.recoverFile) {
          const result = await window.electronAPI.recoverFile(
            currentFilePath,
            corruptedData,
            recoveredData,
          );
          if (result.success) {
            toast.success(result.message, { duration: 5000 });
            setIsRecoveryMode(false);
            setCorruptedData(null);
            setRecoveredData(null);
          } else {
            toast.error(`Failed to save recovered data: ${result.error}`);
          }
        }
      } catch (error) {
        console.error("[File Parser] Error accepting recovered data:", error);
        toast.error("Failed to save recovered data");
      }
    }
  }, [recoveredData, currentFilePath, corruptedData]);

  // Reject recovered data
  const rejectRecoveredData = useCallback(() => {
    setIsRecoveryMode(false);
    setCorruptedData(null);
    setRecoveredData(null);
    setCurrentFilePath(null);
    toast("Recovered data rejected. File was not loaded.");
  }, []);

  // Close file and unlock
  const closeFile = useCallback(async () => {
    if (currentFilePath && window.electronAPI?.closeFile) {
      try {
        await window.electronAPI.closeFile(currentFilePath);
        setCurrentFilePath(null);
        setIsRecoveryMode(false);
        setCorruptedData(null);
        setRecoveredData(null);
      } catch (error) {
        console.error("[File Parser] Error closing file:", error);
      }
    }
  }, [currentFilePath]);

  return {
    parseFileContent,
    isRecoveryMode,
    corruptedData,
    recoveredData,
    acceptRecoveredData,
    rejectRecoveredData,
    closeFile,
    currentFilePath,
  };
}
