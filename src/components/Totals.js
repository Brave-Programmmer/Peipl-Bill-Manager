import { useState, useMemo } from "react";
import {
  calculateSubtotal,
  calculateTotalCGST,
  calculateTotalSGST,
  calculateTotal,
} from "../utils/billCalculations";

export default function Totals({ billData }) {
  // Memoized calculation functions for better performance
  const calculateSubtotalMemo = useMemo(() => {
    return calculateSubtotal(billData?.items);
  }, [billData?.items]);

  const calculateTotalCGSTMemo = useMemo(() => {
    return calculateTotalCGST(billData?.items);
  }, [billData?.items]);

  const calculateTotalSGSTMemo = useMemo(() => {
    return calculateTotalSGST(billData?.items);
  }, [billData?.items]);

  const calculateTotalMemo = useMemo(() => {
    return calculateTotal(billData?.items);
  }, [billData?.items]);

  const formatCurrency = (amount) => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num) || !isFinite(num)) {
        return "0.00";
      }
      // Ensure we don't show negative values
      const absoluteNum = Math.abs(num);
      // Handle numbers larger than 999999999999.99
      if (absoluteNum > 999999999999.99) {
        return "999999999999.99";
      }
      // Ensure we always show 2 decimal places
      return absoluteNum.toFixed(2);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "0.00";
    }
  };

  const subtotal = calculateSubtotalMemo;
  const totalCGST = calculateTotalCGSTMemo;
  const totalSGST = calculateTotalSGSTMemo;
  const totalGST = totalCGST + totalSGST;
  const total = calculateTotalMemo;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="totals-row">
        <span className="totals-label">Subtotal</span>
        <span className="totals-value">₹{formatCurrency(subtotal)}</span>
      </div>

      {billData.discount > 0 && (
        <div className="totals-row">
          <span className="totals-label text-danger">Discount</span>
          <span className="totals-value text-danger">
            -₹{formatCurrency(billData.discountAmount || 0)}
          </span>
        </div>
      )}

      {billData.taxRate > 0 && (
        <div className="totals-row">
          <span className="totals-label">Tax ({billData.taxRate}%)</span>
          <span className="totals-value">
            ₹{formatCurrency(billData.taxAmount || totalGST)}
          </span>
        </div>
      )}

      <div className="totals-row totals-final">
        <span className="font-bold text-main">Total Amount</span>
        <span className="font-bold text-primary">₹{formatCurrency(total)}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
        <span className="text-xs text-text-muted italic">
          Amounts shown in INR (₹)
        </span>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span className="w-2 h-2 rounded-full bg-primary"></span>
        </div>
      </div>
    </div>
  );
}
