import { useState } from 'react';

export default function Totals({ billData }) {
  const calculateSubtotal = () => {
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
      console.error('Error calculating subtotal:', error);
      return 0;
    }
  };

  const calculateTotalCGST = () => {
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
        if (!isNaN(amount) && !isNaN(rate) && isFinite(amount) && isFinite(rate)) {
          return sum + (amount * (rate / 100));
        }
        return sum;
      }, 0);
    } catch (error) {
      console.error('Error calculating CGST:', error);
      return 0;
    }
  };

  const calculateTotalSGST = () => {
    if (!billData?.items || !Array.isArray(billData.items)) {
      return 0;
    }
    return billData.items.reduce((sum, item) => {
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      return sum + sgstAmount;
    }, 0);
  };

  const calculateTotalGST = () => {
    return calculateTotalCGST() + calculateTotalSGST();
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalGST();
  };

  const formatCurrency = (amount) => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num) || !isFinite(num)) {
        return '0.00';
      }
      // Ensure we don't show negative values
      const absoluteNum = Math.abs(num);
      // Handle numbers larger than 999999999999.99
      if (absoluteNum > 999999999999.99) {
        return '999999999999.99';
      }
      // Ensure we always show 2 decimal places
      return absoluteNum.toFixed(2);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '0.00';
    }
  };

  const subtotal = calculateSubtotal();
  const totalCGST = calculateTotalCGST();
  const totalSGST = calculateTotalSGST();
  const totalGST = calculateTotalGST();
  const total = calculateTotal();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="no-print fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-colors duration-200"
          title="Show Bill Summary"
        >
          <span>💰</span>
          <span className="text-xs font-bold">Summary</span>
          <span className="text-xs font-semibold bg-white/20 px-2 py-0.5">₹{formatCurrency(total)}</span>
        </button>
      ) : (
        <div className="w-80 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 p-4 shadow-2xl border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow">
                <span className="text-white text-[10px] font-bold">💰</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-none">Bill Summary</h3>
                <p className="text-gray-600 text-[11px] leading-tight">Amounts overview</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-600 hover:text-gray-900">✕</button>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">📊</span>
              </div>
              <span className="text-gray-700 font-bold text-sm">Subtotal:</span>
            </div>
            <span className="text-lg font-bold text-gray-900">₹{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">🏛️</span>
              </div>
              <span className="text-gray-700 font-bold text-sm">CGST (9%):</span>
            </div>
            <span className="text-lg font-bold text-blue-600">₹{formatCurrency(totalCGST)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-indigo-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">🏛️</span>
              </div>
              <span className="text-gray-700 font-bold text-sm">SGST (9%):</span>
            </div>
            <span className="text-lg font-bold text-indigo-600">₹{formatCurrency(totalSGST)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">📋</span>
              </div>
              <span className="text-gray-700 font-bold text-sm">Total GST:</span>
            </div>
            <span className="text-lg font-bold text-green-600">₹{formatCurrency(totalGST)}</span>
          </div>

          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 shadow">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm font-bold">💎</span>
              </div>
              <span className="text-base font-bold">Grand Total:</span>
            </div>
            <span className="text-xl font-bold">₹{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

