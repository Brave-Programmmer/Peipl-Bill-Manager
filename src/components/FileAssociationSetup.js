"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function FileAssociationSetup({ isVisible, onClose }) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState("idle"); // idle, success, error

  // Detect if running in Electron
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const setupFileAssociations = async () => {
    setIsSettingUp(true);
    setSetupStatus("idle");
    try {
      if (
        isElectron &&
        typeof window.electronAPI.setupFileAssociations === "function"
      ) {
        const result = await window.electronAPI.setupFileAssociations();
        if (result && result.success) {
          setSetupStatus("success");
          toast.success(
            "✅ File associations set up successfully! You can now open JSON bill files directly.",
            {
              duration: 5000,
              icon: "📄",
            },
          );
          // Auto-close after success
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setSetupStatus("error");
          toast.error(
            `Failed to set up file associations: ${result?.error || "Unknown error"}`,
            {
              duration: 5000,
            },
          );
        }
      } else if (isElectron) {
        setSetupStatus("error");
        toast.error(
          "Electron API is missing setupFileAssociations method. Please try manual setup.",
        );
      } else {
        setSetupStatus("error");
        toast(
          "Manual setup required. This feature is only available in the desktop app.",
          { icon: "ℹ️" },
        );
      }
    } catch (error) {
      console.error("Error setting up file associations:", error);
      setSetupStatus("error");
      toast.error(
        "Error setting up file associations. Please try manual setup.",
        {
          duration: 5000,
        },
      );
    } finally {
      setIsSettingUp(false);
    }
  };

  const openFileAssociationSettings = () => {
    if (
      isElectron &&
      typeof window.electronAPI.openFileAssociationSettings === "function"
    ) {
      window.electronAPI.openFileAssociationSettings();
    } else if (isElectron) {
      toast.error(
        "Electron API is missing openFileAssociationSettings method.",
      );
    } else {
      toast(
        "Right-click a JSON file, choose 'Open with', then select PEIPL Bill Maker and set as default.",
        { icon: "📝" },
      );
    }
  };

  return (
    <>
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
            <div className="p-8 sm:p-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
                  <span className="inline-block align-middle mr-3 text-3xl">
                    📄
                  </span>
                  File Associations Setup
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full w-10 h-10 flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    💡 Quick Start
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Double-click JSON bill files to open them directly in PEIPL
                    Bill Maker. Set this up once and you're all set!
                  </p>
                </div>

                {/* Automatic Setup */}
                <div className="border border-gray-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    Automatic Setup (Recommended)
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    One-click setup to configure your system for JSON files.
                  </p>
                  <button
                    onClick={setupFileAssociations}
                    disabled={isSettingUp || !isElectron}
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      setupStatus === "success"
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-md"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
                    } ${isSettingUp || !isElectron ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-disabled={isSettingUp || !isElectron}
                  >
                    {isSettingUp
                      ? <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Setting up...</span>
                        </>
                      : setupStatus === "success"
                        ? <>
                            <span className="text-xl">✓</span>
                            <span>Setup Complete!</span>
                          </>
                        : <>
                            <span>✓</span>
                            <span>Set Up Automatically</span>
                            {!isElectron && (
                              <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                                Desktop Only
                              </span>
                            )}
                          </>}
                  </button>
                  {!isElectron && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      This feature requires the desktop app.
                    </p>
                  )}
                  {setupStatus === "success" && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-sm text-green-800 m-0 flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        You can now double-click JSON bill files to open them
                        directly in PEIPL Bill Maker!
                      </p>
                    </div>
                  )}
                </div>

                {/* Manual Setup */}
                <div className="border border-gray-300 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    Manual Setup
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Follow these simple steps if automatic setup doesn't work.
                  </p>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-3 items-start">
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        1
                      </span>
                      <span>
                        Right-click any .json file in Windows File Explorer
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        2
                      </span>
                      <span>
                        Select <strong>Open with</strong> →{" "}
                        <strong>Choose another app</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        3
                      </span>
                      <span>
                        Find and click <strong>PEIPL Bill Maker</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        4
                      </span>
                      <span>
                        Check{" "}
                        <strong>Always use this app to open .json files</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="font-bold text-blue-600 flex-shrink-0">
                        5
                      </span>
                      <span>
                        Click <strong>OK</strong> ✓
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Testing Tips */}
                <div className="bg-green-50 border-l-4 border-green-500 rounded p-4">
                  <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    Testing Tips
                  </h3>
                  <p className="text-green-700 text-sm mb-3">
                    After setting up file associations, test them by
                    double-clicking a JSON file.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <span>✓</span>
                    <span>
                      Create a sample JSON file and double-click it to test!
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-12 pt-10 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-8 py-2 text-gray-700 hover:text-white hover:bg-red-500 font-semibold rounded-xl shadow bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
