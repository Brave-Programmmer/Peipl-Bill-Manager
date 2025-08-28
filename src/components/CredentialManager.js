'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function CredentialManager({ isVisible, onClose, onSave, billData, companyInfo }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [billName, setBillName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentBillData, setCurrentBillData] = useState(billData);

  useEffect(() => {
    if (isVisible) {
      // Check if there's temporary bill data from the bill generator
      const tempBillData = localStorage.getItem('tempBillData');
      if (tempBillData) {
        setCurrentBillData(JSON.parse(tempBillData));
        localStorage.removeItem('tempBillData'); // Clean up
      } else {
        setCurrentBillData(billData);
      }
    }
  }, [isVisible, billData]);

  if (!isVisible) return null;

  const handleSave = async () => {
    // Enhanced validation
    const validationErrors = [];
    
    if (!username.trim()) {
      validationErrors.push('Username is required');
    }
    if (!password.trim()) {
      validationErrors.push('Password is required');
    }
    if (!billName.trim()) {
      validationErrors.push('Bill name is required');
    }
    
    // Validate bill data
    if (!currentBillData?.billNumber?.trim()) {
      validationErrors.push('Bill number is required');
    }
    if (!currentBillData?.customerName?.trim()) {
      validationErrors.push('Customer name is required');
    }
    if (!currentBillData?.items || currentBillData.items.length === 0) {
      validationErrors.push('At least one item is required');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for saving
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calculate totals for the complete bill data
      const subtotal = currentBillData.items.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || 0;
        return sum + amount;
      }, 0);
      
      const totalCGST = currentBillData.items.reduce((sum, item) => {
        const cgstAmount = parseFloat(item.cgstAmount) || 0;
        return sum + cgstAmount;
      }, 0);
      
      const totalSGST = currentBillData.items.reduce((sum, item) => {
        const sgstAmount = parseFloat(item.sgstAmount) || 0;
        return sum + sgstAmount;
      }, 0);
      
      const total = subtotal + totalCGST + totalSGST;

      // Convert number to words function
      const numberToWords = (num) => {
        if (num === 0) return 'Zero';
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '');
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
        return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
      };

      const amountInWords = (amount) => {
        const rupees = Math.floor(amount);
        const paise = Math.round((amount - rupees) * 100);
        
        let words = numberToWords(rupees) + ' Rupees';
        if (paise > 0) {
          words += ' and ' + numberToWords(paise) + ' Paise';
        }
        words += ' Only';
        
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
        amountInWords: amountInWords(total)
      };

      // Save to localStorage (in real app, this would be an API call)
      const savedBills = JSON.parse(localStorage.getItem('savedBills') || '[]');
      
      // Check if bill name already exists
      const existingBillIndex = savedBills.findIndex(bill => bill.billName === billName.trim());
      if (existingBillIndex >= 0) {
        // Update existing bill
        savedBills[existingBillIndex] = billDataForSave;
      } else {
        // Add new bill
        savedBills.push(billDataForSave);
      }
      
      // Keep only last 50 bills to prevent localStorage overflow
      const trimmedBills = savedBills.slice(-50);
      localStorage.setItem('savedBills', JSON.stringify(trimmedBills));

      onSave(billDataForSave);
      onClose();
      
      // Reset form
      setUsername('');
      setPassword('');
      setBillName('');
    } catch (err) {
      console.error('Error saving bill:', err);
      setError('Failed to save bill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">💾</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold">Save Bill</h2>
                <p className="text-blue-100 text-lg">Enter credentials to save your bill</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors duration-300 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 flex items-center justify-center">
                  <span className="text-white font-bold">⚠️</span>
                </div>
                <div>
                  <p className="text-red-800 font-bold text-sm">Validation Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-2 border-gray-300 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-lg hover:border-blue-400"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-300 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-lg hover:border-blue-400"
                  placeholder="Enter password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Bill Name</label>
                <input
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="w-full border-2 border-gray-300 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-lg hover:border-blue-400"
                  placeholder="Enter bill name"
                />
              </div>
            </div>

            {/* Bill Preview */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Bill Preview</label>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 border border-gray-200 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Bill No:</span>
                      <span className="text-gray-900 font-bold">{currentBillData?.billNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Customer:</span>
                      <span className="text-gray-900 font-bold truncate max-w-32">{currentBillData?.customerName || 'N/A'}</span>
                    </div>
                    {currentBillData?.plantName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Plant:</span>
                        <span className="text-gray-900 font-bold truncate max-w-32">{currentBillData.plantName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Items:</span>
                      <span className="text-gray-900 font-bold">{currentBillData?.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Total:</span>
                      <span className="text-emerald-600 font-bold">
                        ₹{(() => {
                          if (!currentBillData?.items) return '0.00';
                          const subtotal = currentBillData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
                          const totalCGST = currentBillData.items.reduce((sum, item) => sum + (parseFloat(item.cgstAmount) || 0), 0);
                          const totalSGST = currentBillData.items.reduce((sum, item) => sum + (parseFloat(item.sgstAmount) || 0), 0);
                          return (subtotal + totalCGST + totalSGST).toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="bg-white p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Ready to Save</p>
                    <p className="text-xs text-gray-600">All fields are properly configured</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" text="" color="white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Bill</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
