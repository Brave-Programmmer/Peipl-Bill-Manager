"use client";

import { useState, useEffect, memo } from "react";
import TitleBarMenu from "./TitleBarMenu";

function CustomTitleBar({
  onToggleSidebar,
  sidebarOpen,
  onGenerateBill,
  onOpenBill,
  onSaveBill,
  onShowUserManual,
  onShowBillFolderTracker,
  onShowFileAssociationSetup,
  isLoading,
  showTooltips,
  hasUnsavedChanges = false,
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI);

    // Listen for maximize state changes
    if (window.electronAPI) {
      const checkMaximized = async () => {
        try {
          const maximized = await window.electronAPI.isMaximized();
          setIsMaximized(maximized);
        } catch (error) {
          console.error("Error checking maximize state:", error);
        }
      };

      checkMaximized();

      // Listen for window state changes
      const handleMaximize = () => setIsMaximized(true);
      const handleUnmaximize = () => setIsMaximized(false);

      window.electronAPI.onMaximize(handleMaximize);
      window.electronAPI.onUnmaximize(handleUnmaximize);

      return () => {
        if (window.electronAPI.removeAllListeners) {
          window.electronAPI.removeAllListeners("window-maximized");
          window.electronAPI.removeAllListeners("window-unmaximized");
        }
      };
    }
  }, []);

  // Only show in Electron
  if (!isElectron) {
    return null;
  }

  const handleMinimize = async () => {
    if (window.electronAPI?.minimize) {
      try {
        await window.electronAPI.minimize();
      } catch (error) {
        console.error("Error minimizing window:", error);
      }
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI?.maximize) {
      try {
        await window.electronAPI.maximize();
      } catch (error) {
        console.error("Error maximizing window:", error);
      }
    }
  };

  const handleClose = async () => {
    if (window.electronAPI?.close) {
      try {
        await window.electronAPI.close();
      } catch (error) {
        console.error("Error closing window:", error);
      }
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-10 bg-[var(--color-surface)] border-b border-[var(--color-border-light)] z-[100] flex items-center justify-between px-4 select-none no-print shadow-sm"
      style={{
        WebkitAppRegion: "drag",
        appRegion: "drag",
      }}
    >
      {/* Left side - Menu button, App title/logo */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" }}
      >
        {/* Hamburger Menu Button (for sidebar) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] active:bg-[var(--color-border-light)] transition-all duration-200 rounded-md group cursor-pointer"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              margin: 0,
              boxShadow: "none",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="group-hover:scale-110 transition-transform"
            >
              {sidebarOpen
                ? <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                : <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />}
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2 px-1">
          <img
            src="./logo.png"
            alt="PEIPL Logo"
            width={18}
            height={18}
            className="object-contain"
          />
          <TitleBarMenu
            onGenerateBill={onGenerateBill}
            onOpenBill={onOpenBill}
            onSaveBill={onSaveBill}
            onShowUserManual={onShowUserManual}
            onShowBillFolderTracker={onShowBillFolderTracker}
            onShowFileAssociationSetup={onShowFileAssociationSetup}
            isLoading={isLoading}
            showTooltips={showTooltips}
          />
        </div>
      </div>

      {/* Middle side - App title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-[var(--color-text-main)] font-bold text-xs tracking-wide">
          PEIPL Bill Assistant
        </span>
        {hasUnsavedChanges && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
        )}
      </div>

      {/* Right side - Window controls */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" }}
      >
        <button
          onClick={handleMinimize}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] transition-all duration-200"
          title="Minimize"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            boxShadow: "none",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ pointerEvents: "none" }}
          >
            <path
              d="M2 6h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text-main)] transition-all duration-200"
          title={isMaximized ? "Restore" : "Maximize"}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            boxShadow: "none",
          }}
        >
          {isMaximized
            ? <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ pointerEvents: "none" }}
              >
                <path
                  d="M3 3h3v3H3V3zM6 6h3v3H6V6z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            : <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ pointerEvents: "none" }}
              >
                <rect
                  x="2.5"
                  y="2.5"
                  width="7"
                  height="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>}
        </button>

        <button
          onClick={handleClose}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-red-500 hover:text-white transition-all duration-200"
          title="Close"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            boxShadow: "none",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ pointerEvents: "none" }}
          >
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(CustomTitleBar);
