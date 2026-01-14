/**
 * Utility functions for Gem portal bill upload
 */

import { exportToPDF } from "./pdfGenerator";
import toast from "react-hot-toast";

/**
 * Generate PDF and save to temp directory for Gem upload
 */
export async function generatePDFForGem(billElementId, billNumber) {
  const toastId = toast.loading("Generating PDF for Gem upload...");
  
  try {
    // Get temp directory path via Electron IPC
    let tempDir = null;
    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.getTempDir) {
      tempDir = await window.electronAPI.getTempDir();
    } else if (typeof window !== "undefined" && window.electronAPI) {
      // Fallback: use default temp directory name
      tempDir = "temp-peipl-bills";
    }

    // Generate PDF with save path
    const setIsExporting = { savePath: tempDir };
    const pdfPath = await exportToPDF(billElementId, billNumber, setIsExporting);
    
    if (!pdfPath && tempDir) {
      throw new Error("Failed to save PDF");
    }
    
    toast.dismiss(toastId);
    return pdfPath;
  } catch (error) {
    console.error("Error generating PDF for Gem:", error);
    toast.error("Failed to generate PDF for Gem upload", { id: toastId });
    throw error;
  }
}

/**
 * Trigger Gem upload automation script.
 * meta can include: { invoiceNo, subtotal, grandTotal, gstin }
 */
export async function uploadToGem(meta) {
  const toastId = toast.loading("Starting Gem upload automation...");
  
  try {
    if (typeof window !== "undefined" && window.electronAPI) {
      // Electron environment - use IPC to run script
      if (window.electronAPI.uploadToGem) {
        const result = await window.electronAPI.uploadToGem(meta || null);
        if (result.success) {
          toast.success("Gem upload automation started!", { id: toastId });
          return result;
        } else {
          throw new Error(result.error || "Failed to start Gem upload");
        }
      } else {
        // Fallback: use child_process via IPC
        throw new Error("Gem upload API not available. Please update Electron preload.");
      }
    } else {
      // Web environment - show instructions
      toast.error("Gem upload is only available in Electron app", { id: toastId });
      throw new Error("Gem upload requires Electron environment");
    }
  } catch (error) {
    console.error("Error starting Gem upload:", error);
    toast.error(`Failed to start Gem upload: ${error.message}`, { id: toastId });
    throw error;
  }
}

/**
 * Combined function: Generate PDF and upload to Gem
 */
export async function generateAndUploadToGem(billElementId, billNumber, meta) {
  try {
    // Step 1: Generate PDF
    const pdfPath = await generatePDFForGem(billElementId, billNumber);
    
    if (!pdfPath) {
      throw new Error("PDF generation failed");
    }
    
    // Step 2: Upload to Gem with metadata
    const uploadMeta = meta || {};
    await uploadToGem({ ...uploadMeta, pdfPath });
    
    return { success: true, pdfPath };
  } catch (error) {
    console.error("Error in generateAndUploadToGem:", error);
    throw error;
  }
}

