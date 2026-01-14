import { useState } from "react";
import toast from "react-hot-toast";

export default function AIMetadataExtractor({ filePath, onExtract }) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const extractMetadata = async () => {
    if (!window.electronAPI) {
      toast.error("This feature is only available in the desktop app");
      return;
    }

    setIsExtracting(true);
    try {
      // Simulate AI extraction - in real implementation, this would call an AI service
      const result = await window.electronAPI.extractMetadata(filePath);
      
      if (result.success) {
        setExtractedData(result.metadata);
        onExtract(result.metadata);
        toast.success("Metadata extracted successfully!");
      } else {
        toast.error("Failed to extract metadata");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Error during metadata extraction");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">AI Metadata Extractor</h4>
        <button
          onClick={extractMetadata}
          disabled={isExtracting}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50"
        >
          {isExtracting ? "Extracting..." : "Extract"}
        </button>
      </div>
      
      {extractedData && (
        <div className="text-xs space-y-1">
          <div><span className="font-medium">Invoice #:</span> {extractedData.invoiceNumber || "N/A"}</div>
          <div><span className="font-medium">Amount:</span> {extractedData.amount || "N/A"}</div>
          <div><span className="font-medium">Date:</span> {extractedData.date || "N/A"}</div>
          <div><span className="font-medium">Vendor:</span> {extractedData.vendor || "N/A"}</div>
        </div>
      )}
    </div>
  );
}
