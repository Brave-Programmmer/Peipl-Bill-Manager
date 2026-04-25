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
  showTooltips,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsElectronEnv(typeof window !== "undefined" && !!window.electronAPI);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Don't trigger when typing in input fields
      const activeElement = document.activeElement;
      const isInputElement =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.contentEditable === "true");

      if (isInputElement) return; // Don't interfere with typing

      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!isElectronEnv) return null;

  const menuItems = [
    {
      id: "generate",
      label: "Generate Bill",
      icon: "📄",
      shortcut: "Ctrl+G",
      action: onGenerateBill,
      disabled: isLoading,
    },
    {
      id: "open",
      label: "Open Bill",
      icon: "📂",
      shortcut: "Ctrl+O",
      action: onOpenBill,
    },
    {
      id: "save",
      label: "Save Bill",
      icon: "💾",
      shortcut: "Ctrl+S",
      action: onSaveBill,
    },
  ];

  const secondaryItems = [
    {
      id: "tracker",
      label: "Bill Folder Tracker",
      icon: "📁",
      action: onShowBillFolderTracker,
    },
    {
      id: "association",
      label: "File Associations",
      icon: "🔗",
      action: onShowFileAssociationSetup,
    },
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
        className="px-2 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-main)] transition-colors focus:outline-none"
      >
        <span className="text-xs font-bold tracking-tight">File</span>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            ref={menuRef}
            role="menu"
            className={`absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl bg-[var(--color-surface)] shadow-strong border border-[var(--color-border-light)] py-2 animate-fade-in`}
          >
            {/* Header */}
            <div className="px-4 py-1.5 mb-1 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
              File Actions
            </div>

            {/* Primary Actions */}
            <div className="space-y-0.5 px-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleClick(item)}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] transition-all ${
                    item.disabled ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] font-bold text-[var(--color-text-light)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">
                      {item.shortcut}
                    </span>
                  )}
                  {item.id === "generate" && isLoading && (
                    <span className="ml-2 w-3 h-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border-subtle)] my-2 mx-1.5" />

            {/* Secondary */}
            <div className="space-y-0.5 px-1.5">
              {secondaryItems.map((item) => (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => handleClick(item)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] transition-all"
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border-subtle)] my-2 mx-1.5" />

            {/* Help */}
            <div className="px-1.5">
              <button
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  onShowUserManual();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] transition-all"
              >
                <span className="text-lg leading-none">📚</span>
                <span className="flex-1 font-medium">User Manual</span>
                <span className="text-[10px] font-bold text-[var(--color-text-light)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">
                  F1
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(TitleBarMenu);
