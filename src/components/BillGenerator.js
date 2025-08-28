import Image from "next/image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";
import toast from "react-hot-toast";

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

  if (!isVisible || !billData) return null;

  const calculateSubtotal = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
  };

  const calculateTotalCGST = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce(
      (sum, item) => sum + (parseFloat(item.cgstAmount) || 0),
      0
    );
  };

  const calculateTotalSGST = () => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce(
      (sum, item) => sum + (parseFloat(item.sgstAmount) || 0),
      0
    );
  };

  const calculateTotal = () =>
    calculateSubtotal() + calculateTotalCGST() + calculateTotalSGST();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // number-to-words (supports up to crores; built for rupees, lakhs)
  const numberToWords = (num) => {
    if (num === 0) return "Zero";
    if (num < 0) return "Negative " + numberToWords(Math.abs(num));

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

  const exportToJSON = () => {
    try {
      const payload = {
        ...billData,
        companyInfo,
        exportDate: new Date().toISOString(),
        subtotal: calculateSubtotal(),
        totalCGST: calculateTotalCGST(),
        totalSGST: calculateTotalSGST(),
        total: calculateTotal(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill_${billData.billNumber || "invoice"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON exported");
    } catch (err) {
      console.error(err);
      toast.error("Error exporting JSON");
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = [
        [
          "Invoice No",
          "Date",
          "Customer Name",
          "Customer Address",
          "Phone",
          "GST",
        ],
        [
          billData.billNumber || "",
          billData.date || "",
          billData.customerName || "",
          billData.customerAddress || "",
          billData.customerPhone || "",
          billData.customerGST || "",
        ],
        [],
        [
          "Sr No",
          "Description",
          "SAC/HSN",
          "Qty",
          "Rate",
          "Amount",
          "CGST",
          "SGST",
          "Total",
        ],
        ...(billData.items || []).map((item, idx) => [
          idx + 1,
          item.description || "",
          item.sacHsn || "",
          item.quantity || 0,
          item.rate || 0,
          item.amount || 0,
          item.cgstAmount || 0,
          item.sgstAmount || 0,
          item.totalWithGST || 0,
        ]),
        [],
        ["Subtotal", calculateSubtotal()],
        ["Total CGST", calculateTotalCGST()],
        ["Total SGST", calculateTotalSGST()],
        ["Grand Total", calculateTotal()],
      ];
      const csv = csvData
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill_${billData.billNumber || "invoice"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      console.error(err);
      toast.error("Error exporting CSV");
    }
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

  const renderItems = () => {
    if (
      !billData.items ||
      !Array.isArray(billData.items) ||
      billData.items.length === 0
    ) {
      return (
        <tr>
          <td
            colSpan="10"
            className="border border-gray-950 px-2 py-2 text-xs text-center text-black"
          >
            No items found
          </td>
        </tr>
      );
    }

    return billData.items.map((item, index) => (
      <tr key={item.id || index}>
        <td className="border border-gray-950 px-2 py-2 text-xs text-black break-words">
          {(item.dates || [billData.date]).map((date, idx) => (
            <div key={idx} className="mb-1 last:mb-0">
              <strong>{String(index + 1).padStart(2, "0")})</strong>
              <br />
              {formatDate(date)}
            </div>
          ))}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-black break-words">
          {Array.isArray(item.refNo)
            ? item.refNo.filter(Boolean).join(", ") || "N/A"
            : item.refNo || "N/A"}
        </td>
        <td
          className="border border-gray-950 px-2 py-2 text-xs text-black break-words leading-relaxed"
          style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
        >
          {item.description || "N/A"}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-black break-words">
          {item.sacHsn || "N/A"}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-center text-black">
          {item.quantity || 0}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-right text-black">
          ₹{(parseFloat(item.rate) || 0).toFixed(2)}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-right text-black">
          ₹{(parseFloat(item.amount) || 0).toFixed(2)}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-right text-black">
          ₹{(parseFloat(item.cgstAmount) || 0).toFixed(2)}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-right text-black">
          ₹{(parseFloat(item.sgstAmount) || 0).toFixed(2)}
        </td>
        <td className="border border-gray-950 px-2 py-2 text-xs text-right font-bold text-black">
          ₹{(parseFloat(item.totalWithGST) || 0).toFixed(2)}
        </td>
      </tr>
    ));
  };

  const BillContent = () => (
    <div
      id="bill-content"
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
            <div style={{ width: 64, height: 64, position: "relative" }}>
              <img
                src="./logo.png"
                alt="Pujari Engineers Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                PUJARI ENGINEERS INDIA (P) LTD.
              </h1>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING
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
            <span>{companyInfo?.gstin || "27AADCP2938G1ZD"}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ overflowX: "auto", marginBottom: 12 }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Sr. No & Date</th>
              <th style={thStyle}>Ref No.</th>
              <th style={thStyle}>Job Description</th>
              <th style={thStyle}>SAC/HSN</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Rate (₹)</th>
              <th style={thStyle}>Taxable Value (₹)</th>
              <th style={thStyle}>CGST (9%)</th>
              <th style={thStyle}>SGST (9%)</th>
              <th style={thStyle}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {renderItems()}
            <tr style={{ fontWeight: 700, background: "#f3f4f6" }}>
              <td style={{ ...tdStyle, textAlign: "center" }} colSpan={6}>
                TOTAL
              </td>
              <td style={tdStyle}>₹{calculateSubtotal().toFixed(2)}</td>
              <td style={tdStyle}>₹{calculateTotalCGST().toFixed(2)}</td>
              <td style={tdStyle}>₹{calculateTotalSGST().toFixed(2)}</td>
              <td style={tdStyle}>₹{calculateTotal().toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div style={{ marginBottom: 12, border: "1px solid #000", padding: 8 }}>
        <p style={{ margin: 0 }}>
          <strong>Amount in Words: </strong>
          <h3 className="font-bold">{amountInWords(calculateTotal())}</h3>
        </p>
      </div>

      {/* Payment / Sign */}
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 24 }}
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
          {/* <p style={{ margin: 0, fontWeight: 500 }}>I.T PAN NO. AADCP2938G</p> */}
        </div>
        <div style={{ width: 300, textAlign: "center", position: "relative" }}>
          <div style={{ marginBottom: 8 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>
              For PUJARI ENGINEERS INDIA PVT. LTD.
            </p>
            <div style={{ marginTop: 28 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>SANDEEP. D.PUJARI</p>
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
    </div>
  );

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
          <div className="p-4 print:p-0 print:m-0">
            <div
              style={{ width: "200mm", minHeight: "280mm", margin: "0 auto" }}
            >
              <BillContent />
            </div>
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
            }
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
                onClick={exportToCSV}
                className="bg-orange-600 text-white px-4 py-2 text-sm font-semibold"
              >
                📊 CSV
              </button>
              <button
                onClick={onEdit}
                className="bg-gray-600 text-white px-4 py-2 text-sm font-semibold"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="p-6 pt-16">
              <div
                style={{ width: "200mm", minHeight: "280mm", margin: "0 auto" }}
              >
                <BillContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
