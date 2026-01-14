import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

export const exportToPDF = async (
  billElementId,
  billNumber,
  setIsExporting,
) => {
  const toastId = toast.loading("Generating PDF...");
  let loadingDiv = null;

  try {
    const billElement = document.getElementById(billElementId);
    if (!billElement) {
      toast.error("Bill content not found", { id: toastId });
      return;
    }

    // Optional visual loading overlay
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

    // Determine desired print width (try CSS var --peipl-print-width, then element width, fallback to 210mm)
    let printWidth = "210mm";
    try {
      const cs = window.getComputedStyle(billElement);
      const varWidth = cs.getPropertyValue("--peipl-print-width").trim();
      if (varWidth) printWidth = varWidth;
      else if (billElement.style && billElement.style.width) printWidth = billElement.style.width;
    } catch (e) {
      // ignore and use default
    }

    // Convert mm to px for windowWidth (approx: 1mm = 3.7795275591 px at 96dpi)
    const mmToPx = (mm) => Math.round(parseFloat(mm) * 3.7795275591 || 0);
    const widthMm = /([0-9.]+)mm/.test(printWidth) ? parseFloat(printWidth) : 210;
    const windowWidthPx = mmToPx(widthMm) || 1200;
    const windowHeightPx = Math.max(1600, Math.round(windowWidthPx * 1.4));

    // Render bill to canvas with improved quality but reasonable size
    const canvas = await html2canvas(billElement, {
      scale: 2, // Lower scale for smaller file size while keeping decent quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: windowWidthPx,
      windowHeight: windowHeightPx,
      onclone: (clonedDoc) => {
        // Ensure all styles are applied in cloned document and set desired width
        const clonedElement = clonedDoc.getElementById(billElementId);
        if (clonedElement) {
          clonedElement.style.transform = "scale(1)";
          clonedElement.style.width = printWidth;
        }
      },
    });

    // Prepare jsPDF dimensions
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidthMM = 210;
    const pageHeightMM = 297;

    // convert canvas to compressed JPEG image data for smaller PDFs
    const imgData = canvas.toDataURL("image/jpeg", 0.8);

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
          sliceHeight,
        );
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.8);
        const sliceHeightMM = sliceHeight / pxPerMm;

        if (yPos > 0) pdf.addPage();
        pdf.addImage(sliceData, "JPEG", 0, 0, pageWidthMM, sliceHeightMM);
        yPos += sliceHeight;
        // Cleanup canvas context to prevent memory leak
        ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      }
    }

    // Sanitize bill number for use in filenames (remove path‑breaking characters)
    const rawBillNumber = billNumber || "invoice";
    const safeBillNumber = String(rawBillNumber).replace(/[\\\/:*?"<>|]/g, "_");

    const filename = `bill_${safeBillNumber}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    // If savePath is provided, save to that location (for Gem upload)
    if (
      setIsExporting &&
      typeof setIsExporting === "object" &&
      setIsExporting.savePath
    ) {
      try {
        const pdfBlob = pdf.output("blob");
        const arrayBuffer = await pdfBlob.arrayBuffer();

        // Convert ArrayBuffer to base64 for IPC transfer (chunked to avoid call stack issues)
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 0x8000; // 32k
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);

        // Use Electron IPC to save file
        if (
          typeof window !== "undefined" &&
          window.electronAPI &&
          window.electronAPI.savePDFFile
        ) {
          const fullPath = await window.electronAPI.savePDFFile(
            setIsExporting.savePath,
            filename,
            base64,
          );
          toast.success("PDF saved for Gem upload", { id: toastId });
          return fullPath;
        } else {
          // Fallback to download
          pdf.save(filename);
          toast.success("PDF generated", { id: toastId });
          return null;
        }
      } catch (error) {
        console.error("Error saving PDF:", error);
        // Fallback to download
        pdf.save(filename);
        toast.success("PDF generated", { id: toastId });
        return null;
      }
    }

    pdf.save(filename);
    toast.success("PDF generated", { id: toastId });
    return null;
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error(
      "Error generating PDF. Try simpler styles or remove gradients.",
      { id: toastId },
    );
  } finally {
    if (typeof setIsExporting === "function") setIsExporting(false);
    if (loadingDiv && loadingDiv.parentNode)
      loadingDiv.parentNode.removeChild(loadingDiv);
  }
};

export const printBill = async (billElementId, billNumber) => {
  const toastId = toast.loading("Preparing document for print...");
  let loadingDiv = null;
  try {
    const printContent = document.getElementById(billElementId);
    if (!printContent) {
      toast.error("Bill content not found", { id: toastId });
      return;
    }

    // Optional visual loading overlay
    loadingDiv = document.createElement("div");
    loadingDiv.style.position = "fixed";
    loadingDiv.style.top = "0";
    loadingDiv.style.left = "0";
    loadingDiv.style.right = "0";
    loadingDiv.style.bottom = "0";
    loadingDiv.style.display = "flex";
    loadingDiv.style.alignItems = "center";
    loadingDiv.style.justifyContent = "center";
    loadingDiv.style.background = "rgba(255,255,255,0.85)";
    loadingDiv.style.zIndex = "9999";
    loadingDiv.innerHTML = `<div style="text-align:center; font-weight:600; color:#111">Preparing printable PDF...</div>`;
    document.body.appendChild(loadingDiv);

    // small delay to stabilize layout
    await new Promise((r) => setTimeout(r, 120));

    // Determine desired print width (reuse same logic as exportToPDF)
    let printWidth = "210mm";
    try {
      const cs = window.getComputedStyle(printContent);
      const varWidth = cs.getPropertyValue("--peipl-print-width").trim();
      if (varWidth) printWidth = varWidth;
      else if (printContent.style && printContent.style.width) printWidth = printContent.style.width;
    } catch (e) {
      // ignore
    }

    // Convert mm to px for windowWidth (approx: 1mm = 3.7795275591 px at 96dpi)
    const mmToPx = (mm) => Math.round(parseFloat(mm) * 3.7795275591 || 0);
    const widthMm = /([0-9.]+)mm/.test(printWidth) ? parseFloat(printWidth) : 210;
    const windowWidthPx = mmToPx(widthMm) || 1200;
    const windowHeightPx = Math.max(1600, Math.round(windowWidthPx * 1.4));

    const canvas = await html2canvas(printContent, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: windowWidthPx,
      windowHeight: windowHeightPx,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(billElementId);
        if (clonedElement) clonedElement.style.width = printWidth;
      },
    });

    // Build PDF with same pagination logic as exportToPDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidthMM = 210;
    const pageHeightMM = 297;

    const imgData = canvas.toDataURL("image/png");
    const pxPerMm = canvas.width / pageWidthMM;
    const imgHeightMM = canvas.height / pxPerMm;

    if (imgHeightMM <= pageHeightMM) {
      const scaledHeight = imgHeightMM;
      const scaledWidth = pageWidthMM;
      const x = 0;
      const y = (pageHeightMM - scaledHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
    } else {
      const pageHeightPx = Math.floor(pxPerMm * pageHeightMM);
      let yPos = 0;
      while (yPos < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - yPos);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, yPos, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceHeightMM = sliceHeight / pxPerMm;
        if (yPos > 0) pdf.addPage();
        pdf.addImage(sliceData, "PNG", 0, 0, pageWidthMM, sliceHeightMM);
        yPos += sliceHeight;
        // Cleanup canvas context to prevent memory leak
        ctx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      }
    }

    // Create a temporary Blob and open in new window for printing
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    // Try opening the blob URL in a new window. Some browsers render PDFs directly.
    const win = window.open(url, "_blank");
    if (win) {
      // If opened, wait a short moment and trigger print on the new window
      const tryPrint = () => {
        try {
          win.focus();
          // Some browsers allow calling print on the opened window
          if (typeof win.print === "function") win.print();
        } catch (e) {
          // ignore
        }
        // Revoke after a delay to ensure printing started
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      };
      // Delay to allow the PDF to load
      setTimeout(tryPrint, 500);
      toast.success("Print dialog opened", { id: toastId });
    } else {
      // Fallback: create hidden iframe and print from it
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "0";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          // ignore
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 30000);
      };
      toast.success("Print dialog opened", { id: toastId });
    }
  } catch (err) {
    console.error("Error preparing print PDF:", err);
    toast.error("Failed to prepare printable PDF", { id: toastId });
  } finally {
    if (loadingDiv && loadingDiv.parentNode) loadingDiv.parentNode.removeChild(loadingDiv);
  }
};
