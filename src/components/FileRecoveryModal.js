"use client";

import { useState } from "react";

export default function FileRecoveryModal({
  isVisible,
  onAccept,
  onReject,
  corruptedData,
  recoveredData,
  filePath,
}) {
  if (!isVisible) return null;

  const [showCorrupted, setShowCorrupted] = useState(false);
  const [showRecovered, setShowRecovered] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-orange-200 pb-4">
            <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
              <span className="text-3xl">🔧</span>
              File Recovery Mode
            </h2>
            <button
              onClick={onReject}
              className="text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Alert */}
          <div className="bg-orange-50 border-l-4 border-orange-500 rounded p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">
              ⚠️ File Corruption Detected
            </h3>
            <p className="text-orange-800 text-sm">
              The file{" "}
              <strong>
                {filePath?.split(/[/\\]/).pop() || "Unknown file"}
              </strong>{" "}
              appears to be corrupted. We've attempted to recover the data
              automatically. Please review the recovered data below before
              accepting or rejecting it.
            </p>
          </div>

          {/* Data Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Corrupted Data */}
            <div className="border border-red-200 rounded-lg">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center justify-between">
                <h4 className="font-semibold text-red-800">Corrupted Data</h4>
                <button
                  onClick={() => setShowCorrupted(!showCorrupted)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  {showCorrupted ? "Hide" : "Show"}
                </button>
              </div>
              {showCorrupted && (
                <div className="p-4">
                  <pre className="text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                    {typeof corruptedData === "string"
                      ? corruptedData
                      : JSON.stringify(corruptedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Recovered Data */}
            <div className="border border-green-200 rounded-lg">
              <div className="bg-green-50 px-4 py-2 border-b border-green-200 flex items-center justify-between">
                <h4 className="font-semibold text-green-800">Recovered Data</h4>
                <button
                  onClick={() => setShowRecovered(!showRecovered)}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  {showRecovered ? "Hide" : "Show"}
                </button>
              </div>
              {showRecovered && (
                <div className="p-4">
                  <pre className="text-xs text-green-600 bg-green-50 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(recoveredData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Recovered Data Summary */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">
              📋 Recovery Summary
            </h4>
            <div className="text-blue-800 text-sm space-y-1">
              <div>
                • Bill Number:{" "}
                <strong>{recoveredData?.billNumber || "Unknown"}</strong>
              </div>
              <div>
                • Items Count:{" "}
                <strong>{recoveredData?.items?.length || 0}</strong>
              </div>
              <div>
                • Customer:{" "}
                <strong>
                  {recoveredData?.customerName || "Not specified"}
                </strong>
              </div>
              <div>
                • Date:{" "}
                <strong>{recoveredData?.date || "Not specified"}</strong>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onReject}
              className="px-6 py-2 text-gray-700 hover:text-white hover:bg-red-500 font-semibold rounded-xl shadow bg-gray-100 transition-all duration-200"
            >
              Reject Recovery
            </button>
            <button
              onClick={onAccept}
              className="px-6 py-2 text-white bg-green-500 hover:bg-green-600 font-semibold rounded-xl shadow transition-all duration-200 flex items-center gap-2"
            >
              <span>✓</span>
              Accept & Save
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="font-semibold text-gray-700 mb-2">Instructions:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Review the recovered data to ensure it's correct</li>
              <li>
                • Click "Accept & Save" to save the recovered data and create a
                backup of the corrupted file
              </li>
              <li>
                • Click "Reject Recovery" to discard the recovered data and
                close the file
              </li>
              <li>
                • A backup of the corrupted file will be saved with a .corrupted
                timestamp extension
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
