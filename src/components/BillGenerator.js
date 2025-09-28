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
          const scopeArrays = {};
          columns.forEach((c) => {
            scopeArrays[c.key] = FormulaUtils.normalizeToArray(r[c.key]);
          });
          const maxLen = Math.max(
            ...Object.values(scopeArrays).map((a) => a.length),
            1
          );
          const compiled = compiledFormulas[col.key] || math.compile(col.formula);
          const results = [];
          for (let i = 0; i < maxLen; i++) {
            const scope = {};
            columns.forEach((c) => {
              const arr = scopeArrays[c.key];
              let v = arr[i] !== undefined ? arr[i] : arr.length ? arr[0] : 0;
              if (v === "" || v == null) v = 0;
              v = Number(v);
              scope[c.key] = isNaN(v) ? 0 : v;
            });
            const val = compiled.evaluate(scope);
            results.push(typeof val === "number" ? Number(val.toFixed(2)) : val);
          }
          r[col.key] = results.length === 1 ? results[0] : results;
        } catch (err) {
          r[col.key] = "Err";
        }
      }
    });
    return r;
  },
};
// --- End Formula Calculation Logic ---
import { create, all } from "mathjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";


// --- End Formula Calculation Logic ---

export default function BillGenerator({
  billData,
  companyInfo,
  isVisible,
  onClose,
  onEdit,
  onSaveBill,
}) {
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
  const compiledFormulas = useMemo(() => FormulaUtils.compileFormulas(columns), [columns]);
  const rows = useMemo(() => {
    return (billData.items || []).map((item, idx) => {
      const withSr = {
        ...item,
        srNoDate:
          item.srNoDate !== undefined
            ? item.srNoDate
            : `${idx + 1}${item.dates && item.dates[0] ? " / " + item.dates[0] : ""}`,
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
  const exportToPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading("Generating PDF...");
    let loadingDiv = null;
    try {
      const billElement = document.getElementById("bill-content");
      if (!billElement) {
        toast.error("Bill content not found", { id: toastId });
        setIsExporting(false);
        return;
      }

      // Optional visual loading overlay (ensures user sees something)
      loadingDiv = document.createElement("div");
      loadingDiv.style.position = "fixed";
      loadingDiv.style.top = "0";
      loadingDiv.style.left = "0";
      loadingDiv.style.right = "0";
      loadingDiv.style.bottom = "0";
      loadingDiv.style.display = "flex";
      loadingDiv.style.alignItems = "center";
      loadingDiv.style.justifyContent = "center";
      loadingDiv.style.background = "rgba(255,255,255,0.8)";
      loadingDiv.style.zIndex = "9999";
      loadingDiv.innerHTML = `<div style="text-align:center; font-weight:600; color:#111">Preparing PDF...</div>`;
      document.body.appendChild(loadingDiv);

      // make sure layout is stable
      await new Promise((r) => setTimeout(r, 120));

      // Render bill to canvas
      const canvas = await html2canvas(billElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Prepare jsPDF dimensions
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidthMM = 210;
      const pageHeightMM = 297;

      // convert canvas to image data
      const imgData = canvas.toDataURL("image/png");

      // calculate image dimensions in mm, preserving aspect ratio
      const pxPerMm = canvas.width / pageWidthMM; // px per mm based on width fit
      const imgHeightMM = canvas.height / pxPerMm;

      if (imgHeightMM <= pageHeightMM) {
        // single page, center vertically
        const scaledHeight = imgHeightMM;
        const scaledWidth = pageWidthMM;
        const x = 0;
        const y = (pageHeightMM - scaledHeight) / 2;
        pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
      } else {
        // multi-page: slice canvas by pageHeightPx
        const pageHeightPx = Math.floor(pxPerMm * pageHeightMM); // how many pixels per A4 page
        let yPos = 0;
        while (yPos < canvas.height) {
          // create a temporary canvas to hold the slice
          const sliceHeight = Math.min(pageHeightPx, canvas.height - yPos);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext("2d");
          // copy slice from original canvas
          ctx.drawImage(
            canvas,
            0,
            yPos,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceHeightMM = sliceHeight / pxPerMm;

          if (yPos > 0) pdf.addPage();
          pdf.addImage(sliceData, "PNG", 0, 0, pageWidthMM, sliceHeightMM);
          yPos += sliceHeight;
        }
      }

      const filename = `bill_${billData.billNumber || "invoice"}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      pdf.save(filename);
      toast.success("PDF generated", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(
        "Error generating PDF. Try simpler styles or remove gradients.",
        { id: toastId }
      );
    } finally {
      setIsExporting(false);
      if (loadingDiv && loadingDiv.parentNode)
        loadingDiv.parentNode.removeChild(loadingDiv);
    }
  };

  // Print preview flow (opens print dialog)
  const printBill = () => {
    setIsPrintPreview(true);
    // give the browser a moment to apply print CSS
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleSaveBill = () => {
    try {
      const completeBillData = {
        ...billData,
        companyInfo,
        savedAt: new Date().toISOString(),
        subtotal: calculateSubtotal(),
        totalCGST: calculateTotalCGST(),
        totalSGST: calculateTotalSGST(),
        total: calculateTotal(),
        amountInWords: amountInWords(calculateTotal()),
      };

      // call parent handler if provided (app-level save)
      if (onSaveBill) onSaveBill(completeBillData);

      // also trigger download JSON as convenience
      const blob = new Blob([JSON.stringify(completeBillData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill_${billData.billNumber || "invoice"}_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Bill saved");
    } catch (err) {
      console.error(err);
      toast.error("Error saving bill");
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
                className="border border-gray-950 px-2 py-2 text-xs text-black break-words"
              >
                {displayValue.map((v, i) => (
                  <div key={i}>{v}</div>
                ))}
              </td>
            );
          }
          return (
            <td
              key={col.key}
              className="border border-gray-950 px-2 py-2 text-xs text-black break-words"
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
          width: "200mm",
          minHeight: "280mm",
          margin: "0 auto",
          padding: "12mm",
        }}
      >
        {/* Header */}
        <div
          style={{
            border: "1px solid #000",
            padding: "8px",
            marginBottom: "12px",
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
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  PUJARI ENGINEERS INDIA (P) LTD.
                </h1>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                  ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL
                  STITCHING
                </p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600 }}>
                  SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS
                </p>
              </div>
            </div>

            <div style={{ fontSize: 10 }}>
              <p style={{ margin: 2 }}>
                <strong>Address:</strong>{" "}
                {companyInfo?.address ||
                  "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701."}
              </p>
              <p style={{ margin: 2 }}>
                <strong>Mobile:</strong> {companyInfo?.phone || "9820027556"}{" "}
                &nbsp; <strong>Email:</strong>{" "}
                {companyInfo?.email || "spujari79@gmail.com"}
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
          <div style={{ border: "1px solid #000", padding: 8 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
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

          <div style={{ border: "1px solid #000", padding: 8, fontSize: 10 }}>
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
              <span>GEMC-511687712601789</span>
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
        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <h3
            style={{
              fontWeight: 700,
              fontSize: 16,
              background: "#f3f4f6",
              padding: 4,
            }}
          >
            {tableTitle}{" "}
            {totalPages > 1 ? `— Page ${pageIndex + 1} of ${totalPages}` : ""}
          </h3>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}
          >
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key} style={thStyle}>
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
              style={{ marginBottom: 12, border: "1px solid #000", padding: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                    Subtotal: ₹{calculateSubtotal().toFixed(2)}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                    CGST (9%): ₹{calculateTotalCGST().toFixed(2)}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                    SGST (9%): ₹{calculateTotalSGST().toFixed(2)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      borderTop: "2px solid #000",
                      paddingTop: 4,
                    }}
                  >
                    Total: ₹{calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount in Words & Signature only on the last page */}
            <div
              style={{ marginBottom: 12, border: "1px solid #000", padding: 8 }}
            >
              <strong>Amount in Words: </strong>
              <span style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                {amountInWords(calculateTotal())}
              </span>
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
    padding: "6px",
    textAlign: "left",
    fontSize: 10,
    background: "#fff",
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
      {isPrintPreview ? (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto print:overflow-visible">
          <button
            onClick={() => setIsPrintPreview(false)}
            className="print:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white px-3 py-2 text-sm font-semibold"
          >
            ← Back
          </button>
          <div id="bill-content" className="p-4 print:p-0 print:m-0">
            {/* Render each page for print preview */}
            {pagedRows.map((pageRows, pageIndex) => (
              <div
                key={`pp-${pageIndex}`}
                style={{
                  width: "200mm",
                  minHeight: "280mm",
                  margin: "0 auto",
                  pageBreakAfter: "always",
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
            {/* manual extra pages */}
            {Array.from({ length: billData.manualExtraPages || 0 }).map(
              (_, i) => (
                <div
                  key={`pp-manual-${i}`}
                  style={{
                    width: "200mm",
                    minHeight: "280mm",
                    margin: "0 auto",
                    pageBreakAfter: "always",
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
          <style jsx>{`
            @media print {
              body {
                margin: 0;
              }
              #bill-content {
                width: 200mm !important;
                min-height: 287mm !important;
              }
            }e
          `}</style>
        </div>
      ) : (
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
                onClick={exportToPDF}
                disabled={isExporting}
                className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold"
              >
                {isExporting ? "Generating..." : "📄 PDF"}
              </button>
              <button
                onClick={printBill}
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
                    width: "200mm",
                    minHeight: "280mm",
                    margin: "0 auto",
                    pageBreakAfter: "always",
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
                      width: "200mm",
                      minHeight: "280mm",
                      margin: "0 auto",
                      pageBreakAfter: "always",
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
      )}
    </>
  );
}
