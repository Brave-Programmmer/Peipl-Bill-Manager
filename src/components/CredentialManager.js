"use client";

import { useState, useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";
import {
  calculateSubtotal,
  calculateTotalCGST,
  calculateTotalSGST,
} from "../utils/billCalculations";

export default function CredentialManager({
  isVisible,
  onClose,
  onSave,
  billData,
  companyInfo,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [billName, setBillName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentBillData, setCurrentBillData] = useState(billData);

  const subtotal = calculateSubtotal(currentBillData?.items || []);
  const totalCGST = calculateTotalCGST(currentBillData?.items || []);
  const totalSGST = calculateTotalSGST(currentBillData?.items || []);
  const total = subtotal + totalCGST + totalSGST;

  useEffect(() => {
    if (isVisible) {
      // Check if there's temporary bill data from the bill generator
      try {
        const tempBillData = localStorage.getItem("tempBillData");
        if (tempBillData) {
          try {
            setCurrentBillData(JSON.parse(tempBillData));
          } catch (parseError) {
            console.error("Error parsing tempBillData:", parseError);
            setCurrentBillData(billData);
          }
          try {
            localStorage.removeItem("tempBillData"); // Clean up
          } catch (removeError) {
            console.error("Error removing tempBillData:", removeError);
          }
        } else {
          setCurrentBillData(billData);
        }
      } catch (storageError) {
        console.error(
          "Error accessing localStorage for tempBillData:",
          storageError,
        );
        setCurrentBillData(billData);
      }
    }
  }, [isVisible, billData]);

  if (!isVisible) return null;

  const handleSave = async () => {
    // Remove validation checks - allow saving with any data
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call for saving
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Calculate totals for the complete bill data
      const subtotal = calculateSubtotal(currentBillData.items);
      const totalCGST = calculateTotalCGST(currentBillData.items);
      const totalSGST = calculateTotalSGST(currentBillData.items);

      const total = subtotal + totalCGST + totalSGST;

      // Convert number to words function
      const numberToWords = (num) => {
        if (num === 0) return "Zero";

        const ones = [
          "",
          "One",
          "Two",
          "Three",
          "Four",
          "Five",
          "Six",
          "Seven",
          "Eight",
          "Nine",
        ];
        const tens = [
          "",
          "",
          "Twenty",
          "Thirty",
          "Forty",
          "Fifty",
          "Sixty",
          "Seventy",
          "Eighty",
          "Ninety",
        ];
        const teens = [
          "Ten",
          "Eleven",
          "Twelve",
          "Thirteen",
          "Fourteen",
          "Fifteen",
          "Sixteen",
          "Seventeen",
          "Eighteen",
          "Nineteen",
        ];

        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100)
          return (
            tens[Math.floor(num / 10)] +
            (num % 10 !== 0 ? " " + ones[num % 10] : "")
          );
        if (num < 1000)
          return (
            ones[Math.floor(num / 100)] +
            " Hundred" +
            (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "")
          );
        if (num < 100000)
          return (
            numberToWords(Math.floor(num / 1000)) +
            " Thousand" +
            (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
          );
        if (num < 10000000)
          return (
            numberToWords(Math.floor(num / 100000)) +
            " Lakh" +
            (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
          );
        return (
          numberToWords(Math.floor(num / 10000000)) +
          " Crore" +
          (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
        );
      };

      const amountInWords = (amount) => {
        const rupees = Math.floor(amount);
        const paise = Math.round((amount - rupees) * 100);

        let words = numberToWords(rupees) + " Rupees";
        if (paise > 0) {
          words += " and " + numberToWords(paise) + " Paise";
        }
        words += " Only";

        return words;
      };

      const billDataForSave = {
        ...currentBillData,
        companyInfo,
        savedBy: username,
        savedAt: new Date().toISOString(),
        billName: billName.trim(),
        total,
        subtotal,
        totalCGST,
        totalSGST,
        amountInWords: amountInWords(total),
      };

      // Save to localStorage (in real app, this would be an API call)
      let savedBills = [];
      try {
        const savedBillsData = localStorage.getItem("savedBills");
        if (savedBillsData) {
          savedBills = JSON.parse(savedBillsData);
          // Ensure it's an array
          if (!Array.isArray(savedBills)) {
            console.warn(
              "savedBills is not an array, resetting to empty array",
            );
            savedBills = [];
          }
        }
      } catch (parseError) {
        console.error(
          "Error parsing savedBills from localStorage:",
          parseError,
        );
        // Reset to empty array if data is corrupted
        savedBills = [];
        try {
          localStorage.setItem("savedBills", JSON.stringify([]));
        } catch (resetError) {
          console.error("Failed to reset savedBills:", resetError);
        }
      }

      // Check if bill name already exists
      const existingBillIndex = savedBills.findIndex(
        (bill) => bill.billName === billName.trim(),
      );
      if (existingBillIndex >= 0) {
        // Update existing bill
        savedBills[existingBillIndex] = billDataForSave;
      } else {
        // Add new bill
        savedBills.push(billDataForSave);
      }

      // Keep only last 50 bills to prevent localStorage overflow
      const trimmedBills = savedBills.slice(-50);

      try {
        localStorage.setItem("savedBills", JSON.stringify(trimmedBills));
      } catch (storageError) {
        console.error("LocalStorage error:", storageError);
        setError("Storage quota exceeded. Please clear some saved bills.");
        setIsLoading(false);
        return;
      }

      // Call parent save handler
      if (onSave && typeof onSave === "function") {
        onSave(billDataForSave);
        toast.success("Bill saved successfully!");
      } else {
        console.error("onSave handler is not available");
        setError("Save handler not available. Please try again.");
        toast.error("Save handler not available. Please try again.");
        setIsLoading(false);
        return;
      }

      onClose();

      // Reset form
      setUsername("");
      setPassword("");
      setBillName("");
    } catch (err) {
      console.error("Error saving bill:", err);
      setError(`Failed to save bill: ${err.message || "Unknown error"}`);
      toast.error(`Failed to save bill: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content !max-w-md">
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">💾</span>
            </div>
            <div>
              <h2 className="text-xl font-bold m-0 leading-tight">Save Bill</h2>
              <p className="text-xs text-white/80 m-0">
                Securely store your data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon !min-w-0 !w-8 !h-8 text-white hover:bg-white/10 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-6">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="billName">Bill Name / Reference</label>
              <input
                id="billName"
                type="text"
                placeholder="e.g., April Service Bill - RCFL"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Prepared By</label>
              <input
                id="username"
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-bg-alt rounded-xl border border-border-light">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Preview Amount
              </span>
              <span className="text-lg font-black text-primary">
                ₹{total.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-text-muted italic leading-tight">
              Totals will be recalculated automatically before saving.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !billName.trim()}
            className={`btn btn-primary min-w-[120px] ${isLoading ? "loading" : ""}`}
          >
            {isLoading ? "Saving..." : "Confirm Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
