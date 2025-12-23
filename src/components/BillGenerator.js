import { create, all } from "mathjs";
import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { exportToPDF, printBill } from "../utils/pdfGenerator";

// --- Formula Calculation Logic ---
// Math.js instance
const math = create(all, { number: "number" });

// Helpers for formula calculation
const FormulaUtils = {
  normalizeToArray(val) {
    if (Array.isArray(val)) return val;
    if (val === undefined || val === null || val === "") return [];
    return [val];
  },
  compileFormulas: (columns) => {
    const map = {};
    (columns || []).forEach((c) => {
      if (c.type === "formula" && c.formula) {
        try {
          map[c.key] = math.compile(c.formula);
        } catch {}
      }
    });
    return map;
  },
  calculateRow(row, columns, compiledFormulas) {
    const r = { ...row };
    columns.forEach((col) => {
      if (col.type === "formula" && col.formula) {
        try {
          const scopeArrays = columns.reduce((acc, c) => {
            acc[c.key] = FormulaUtils.normalizeToArray(r[c.key]);
            return acc;
          }, {});

          const lengths = Object.values(scopeArrays).map((a) => a.length).filter(Boolean);
          const maxLen = lengths.length ? Math.max(...lengths) : 1;

          const compiled = compiledFormulas[col.key] || math.compile(col.formula);
          const results = new Array(maxLen);

          for (let i = 0; i < maxLen; i++) {
            const scope = {};
            for (let j = 0; j < columns.length; j++) {
              const c = columns[j];
              const arr = scopeArrays[c.key];
              let v = arr[i] !== undefined ? arr[i] : arr.length ? arr[0] : 0;
              if (v === "" || v == null) v = 0;
              v = Number(v);
              scope[c.key] = Number.isFinite(v) ? v : 0;
            }
            const val = compiled.evaluate(scope);
            results[i] = typeof val === "number" ? Number(val.toFixed(2)) : val;
          }
          r[col.key] = results.length === 1 ? results[0] : results;
        } catch (err) {
          r[col.key] = "Err";
          // eslint-disable-next-line no-console
          console.warn("Formula calculation error in BillGenerator:", err && err.message ? err.message : err);
        }
      }
    });
    return r;
  },
};
// --- End Formula Calculation Logic ---

export default function BillGenerator({
  billData,
  companyInfo,
  isVisible,
  onClose,
  onEdit,
  onSaveBill,
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [orderNo, setOrderNo] = useState(billData.orderNo || "");

  // Keep local orderNo in sync when parent billData changes
  useEffect(() => {
    setOrderNo(billData.orderNo || "");
  }, [billData.orderNo]);

  // Dynamic table state
  // Enforce default formulas for all bills if not present
  let columns = billData.columns || [
    { key: "srNoDate", label: "Sr. No. & Date" },
    { key: "refNo", label: "Ref No." },
    { key: "description", label: "Job Description" },
    { key: "sacHsn", label: "SAC/HSN" },
    { key: "quantity", label: "Qty" },
    { key: "rate", label: "Rate (₹)" },
    { key: "amount", label: "Taxable Value (₹)" },
    { key: "cgstAmount", label: "CGST (9%)" },
    { key: "sgstAmount", label: "SGST (9%)" },
    { key: "totalWithGST", label: "Total (₹)" },
  ];
  // Add default formulas and types if missing
  const ensureFormula = (key, formula) => {
    const idx = columns.findIndex((c) => c.key === key);
    if (idx >= 0) {
      if (!columns[idx].formula) columns[idx].formula = formula;
      columns[idx].type = "formula"; // Force type to formula for calculation columns
    }
  };
  ensureFormula("amount", "quantity * rate");
  ensureFormula("cgstAmount", "amount * 0.09");
  ensureFormula("sgstAmount", "amount * 0.09");
  ensureFormula("totalWithGST", "amount + cgstAmount + sgstAmount");
  const tableTitle = billData.tableTitle || "Bill Items";
  // Memoize expensive calculations
  const compiledFormulas = useMemo(
    () => FormulaUtils.compileFormulas(columns),
    [columns]
  );
  const rows = useMemo(() => {
    return (billData.items || []).map((item, idx) => {
      const withSr = {
        ...item,
        srNoDate:
          item.srNoDate !== undefined
            ? item.srNoDate
            : `${idx + 1}${
                item.dates && item.dates[0] ? " / " + item.dates[0] : ""
              }`,
      };
      return FormulaUtils.calculateRow(withSr, columns, compiledFormulas);
    });
  }, [billData.items, columns, compiledFormulas]);
  const rowsPerPage = Number(billData.rowsPerPage) || 10;
  const pagedRows = useMemo(() => {
    const pages = [];
    for (let i = 0; i < rows.length; i += rowsPerPage)
      pages.push(rows.slice(i, i + rowsPerPage));
    return pages;
  }, [rows, rowsPerPage]);

  if (!isVisible) return null;

  // Calculate all totals from recalculated rows, not from billData
  // If a cell value is an array, sum all values for that cell
  const sumCell = (cell) => {
    if (Array.isArray(cell))
      return cell.reduce((s, v) => s + (parseFloat(v) || 0), 0);
    return parseFloat(cell) || 0;
  };
  const calculateSubtotal = () => {
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => sum + sumCell(row.amount), 0);
  };

  const calculateTotalCGST = () => {
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => sum + sumCell(row.cgstAmount), 0);
  };

  const calculateTotalSGST = () => {
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => sum + sumCell(row.sgstAmount), 0);
  };

  const calculateTotal = () =>
    calculateSubtotal() + calculateTotalCGST() + calculateTotalSGST();

  // Calculate column totals for display in table
  const calculateColumnTotals = () => {
    const totals = {};
    columns.forEach((col) => {
      if (
        col.key === "quantity" ||
        col.key === "rate" ||
        col.key === "amount" ||
        col.key === "cgstAmount" ||
        col.key === "sgstAmount" ||
        col.key === "totalWithGST"
      ) {
        let sum = 0;
        rows.forEach((row) => {
          const cell = row[col.key];
          if (Array.isArray(cell)) {
            sum += cell.reduce((s, v) => s + (parseFloat(v) || 0), 0);
          } else {
            sum += parseFloat(cell) || 0;
          }
        });
        totals[col.key] = sum.toFixed(2);
      }
    });
    return totals;
  };

  const columnTotals = useMemo(() => calculateColumnTotals(), [rows, columns]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // number-to-words (supports up to crores; built for rupees, lakhs)
  // Memoize numberToWords for repeated values
  const numberToWords = (() => {
    const cache = {};
    function ntw(num) {
      if (cache[num] !== undefined) return cache[num];
      if (num === 0) return (cache[num] = "Zero");
      if (num < 0) return (cache[num] = "Negative " + ntw(Math.abs(num)));
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
      let result;
      if (num < 10) result = ones[num];
      else if (num < 20) result = teens[num - 10];
      else if (num < 100)
        result =
          tens[Math.floor(num / 10)] +
          (num % 10 !== 0 ? " " + ones[num % 10] : "");
      else if (num < 1000)
        result =
          ones[Math.floor(num / 100)] +
          " Hundred" +
          (num % 100 !== 0 ? " and " + ntw(num % 100) : "");
      else if (num < 100000)
        result =
          ntw(Math.floor(num / 1000)) +
          " Thousand" +
          (num % 1000 !== 0 ? " " + ntw(num % 1000) : "");
      else if (num < 10000000)
        result =
          ntw(Math.floor(num / 100000)) +
          " Lakh" +
          (num % 100000 !== 0 ? " " + ntw(num % 100000) : "");
      else
        result =
          ntw(Math.floor(num / 10000000)) +
          " Crore" +
          (num % 10000000 !== 0 ? " " + ntw(num % 10000000) : "");
      return (cache[num] = result);
    }
    return ntw;
  })();

  const amountInWords = (amount) => {
    try {
      const num = Math.round((parseFloat(amount) || 0) * 100) / 100;
      const rupees = Math.floor(num);
      const paise = Math.round((num - rupees) * 100);
      let words = numberToWords(rupees) + " Rupees";
      if (paise > 0) words += " and " + numberToWords(paise) + " Paise";
      words += " Only";
      return words;
    } catch {
      return "Zero Rupees Only";
    }
  };

  // Simple multi-page PDF export by slicing canvas vertically
  const handleExportToPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    await exportToPDF("bill-content", billData.billNumber, setIsExporting);
  };

  // Print the rendered bill canvas directly
  const handlePrintBill = () => {
    printBill("bill-content", billData.billNumber);
  };

  const handleSaveBill = () => {
    try {
      // Validate bill data before saving
      if (!billData.billNumber || billData.billNumber.trim() === "") {
        toast.error("Bill number is required");
        return;
      }

      if (!billData.customerName || billData.customerName.trim() === "") {
        toast.error("Customer name is required");
        return;
      }

      if (!billData.items || billData.items.length === 0) {
        toast.error("At least one item is required");
        return;
      }

      // Check if any items have empty descriptions
      const emptyItems = billData.items.filter(
        (item) => !item.description || item.description.trim() === ""
      );

      if (emptyItems.length > 0) {
        const proceed = window.confirm(
          `${emptyItems.length} item(s) have empty descriptions. Continue saving?`
        );
        if (!proceed) return;
      }

      const completeBillData = {
        ...billData,
        orderNo: orderNo,
        companyInfo,
        savedAt: new Date().toISOString(),
        subtotal: calculateSubtotal(),
        totalCGST: calculateTotalCGST(),
        totalSGST: calculateTotalSGST(),
        total: calculateTotal(),
        amountInWords: amountInWords(calculateTotal()),
        version: "2.0",
        metadata: {
          itemCount: billData.items.length,
          pageCount: pagedRows.length,
          hasManualPages: (billData.manualExtraPages || 0) > 0,
        },
      };

      // call parent handler if provided (app-level save)
      if (onSaveBill) {
        onSaveBill(completeBillData);
      }

      // Generate filename with sanitized bill number
      const sanitizedBillNumber = (billData.billNumber || "invoice")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `bill_${sanitizedBillNumber}_${timestamp}.json`;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(completeBillData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Also save to localStorage as backup
      try {
        const savedBills = JSON.parse(
          localStorage.getItem("saved_bills") || "[]"
        );
        savedBills.unshift({
          id: `bill_${Date.now()}`,
          billNumber: billData.billNumber,
          customerName: billData.customerName,
          date: billData.date,
          total: calculateTotal(),
          savedAt: completeBillData.savedAt,
          filename: filename,
        });
        // Keep only last 50 bills in localStorage
        localStorage.setItem(
          "saved_bills",
          JSON.stringify(savedBills.slice(0, 50))
        );
      } catch (storageErr) {
        console.warn("Could not save to localStorage:", storageErr);
      }

      toast.success(`Bill saved successfully as ${filename}`, {
        duration: 4000,
        icon: "💾",
      });
    } catch (err) {
      console.error("Error saving bill:", err);
      toast.error(`Failed to save bill: ${err.message}`);
    }
  };

  // Helper to render rows for a page using only the page's visible columns
  const renderRowsForPage = (pageRows, pageColumns) => {
    if (!pageRows || pageRows.length === 0) {
      return (
        <tr>
          <td
            colSpan={pageColumns.length}
            className="border border-gray-950 px-2 py-2 text-xs text-center text-black"
          >
            No items found
          </td>
        </tr>
      );
    }
    return pageRows.map((row, rowIdx) => (
      <tr key={row.id || rowIdx}>
        {pageColumns.map((col) => {
          let displayValue = row[col.key] ?? "";
          // If value is array, render all values (one per line)
          if (Array.isArray(displayValue)) {
            return (
              <td
                key={col.key}
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  fontSize: 10,
                  color: "#000",
                  verticalAlign: "top",
                  lineHeight: 1.4,
                  textAlign: col.type === "number" ? "right" : "left",
                  backgroundColor: rowIdx % 2 === 0 ? "#fafafa" : "#ffffff",
                }}
              >
                {displayValue.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: i < displayValue.length - 1 ? 4 : 0,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </td>
            );
          }
          // Special handling for job description to avoid oversized rows: clamp to 3 lines with ellipsis
          if (col.key === "description") {
            return (
              <td
                key={col.key}
                style={{
                  border: "1px solid #000",
                  padding: "6px 8px",
                  fontSize: 10,
                  color: "#000",
                  verticalAlign: "top",
                  lineHeight: 1.4,
                  maxWidth: 420,
                  backgroundColor: rowIdx % 2 === 0 ? "#fafafa" : "#ffffff",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {displayValue}
              </td>
            );
          }

          return (
            <td
              key={col.key}
              style={{
                border: "1px solid #000",
                padding: "6px 8px",
                fontSize: 10,
                color: "#000",
                verticalAlign: "top",
                lineHeight: 1.4,
                textAlign: col.type === "number" ? "right" : "left",
                backgroundColor: rowIdx % 2 === 0 ? "#fafafa" : "#ffffff",
              }}
            >
              {displayValue}
            </td>
          );
        })}
      </tr>
    ));
  };

  const BillContent = ({
    rowsForPage = rows,
    pageIndex = 0,
    totalPages = 1,
  }) => {
    const pageColumns = columns.filter((c) =>
      rowsForPage.some((r) => Object.prototype.hasOwnProperty.call(r, c.key))
    );
    // if no columns detected for this page, fall back to all columns
    const visibleColumns = pageColumns.length > 0 ? pageColumns : columns;
    const isLastPage = pageIndex === totalPages - 1;
    return (
      <div
        className="bg-white"
        style={{
          color: "#000",
          width: "var(--peipl-print-width, 210mm)",
          minHeight: "var(--peipl-print-height, 297mm)",
          margin: "0 auto",
          padding: "10mm",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            border: "2px solid #000",
            padding: "10px",
            marginBottom: "8px",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ textAlign: "center", padding: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
              >
                <img
                  src="./logo.png"
                  alt="Pujari Engineers Logo"
                  width={56}
                  height={56}
                  style={{ borderRadius: 12 }}
                  className="object-contain"
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    margin: 0,
                    color: "#000",
                    letterSpacing: "0.5px",
                  }}
                >
                  PUJARI ENGINEERS INDIA (P) LTD.
                </h1>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL
                  STITCHING
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS
                </p>
              </div>
            </div>

            <div style={{ fontSize: 10, marginTop: 6 }}>
              <p style={{ margin: "2px 0", lineHeight: 1.4 }}>
                <strong style={{ color: "#000" }}>Address:</strong>{" "}
                <span style={{ color: "#333" }}>
                  {companyInfo?.address ||
                    "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701."}
                </span>
              </p>
              <p style={{ margin: "2px 0", lineHeight: 1.4 }}>
                <strong style={{ color: "#000" }}>Mobile:</strong>{" "}
                <span style={{ color: "#333" }}>
                  {companyInfo?.phone || "9820027556"}
                </span>{" "}
                &nbsp; <strong style={{ color: "#000" }}>Email:</strong>{" "}
                <span style={{ color: "#333" }}>
                  {companyInfo?.email || "spujari79@gmail.com"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Meta */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              border: "2px solid #000",
              padding: 10,
              backgroundColor: "#ffffff",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 11,
                color: "#000",
              }}
            >
              To, {billData.customerName || "Customer Name"}
            </p>
            {billData.plantName && (
              <p style={{ margin: "4px 0 0 0" }}>{billData.plantName}</p>
            )}
            <p style={{ margin: "4px 0 0 0" }}>
              {billData.customerAddress || "Customer Address"}
            </p>
            <p style={{ margin: "4px 0 0 0" }}>
              Phone: {billData.customerPhone || "N/A"}
            </p>
            <p style={{ margin: "4px 0 0 0" }}>
              GST: {billData.customerGST || "N/A"}
            </p>
          </div>

          <div
            style={{
              border: "2px solid #000",
              padding: 10,
              fontSize: 10,
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>Invoice No:</strong>
              <span>{billData.billNumber || "PEIPLCH2526/001"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>Date:</strong>
              <span>{formatDate(billData.date) || "N/A"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
                alignItems: "center",
              }}
            >
              <strong>ORDER NO.:</strong>
              <span>{billData.orderNo || "GEMC-511687712601789"}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>JOBSHEET NO:</strong>
              <span>ATTACHED</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>Outline Agreement:</strong>
              <span>4600002141</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>Gem seller ID:</strong>
              <span>RXON210002099996</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <strong>Vendor Code:</strong>
              <span>102237</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>GSTIN:</strong>
              <span>
                {companyInfo?.gst || companyInfo?.gstin || "27AADCP2938G1ZD"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div style={{ overflowX: "auto", marginBottom: 10 }}>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 14,
              background: "#f8f9fa",
              padding: "6px 8px",
              margin: 0,
              border: "2px solid #000",
              borderBottom: "none",
              color: "#000",
            }}
          >
            {tableTitle}{" "}
            {totalPages > 1 ? `— Page ${pageIndex + 1} of ${totalPages}` : ""}
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 10,
              border: "2px solid #000",
              tableLayout: "auto",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#d4d4d8", borderBottom: "2px solid #000" }}>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      ...thStyle,
                      backgroundColor: "#d4d4d8",
                      borderBottom: "2px solid #000",
                      borderRight: "1px solid #666",
                      padding: "8px 6px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#000",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderRowsForPage(rowsForPage, visibleColumns)}</tbody>
          </table>
        </div>

        {/* Footer content - different for last page vs other pages */}
        {isLastPage ? (
          <>
            {/* Totals section only on the last page */}
            <div
              style={{
                marginBottom: 10,
                border: "2px solid #000",
                padding: 12,
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "end",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                    }}
                  >
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#000" }}
                    >
                      Subtotal:
                    </span>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#333" }}
                    >
                      ₹{calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      borderTop: "1px solid #ddd",
                    }}
                  >
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#000" }}
                    >
                      CGST (9%):
                    </span>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#333" }}
                    >
                      ₹{calculateTotalCGST().toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      borderTop: "1px solid #ddd",
                    }}
                  >
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#000" }}
                    >
                      SGST (9%):
                    </span>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: "#333" }}
                    >
                      ₹{calculateTotalSGST().toFixed(2)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #000",
                    minWidth: "200px",
                  }}
                >
                  <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
                    GRAND TOTAL
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#000",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ₹{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in Words & Signature only on the last page */}
            <div
              style={{
                marginBottom: 10,
                border: "2px solid #000",
                padding: 12,
                backgroundColor: "#f8f9fa",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#666",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Amount in Words
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#000",
                  lineHeight: 1.5,
                }}
              >
                {amountInWords(calculateTotal())}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div style={{ flex: 1, padding: 2 }}>
                <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                  BILL IS PAYABLE WITHIN THIRTY DAYS
                </p>
                <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                  ALL PAYMENT TO BE MADE BY A/C PAYEE / DRAFT
                </p>
                <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                  IN FAVOUR OF PUJARI ENGINEERS INDIA (P) LTD.
                </p>
                <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                  GSTIN: 27AADCP2938G1ZD
                </p>
              </div>
              <div
                style={{
                  width: 300,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    For PUJARI ENGINEERS INDIA PVT. LTD.
                  </p>
                  <div style={{ marginTop: 28 }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>
                      SANDEEP. D.PUJARI
                    </p>
                    <p style={{ margin: 0, fontSize: 10 }}>(Director)</p>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "35%",
                    transform: "translate(-50%,-50%)",
                    opacity: 0.75,
                  }}
                >
                  <img
                    src="./stamp.png"
                    alt="Company Stamp"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Simple footer for non-last pages */
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1, padding: 2 }}>
              <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                BILL IS PAYABLE WITHIN THIRTY DAYS
              </p>
              <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                ALL PAYMENT TO BE MADE BY A/C PAYEE / DRAFT
              </p>
              <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                IN FAVOUR OF PUJARI ENGINEERS INDIA (P) LTD.
              </p>
              <p className="text-sm" style={{ margin: 0, fontWeight: 500 }}>
                GSTIN: 27AADCP2938G1ZD
              </p>
            </div>
            <div style={{ width: 80, textAlign: "center", opacity: 0.85 }}>
              {/* small page-level stamp */}
              <img
                src="./stamp.png"
                alt="Stamp"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // (manual extra pages are rendered by the parent loop when needed)

  // small reusable styles
  const thStyle = {
    border: "1px solid #000",
    padding: "8px 6px",
    textAlign: "left",
    fontSize: 10,
    background: "#f8f9fa",
    fontWeight: 700,
    color: "#000",
  };
  const tdStyle = {
    border: "1px solid #000",
    padding: "6px",
    textAlign: "right",
    fontSize: 10,
  };

  // Render
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative border border-gray-900">
          <button
            onClick={onClose}
            className="print:hidden absolute top-4 right-4 z-10 bg-red-600 text-white w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>

          <div className="absolute top-4 left-4 z-10 flex space-x-2">
            <button
              onClick={handleSaveBill}
              className="bg-green-600 text-white px-4 py-2 text-sm font-semibold"
            >
              💾 Save JSON
            </button>
            <button
              onClick={handleExportToPDF}
              disabled={isExporting}
              className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold"
            >
              {isExporting ? "Generating..." : "📄 PDF"}
            </button>
            <button
              onClick={handlePrintBill}
              className="bg-purple-600 text-white px-4 py-2 text-sm font-semibold"
            >
              🖨️ Print
            </button>

            <button
              onClick={onEdit}
              className="bg-gray-600 text-white px-4 py-2 text-sm font-semibold"
            >
              ✏️ Edit
            </button>
          </div>

          <div id="bill-content" className="p-6 pt-16">
            {pagedRows.map((pageRows, pageIndex) => (
              <div
                  key={`page-${pageIndex}`}
                  style={{
                    width: "var(--peipl-print-width, 210mm)",
                    minHeight: "var(--peipl-print-height, 297mm)",
                    margin: "0 auto 20px auto",
                    pageBreakAfter: "always",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                <BillContent
                  rowsForPage={pageRows}
                  pageIndex={pageIndex}
                  totalPages={
                    pagedRows.length + (billData.manualExtraPages || 0)
                  }
                />
              </div>
            ))}
            {Array.from({ length: billData.manualExtraPages || 0 }).map(
              (_, i) => (
                <div
                  key={`manual-${i}`}
                  style={{
                      width: "var(--peipl-print-width, 210mm)",
                      minHeight: "var(--peipl-print-height, 297mm)",
                      margin: "0 auto 20px auto",
                      pageBreakAfter: "always",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                  <div
                    style={{
                      border: "1px solid #000",
                      padding: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ textAlign: "center", padding: 8 }}>
                      <h3 style={{ margin: 0, fontWeight: 700 }}>
                        {tableTitle} — Page {pagedRows.length + i + 1}
                      </h3>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
