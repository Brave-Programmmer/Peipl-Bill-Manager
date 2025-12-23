import { useState, useMemo } from "react";

export default function Totals({ billData }) {
  // Memoized calculation functions for better performance
  const calculateSubtotal = useMemo(() => {
    try {
      if (!billData?.items || !Array.isArray(billData.items)) {
        return 0;
      }
      return billData.items.reduce((sum, item) => {
        const amount = parseFloat(item.amount);
        // Ensure we only add valid numbers
        if (!isNaN(amount) && isFinite(amount)) {
          return sum + amount;
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error("Error calculating subtotal:", error);
      return 0;
    }
  }, [billData?.items]);

  const calculateTotalCGST = useMemo(() => {
    try {
      if (!billData?.items || !Array.isArray(billData.items)) {
        return 0;
      }
      return billData.items.reduce((sum, item) => {
        const cgstAmount = parseFloat(item.cgstAmount);
        if (!isNaN(cgstAmount) && isFinite(cgstAmount)) {
          return sum + cgstAmount;
        }
        // If CGST amount is invalid, try to calculate it from the item amount and rate
        const amount = parseFloat(item.amount);
        const rate = parseFloat(item.cgstRate);
        if (
          !isNaN(amount) &&
          !isNaN(rate) &&
          isFinite(amount) &&
          isFinite(rate)
        ) {
          return sum + amount * (rate / 100);
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error("Error calculating CGST:", error);
      return 0;
    }
  }, [billData?.items]);

  const calculateTotalSGST = useMemo(() => {
    if (!billData?.items || !Array.isArray(billData.items)) {
      return 0;
    }
    return billData.items.reduce((sum, item) => {
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      return sum + sgstAmount;
    }, 0);
  }, [billData?.items]);

  const calculateTotalGST = useMemo(() => {
    return calculateTotalCGST + calculateTotalSGST;
  }, [calculateTotalCGST, calculateTotalSGST]);

  const calculateTotal = useMemo(() => {
    return calculateSubtotal + calculateTotalGST;
  }, [calculateSubtotal, calculateTotalGST]);

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

  const subtotal = calculateSubtotal;
  const totalCGST = calculateTotalCGST;
  const totalSGST = calculateTotalSGST;
  const totalGST = calculateTotalGST;
  const total = calculateTotal;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="no-print fixed bottom-4 left-4 z-40">
      {!isOpen
        ? <button
            onClick={() => setIsOpen(true)}
            aria-label="Show bill summary"
            className="px-4 py-2 rounded bg-[#019b98] text-white font-semibold shadow hover:bg-[#13bdb2] transition-all duration-300 hover:scale-105 animate-bounce-in"
          >
            Show Bill Summary
          </button>
        : <div className="w-80 rounded-xl bg-white border-2 border-[#019b98] shadow-2xl p-4 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-full"
                  style={{ background: "#019b98", border: "2px solid #311703" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-base font-bold"
                    style={{ color: "#311703", letterSpacing: "0.5px" }}
                  >
                    Bill Summary
                  </h3>
                  <p className="text-[#019b98] text-xs leading-tight font-semibold">
                    Amounts overview
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#311703] hover:text-[#019b98] text-xl font-bold px-2 py-1 rounded transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-[#019b98]/20">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#019b98"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M8 9h8M8 13h6" />
                  </svg>
                  <span className="text-[#019b98] font-semibold text-sm">
                    Subtotal
                  </span>
                </div>
                <span className="text-base font-bold text-[#311703]">
                  ₹{formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#019b98]/20">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M8 9h8M8 13h6" />
                  </svg>
                  <span className="text-[#2563eb] font-semibold text-sm">
                    CGST (9%)
                  </span>
                </div>
                <span className="text-base font-bold text-[#2563eb]">
                  ₹{formatCurrency(totalCGST)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#019b98]/20">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M8 9h8M8 13h6" />
                  </svg>
                  <span className="text-[#7c3aed] font-semibold text-sm">
                    SGST (9%)
                  </span>
                </div>
                <span className="text-base font-bold text-[#7c3aed]">
                  ₹{formatCurrency(totalSGST)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#019b98]/20">
                <div className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M8 9h8M8 13h6" />
                  </svg>
                  <span className="text-[#10b981] font-semibold text-sm">
                    Total GST
                  </span>
                </div>
                <span className="text-base font-bold text-[#10b981]">
                  ₹{formatCurrency(totalGST)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 rounded-lg bg-gradient-to-r from-[#019b98] to-[#ffd700] px-4 mt-2 shadow">
                <div className="flex items-center gap-2">
                  <svg
                    width="22"
                    height="22"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  <span className="text-white text-base font-bold">
                    Grand Total
                  </span>
                </div>
                <span className="text-xl font-bold text-white">
                  ₹{formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>}
    </div>
  );
}
