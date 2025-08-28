"use client";

import { useState, useCallback, useMemo } from "react";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";

export default function ItemsTable({
  billData,
  setBillData,
  compact = false,
  toggleFullscreen,
  isFullscreen,
}) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isRemovingItem, setIsRemovingItem] = useState(null);
  const [showDateModal, setShowDateModal] = useState(null);
  const [errors, setErrors] = useState({});

  // Generate unique ID for new items
  const generateUniqueId = useCallback(() => {
    const existingIds = billData.items.map((item) => item.id);
    let newId = 1;
    while (existingIds.includes(newId)) {
      newId++;
    }
    return newId;
  }, [billData.items]);

  // Validate numeric input with debounced error handling
  const validateNumericInput = (value, field) => {
    // Always allow the input change to go through
    if (value === "" || value === null || typeof value === "undefined") {
      setErrors((prev) => {
        const { [field]: _ignored, ...rest } = prev;
        return rest;
      });
      return true;
    }

    const numValue = parseFloat(value);
    // Use setTimeout to prevent UI freezing
    setTimeout(() => {
      if (isNaN(numValue) || numValue < 0) {
        setErrors((prev) => ({
          ...prev,
          [`${field}`]: "Please enter a valid positive number",
        }));
      } else {
        setErrors((prev) => {
          const { [field]: _ignored, ...rest } = prev;
          return rest;
        });
      }
    }, 0);

    // Always return true to prevent input freezing
    return true;
  };

  // Validate required fields with non-blocking validation
  const validateItem = (item) => {
    const newErrors = {};

    // Run validations asynchronously
    setTimeout(() => {
      if (!item.description.trim()) {
        newErrors.description = "Description is required";
      }
      if (item.quantity <= 0) {
        newErrors.quantity = "Quantity must be greater than 0";
      }
      if (item.rate < 0) {
        newErrors.rate = "Rate cannot be negative";
      }
      setErrors(newErrors);
    }, 0);

    // Allow the UI to update immediately
    return true;
  };

  const addItem = () => {
    setIsAddingItem(true);

    const newItem = {
      id: generateUniqueId(),
      refNo: [""],
      description: "",
      sacHsn: "998719",
      quantity: 1,
      unit: "PCS",
      rate: 0,
      amount: 0,
      cgstRate: 9,
      cgstAmount: 0,
      sgstRate: 9,
      sgstAmount: 0,
      totalWithGST: 0,
      dates: [billData.date || new Date().toISOString().split("T")[0]],
    };

    // Update state immediately to prevent UI lag
    setBillData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Reset loading state after a short delay
    setTimeout(() => {
      setIsAddingItem(false);
    }, 100);
  };

  const removeItem = async (id) => {
    if (billData.items.length <= 1) {
      toast.error(
        "Cannot remove the last item. At least one item is required."
      );
      return;
    }

    setIsRemovingItem(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      setBillData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setIsRemovingItem(null);
    }
  };

  // Calculate item totals
  const calculateItemTotals = useCallback((item) => {
    const amount = item.quantity * item.rate;
    const cgstAmount = amount * (item.cgstRate / 100);
    const sgstAmount = amount * (item.sgstRate / 100);
    const totalWithGST = amount + cgstAmount + sgstAmount;

    return {
      amount: parseFloat(amount.toFixed(2)),
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      totalWithGST: parseFloat(totalWithGST.toFixed(2)),
    };
  }, []);

  const updateItem = useCallback(
    (id, field, value) => {
      setBillData((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === id) {
            let updatedItem = { ...item, [field]: value };

            // Recalculate totals if quantity, rate, or GST rates change
            if (["quantity", "rate", "cgstRate", "sgstRate"].includes(field)) {
              const totals = calculateItemTotals(updatedItem);
              updatedItem = { ...updatedItem, ...totals };
            }

            return updatedItem;
          }
          return item;
        }),
      }));
    },
    [calculateItemTotals]
  );

  const addDateToItem = useCallback(
    (itemId) => {
      const currentDate =
        billData.date || new Date().toISOString().split("T")[0];

      setBillData((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            const currentDates = item.dates || [currentDate];
            // Only add if date doesn't already exist
            if (!currentDates.includes(currentDate)) {
              return {
                ...item,
                dates: [...currentDates, currentDate],
              };
            }
          }
          return item;
        }),
      }));
      setShowDateModal(null);
    },
    [billData.date]
  );

  const removeDateFromItem = useCallback(
    (itemId, dateIndex) => {
      setBillData((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            const currentDates = [...(item.dates || [billData.date])];
            currentDates.splice(dateIndex, 1);
            return {
              ...item,
              dates:
                currentDates.length > 0
                  ? currentDates
                  : [billData.date || new Date().toISOString().split("T")[0]],
            };
          }
          return item;
        }),
      }));
    },
    [billData.date]
  );

  const updateItemDate = useCallback(
    (itemId, dateIndex, newDate) => {
      setBillData((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            const currentDates = [...(item.dates || [billData.date])];
            currentDates[dateIndex] = newDate;
            return {
              ...item,
              dates: currentDates,
            };
          }
          return item;
        }),
      }));
    },
    [billData.date]
  );

  const handleNumericInput = useCallback(
    (id, field, value) => {
      if (validateNumericInput(value, field)) {
        const numValue = parseFloat(value) || 0;
        updateItem(id, field, numValue);
      }
    },
    [validateNumericInput, updateItem]
  );

  const handleInputChange = useCallback(
    (id, field, value) => {
      if (["quantity", "rate", "cgstRate", "sgstRate"].includes(field)) {
        handleNumericInput(id, field, value);
      } else {
        updateItem(id, field, value);
      }
    },
    [handleNumericInput, updateItem]
  );

  // --- Multi-ref helpers: allow multiple Ref Nos per item ---
  const addRefToItem = useCallback((itemId) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const refs = Array.isArray(item.refNo)
            ? [...item.refNo]
            : [item.refNo || ""];
          return { ...item, refNo: [...refs, ""] };
        }
        return item;
      }),
    }));
  }, []);

  const updateRefAtIndex = useCallback((itemId, idx, value) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const refs = Array.isArray(item.refNo)
            ? [...item.refNo]
            : [item.refNo || ""];
          refs[idx] = value;
          return { ...item, refNo: refs };
        }
        return item;
      }),
    }));
  }, []);

  const removeRefFromItem = useCallback((itemId, idx) => {
    setBillData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const refs = Array.isArray(item.refNo)
            ? [...item.refNo]
            : [item.refNo || ""];
          refs.splice(idx, 1);
          return { ...item, refNo: refs.length > 0 ? refs : [""] };
        }
        return item;
      }),
    }));
  }, []);

  const memoizedItems = useMemo(() => billData.items, [billData.items]);

  return (
    <div
      className={`${isFullscreen ? "fixed inset-0 z-50 bg-white p-4" : "p-6"}`}
    >
      {/* Print-safe table: never overflow horizontally in print */}
      <style jsx global>{`
        @media print {
          .print-safe-table,
          .print-safe-table * {
            font-size: 10px !important;
            table-layout: fixed !important;
            max-width: 100vw !important;
            word-break: break-word !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
          }
          .print-safe-table th,
          .print-safe-table td {
            word-break: break-word !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
            padding: 2px 3px !important;
            min-width: 0 !important;
          }
          .print-safe-table input,
          .print-safe-table textarea {
            font-size: 10px !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .overflow-x-auto {
            overflow-x: visible !important;
          }
        }
      `}</style>
      {/* Particle background */}
      <style jsx>{`
        @keyframes floaty {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-8px) translateX(6px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 50%;
          animation: floaty 6s ease-in-out infinite;
          pointer-events: none;
        }
        @media print {
          .particle {
            display: none !important;
          }
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">📋</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Bill Items</h3>
            <p className="text-gray-600 text-xs">
              Add and manage items for your bill
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={addItem}
            disabled={isAddingItem}
            className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg flex items-center space-x-2 text-sm disabled:opacity-50"
          >
            {isAddingItem ? (
              <LoadingSpinner size="sm" text="" color="white" />
            ) : (
              <>
                <span className="text-sm">➕</span>
                <span>Add Item</span>
              </>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 text-sm"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs print-safe-table">
            <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50">
            
              <tr>
               
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-16">
                 
                  Sr. No.
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-28">
                  
                  Date(s)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-24">
                  
                  Ref No.
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-48">
                  
                  Job Description
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-24">
                  
                  SAC/HSN
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-20">
                  
                  Qty
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-24">
                  
                  Rate (₹)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-28">
                  
                  Taxable Value (₹)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-24">
                  
                  CGST Rate & Amt (9%)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-24">
                  
                  SGST Rate & Amt (9%)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-28">
                  
                  Total with GST (₹)
                </th>
                <th className="px-3 py-3 text-left font-bold text-gray-900 border-b-2 border-gray-300 w-20">
                  
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {memoizedItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 group hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-indigo-100/60 transition-all duration-300 ${
                    isRemovingItem === item.id ? "opacity-50" : ""
                  } animate-fadein`}
                  style={{
                    animationDelay: `${index * 60}ms`,
                    animationDuration: "480ms",
                  }}
                >
                  <td className="px-3 py-3 text-center">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      {(item.dates || [billData.date]).map(
                        (date, dateIndex) => (
                          <div
                            key={dateIndex}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="date"
                              value={date}
                              onChange={(e) =>
                                updateItemDate(
                                  item.id,
                                  dateIndex,
                                  e.target.value
                                )
                              }
                              className="w-24 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold hover:border-blue-400"
                            />
                            {(item.dates || [billData.date]).length > 1 && (
                              <button
                                onClick={() =>
                                  removeDateFromItem(item.id, dateIndex)
                                }
                                className="text-red-500 hover:text-red-700 text-[11px] font-bold hover:scale-110 transition-transform duration-200"
                                title="Remove date"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      )}
                      <button
                        onClick={() => setShowDateModal(item.id)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold hover:scale-105 transition-transform duration-200"
                        title="Add another date"
                      >
                        + Add Date
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      {(Array.isArray(item.refNo)
                        ? item.refNo
                        : [item.refNo || ""]
                      ).map((r, ri) => (
                        <div key={ri} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={r || ""}
                            onChange={(e) =>
                              updateRefAtIndex(item.id, ri, e.target.value)
                            }
                            className="w-24 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-transform duration-300 bg-white text-gray-900 text-[11px] font-semibold focus:scale-110 group-hover:scale-105 group-hover:shadow-lg"
                            placeholder="Ref"
                          />
                          <button
                            onClick={() => removeRefFromItem(item.id, ri)}
                            className="text-red-500 hover:text-red-700 text-[11px] font-bold hover:scale-125 transition-transform duration-200 focus:scale-125 focus:outline-none"
                            title="Remove ref"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addRefToItem(item.id)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold hover:scale-110 transition-transform duration-200 focus:scale-110 focus:outline-none"
                      >
                        + Add Ref
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        handleInputChange(
                          item.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-48 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold resize-none"
                      placeholder="Job Description"
                      rows="2"
                      style={{ minHeight: "40px", maxHeight: "80px" }}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                      <select
                        // If sacHsn is one of the presets, show it; otherwise show 'other'
                        value={
                          ["998719", "73079990"].includes(item.sacHsn)
                            ? item.sacHsn
                            : "other"
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "other") {
                            // user wants to enter a custom SAC/HSN - set to empty string so the custom input appears
                            handleInputChange(item.id, "sacHsn", "");
                          } else {
                            handleInputChange(item.id, "sacHsn", val);
                          }
                        }}
                        className="w-28 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold focus:scale-110 group-hover:scale-105 group-hover:shadow-lg"
                      >
                        <option value="998719">998719</option>
                        <option value="73079990">73079990</option>
                        <option value="other">Other</option>
                      </select>

                      {/* If current value is not one of the presets, show a text input for custom SAC/HSN */}
                      {/* Show the custom input whenever the value is NOT one of the presets (including empty string when user just selected Other) */}
                      {!["998719", "73079990"].includes(item.sacHsn) && (
                        <input
                          type="text"
                          value={item.sacHsn || ""}
                          onChange={(e) =>
                            handleInputChange(item.id, "sacHsn", e.target.value)
                          }
                          className="w-24 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold focus:scale-110 group-hover:scale-105 group-hover:shadow-lg"
                          placeholder="Enter SAC/HSN"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleInputChange(item.id, "quantity", e.target.value)
                      }
                      className="w-20 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold focus:scale-110 group-hover:scale-105 group-hover:shadow-lg"
                      min="0.01"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleInputChange(item.id, "rate", e.target.value)
                      }
                      className="w-24 border-2 border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 text-[11px] font-semibold focus:scale-110 group-hover:scale-105 group-hover:shadow-lg"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[11px] font-bold text-gray-900 bg-blue-50 px-2 py-1 block">
                      ₹{item.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={item.cgstRate}
                        onChange={(e) =>
                          handleInputChange(item.id, "cgstRate", e.target.value)
                        }
                        className="w-20 border border-gray-300 px-1 py-0.5 text-[11px] bg-white"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="text-[11px] font-bold text-gray-900 bg-green-50 px-2 py-1 block">
                        ₹{item.cgstAmount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={item.sgstRate}
                        onChange={(e) =>
                          handleInputChange(item.id, "sgstRate", e.target.value)
                        }
                        className="w-20 border border-gray-300 px-1 py-0.5 text-[11px] bg-white"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="text-[11px] font-bold text-gray-900 bg-green-50 px-2 py-1 block">
                        ₹{item.sgstAmount.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[11px] font-bold text-gray-900 bg-yellow-50 px-2 py-1 block">
                      ₹{item.totalWithGST.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {billData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={isRemovingItem === item.id}
                        className="text-red-600 hover:text-white text-[11px] font-semibold bg-red-50 hover:bg-red-500 px-2 py-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded focus:outline-none focus:ring-2 focus:ring-red-400 focus:scale-110 hover:scale-110"
                        title="Remove item"
                      >
                        {isRemovingItem === item.id ? (
                          <LoadingSpinner size="sm" text="" color="red" />
                        ) : (
                          "🗑️"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Move fade-in style OUTSIDE of tbody/tr */}
      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-fadein {
          animation: fadein 0.48s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      {/* Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-sm w-full mx-4 border border-gray-300">
            <h3 className="text-sm font-bold mb-4">Add Date to Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={billData.date}
                  onChange={(e) =>
                    setBillData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => addDateToItem(showDateModal)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors duration-300 text-sm"
                >
                  Add Date
                </button>
                <button
                  onClick={() => setShowDateModal(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-400 transition-colors duration-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
