"use client";

import { useState, useEffect, memo, useRef } from "react";
import toast from "react-hot-toast";
import styles from "../styles/TitleBarMenu.module.css";

function TitleBarMenu({
  onGenerateBill,
  onOpenBill,
  onSaveBill,
  onShowUserManual,
  onShowBillFolderTracker,
  onShowFileAssociationSetup,
  isLoading,
  showTooltips
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsElectronEnv(typeof window !== "undefined" && !!window.electronAPI);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!isElectronEnv) return null;

  const menuItems = [
    { id: "generate", label: "Generate Bill", icon: "📄", shortcut: "Ctrl+G", action: onGenerateBill, disabled: isLoading },
    { id: "open", label: "Open Bill", icon: "📂", shortcut: "Ctrl+O", action: onOpenBill },
    { id: "save", label: "Save Bill", icon: "💾", shortcut: "Ctrl+S", action: onSaveBill }
  ];

  const secondaryItems = [
    { id: "tracker", label: "Bill Folder Tracker", icon: "📁", action: onShowBillFolderTracker },
    { id: "association", label: "File Associations", icon: "🔗", action: onShowFileAssociationSetup }
  ];

  const handleClick = (item) => {
    if (item.disabled) return;
    setIsMenuOpen(false);
    item.action();
    showTooltips && toast.success(item.label, { icon: item.icon });
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        aria-label="File menu"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <span className="text-white text-xs font-medium">File</span>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

          {/* Menu Panel */}
          <div
            ref={menuRef}
            role="menu"
            className={`absolute left-0 top-full mt-1 z-50 w-64 rounded-md bg-white shadow-xl border border-gray-200 ${styles.animateFadeIn}`}
          >
            {/* Header */}
            <div className="px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase">
              File
            </div>

            {/* Primary Actions */}
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleClick(item)}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 transition ${
                    item.disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <span className="text-xs text-gray-400">{item.shortcut}</span>}
                  {item.id === "generate" && isLoading && (
                    <span className="ml-2 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t my-1" />

            {/* Secondary */}
            <div className="py-1">
              {secondaryItems.map((item) => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleClick(item)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t my-1" />

            {/* Help */}
            <button
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                onShowUserManual();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100"
            >
              📚 User Manual
              <span className="ml-auto text-xs text-gray-400">F1</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(TitleBarMenu);
