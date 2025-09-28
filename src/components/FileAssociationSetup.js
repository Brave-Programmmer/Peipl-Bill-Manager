"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function FileAssociationSetup({ isVisible, onClose }) {
  const [isSettingUp, setIsSettingUp] = useState(false);

  const setupFileAssociations = async () => {
    setIsSettingUp(true);
    try {
      if (window.electronAPI && typeof window.electronAPI.setupFileAssociations === 'function') {
        const result = await window.electronAPI.setupFileAssociations();
        if (result && result.success) {
          toast.success("File associations set up successfully!");
        } else {
          toast.error(`Failed to set up file associations: ${result?.error || 'Unknown error'}`);
        }
      } else if (window.electronAPI) {
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
    if (window.electronAPI && typeof window.electronAPI.openFileAssociationSettings === 'function') {
      window.electronAPI.openFileAssociationSettings();
    } else if (window.electronAPI) {
      toast.error("Electron API is missing openFileAssociationSettings method.");
    } else {
      toast("Right-click a JSON file, choose 'Open with', then select PEIPL Bill Maker and set as default.", { icon: '📝' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Set Up File Associations
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                What are File Associations?
              </h3>
              <p className="text-blue-700 text-sm">
                File associations let you double-click JSON files in Windows File Explorer and instantly open them in PEIPL Bill Maker.<br />
                <span className="font-semibold">Note:</span> Automatic setup only works in the desktop app. For browsers, use manual setup below.
              </p>
            </div>

            {/* Automatic Setup */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🚀 Automatic Setup (Recommended)
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                This will automatically configure your system to open JSON files with PEIPL Bill Maker.
              </p>
              <button
                onClick={setupFileAssociations}
                disabled={isSettingUp}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                  </>
                )}
              </button>
            </div>

            {/* Manual Setup */}
            <div className="border border-gray-200 rounded-lg p-6">
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
                >
                  <span>⚙️</span>
                  <span>Open Windows File Association Settings</span>
                </button>
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Or follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Right-click any JSON file in Windows File Explorer</li>
                    <li>Select "Open with" → "Choose another app"</li>
                    <li>Find and select "PEIPL Bill Maker"</li>
                    <li>Check "Always use this app to open .json files"</li>
                    <li>Click "OK"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Test Section */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-6">
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
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

