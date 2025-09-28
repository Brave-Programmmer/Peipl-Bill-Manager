"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function FileAssociationSetup({ isVisible, onClose }) {
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Detect if running in Electron
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const setupFileAssociations = async () => {
    setIsSettingUp(true);
    try {
      if (isElectron && typeof window.electronAPI.setupFileAssociations === 'function') {
        const result = await window.electronAPI.setupFileAssociations();
        if (result && result.success) {
          toast.success("File associations set up successfully!");
        } else {
          toast.error(`Failed to set up file associations: ${result?.error || 'Unknown error'}`);
        }
      } else if (isElectron) {
        toast.error("Electron API is missing setupFileAssociations method.");
      } else {
        toast("Manual setup required. This feature is only available in the desktop app.", { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error("Error setting up file associations:", error);
      toast.error("Error setting up file associations. Please try manual setup.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const openFileAssociationSettings = () => {
    if (isElectron && typeof window.electronAPI.openFileAssociationSettings === 'function') {
      window.electronAPI.openFileAssociationSettings();
    } else if (isElectron) {
      toast.error("Electron API is missing openFileAssociationSettings method.");
    } else {
      toast("Right-click a JSON file, choose 'Open with', then select PEIPL Bill Maker and set as default.", { icon: '📝' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-200 via-white to-gray-300 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
              <span className="inline-block align-middle mr-2">🗂️</span>
              Set Up File Associations
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 text-3xl font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full w-10 h-10 flex items-center justify-center shadow-md"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-10">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-2xl p-6 shadow-md">
              <h3 className="font-semibold text-blue-800 mb-2">
                What are File Associations?
              </h3>
              <p className="text-blue-700 text-sm">
                File associations let you double-click JSON files in Windows File Explorer and instantly open them in PEIPL Bill Maker.<br />
                <span className="font-semibold">Note:</span> Automatic setup only works in the desktop app. For browsers, use manual setup below.
              </p>
            </div>

            {/* Automatic Setup */}
            <div className="border border-gray-200 rounded-2xl p-8 shadow-md bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🚀 Automatic Setup (Recommended)
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                This will automatically configure your system to open JSON files with PEIPL Bill Maker.
              </p>
              <button
                onClick={setupFileAssociations}
                disabled={isSettingUp || !isElectron}
                className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 ${isSettingUp || !isElectron ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-disabled={isSettingUp || !isElectron}
              >
                {isSettingUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>🔧</span>
                    <span>Set Up Automatically</span>
                    {!isElectron && (
                      <span className="ml-2 text-xs text-yellow-200 bg-yellow-600 px-2 py-1 rounded">Desktop Only</span>
                    )}
                  </>
                )}
              </button>
              {!isElectron && (
                <p className="text-xs text-yellow-700 mt-2">Automatic setup is only available in the desktop app.</p>
              )}
            </div>

            {/* Manual Setup */}
            <div className="border border-gray-200 rounded-2xl p-8 shadow-md bg-white">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📋 Manual Setup
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                If automatic setup doesn't work, you can set up file associations manually.
              </p>
              <div className="space-y-3">
                <button
                  onClick={openFileAssociationSettings}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  disabled={!isElectron}
                  aria-disabled={!isElectron}
                >
                  <span>⚙️</span>
                  <span>Open Windows File Association Settings</span>
                  {!isElectron && (
                    <span className="ml-2 text-xs text-yellow-200 bg-yellow-600 px-2 py-1 rounded">Desktop Only</span>
                  )}
                </button>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Or follow these steps:</p>
                  <ol className="list-decimal list-inside text-xs divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <li className="py-2 px-3 hover:bg-blue-50 transition-colors duration-150 rounded-t-lg">Right-click any JSON file in Windows File Explorer</li>
                    <li className="py-2 px-3 hover:bg-blue-50 transition-colors duration-150">Select "Open with" → "Choose another app"</li>
                    <li className="py-2 px-3 hover:bg-blue-50 transition-colors duration-150">Find and select "PEIPL Bill Maker"</li>
                    <li className="py-2 px-3 hover:bg-blue-50 transition-colors duration-150">Check "Always use this app to open .json files"</li>
                    <li className="py-2 px-3 hover:bg-blue-50 transition-colors duration-150 rounded-b-lg">Click "OK"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Test Section */}
            <div className="border border-green-300 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 shadow-md">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                ✅ Test Your Setup
              </h3>
              <p className="text-green-700 text-sm mb-4">
                After setting up file associations, test them by double-clicking a JSON file.
              </p>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <span>💡</span>
                <span>Create a sample JSON file and double-click it to test!</span>
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
  );
}

