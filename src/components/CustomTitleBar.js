"use client";

import { useState, useEffect, memo } from "react";

function CustomTitleBar({ onToggleSidebar, sidebarOpen }) {
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
      className="fixed top-0 left-0 right-0 h-10 bg-gradient-to-r from-[#0f766e] via-[#138d84] to-[#0d9488] z-[100] flex items-center justify-between px-4 select-none no-print shadow-lg"
      style={{
        WebkitAppRegion: "drag",
        appRegion: "drag",
      }}
    >
      {/* Left side - Menu button, App title/logo */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" }}>
        {/* Hamburger Menu Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200 rounded-sm group cursor-pointer"
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
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="group-hover:scale-110 transition-transform"
              style={{ pointerEvents: "none" }}
            >
              {sidebarOpen ? (
                <>
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
        )}
        
        <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center">
          <img
            src="./logo.png"
            alt="PEIPL"
            className="w-5 h-5 object-contain"
          />
        </div>
        <span className="text-white text-xs font-semibold tracking-wide">
          PEIPL Bill Assistant
        </span>
        </div>
      </div>

      {/* Right side - Window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" }}
      >
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200 rounded-sm group cursor-pointer"
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
            width="16"
            height="16"
            viewBox="0 0 12 12"
            fill="none"
            className="group-hover:scale-110 transition-transform"
            style={{ pointerEvents: "none" }}
          >
            <path
              d="M2 6h8"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={handleMaximize}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200 rounded-sm group cursor-pointer"
          title={isMaximized ? "Restore" : "Maximize"}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            boxShadow: "none",
          }}
        >
          {isMaximized ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 12 12"
              fill="none"
              className="group-hover:scale-110 transition-transform"
              style={{ pointerEvents: "none" }}
            >
              <path
                d="M3 3h3v3H3V3zM6 6h3v3H6V6z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 12 12"
              fill="none"
              className="group-hover:scale-110 transition-transform"
              style={{ pointerEvents: "none" }}
            >
              <path
                d="M2 2h8v8H2V2z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="titlebar-button w-10 h-10 flex items-center justify-center text-white hover:bg-red-500 active:bg-red-600 transition-all duration-200 rounded-sm group cursor-pointer"
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
            width="16"
            height="16"
            viewBox="0 0 12 12"
            fill="none"
            className="group-hover:scale-110 transition-transform"
            style={{ pointerEvents: "none" }}
          >
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(CustomTitleBar);

