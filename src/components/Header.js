"use client";

import { useState, useEffect } from "react";

export default function Header({
  onToggleSidebar,
  sidebarOpen,
  onQuickSave,
  onQuickGenerate,
  hasUnsavedChanges,
}) {
  const [isElectron, setIsElectron] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && !!window.electronAPI);

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-surface/80 backdrop-blur-md border-b border-border-light shadow-sm electron-header">
      <div className="section-container !py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="btn-icon"
            aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarOpen
                ? <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                : <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />}
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-inverse font-bold">
              P
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              Peipl <span className="text-primary">BillManager</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center px-3 py-1 bg-bg-alt rounded-full text-xs font-medium text-text-muted">
            <span
              className={hasUnsavedChanges ? "text-accent" : "text-success"}
            >
              ●
            </span>
            <span className="ml-2">
              {hasUnsavedChanges ? "Unsaved Changes" : "All Saved"}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onQuickSave}
              className="btn btn-outline btn-sm"
              title="Save Bill (Ctrl+S)"
            >
              <span className="hidden sm:inline">Save</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
                />
              </svg>
            </button>
            <button
              onClick={onQuickGenerate}
              className="btn btn-primary btn-sm"
              title="Generate PDF (Ctrl+G)"
            >
              <span className="hidden sm:inline">Generate</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
