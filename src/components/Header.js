"use client";

import { useState, useEffect } from "react";

export default function Header({
  onToggleSidebar,
  sidebarOpen,
  onQuickSave,
  onQuickGenerate,
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
    <header
      className={`bg-gradient-to-r from-[#0d9488] via-[#0a7a78] to-[#056064] shadow-xl no-print relative overflow-hidden animate-slide-in-up transition-all duration-300 ${isElectron ? "mt-10" : ""}`}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14b8a6]/10 to-[#2d3436]/5 pointer-events-none"></div>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-4 sm:py-5">
          {/* Left Section */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Hamburger Menu Button */}
            {!isElectron && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200 rounded-lg group cursor-pointer flex-shrink-0 btn-icon"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-label="Toggle sidebar"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="group-hover:scale-110 transition-transform"
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

            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 backdrop-blur-md flex items-center justify-center overflow-hidden group bg-white/15 rounded-xl shadow-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                <img
                  src="./logo.png"
                  alt="Pujari Engineers Logo"
                  width={56}
                  height={56}
                  className="object-contain w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-0 sm:space-y-0.5 hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md">
                Pujari Engineers
              </h1>
              <p className="text-white/85 text-xs sm:text-sm font-medium tracking-wide">
                 Bill Management
              </p>
            </div>

            {/* Mobile title only */}
            <div className="sm:hidden space-y-0">
              <h1 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                PEIPL
              </h1>
              <p className="text-white/85 text-xs font-medium">Bill Manager</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Action Buttons (hidden on small screens) */}
            <div className="hidden md:flex items-center space-x-2">
              {onQuickSave && (
                <button
                  onClick={onQuickSave}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-500/90 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200 font-medium text-sm hover:shadow-lg active:scale-95"
                  title="Quick save bill (Ctrl+S)"
                  aria-label="Quick save"
                >
                  <span>💾</span>
                  <span className="hidden lg:inline">Save</span>
                </button>
              )}
              {onQuickGenerate && (
                <button
                  onClick={onQuickGenerate}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-medium text-sm hover:shadow-lg active:scale-95"
                  title="Quick generate bill"
                  aria-label="Quick generate"
                >
                  <span>📄</span>
                  <span className="hidden lg:inline">Generate</span>
                </button>
              )}
            </div>

            {/* Current Time */}
            <div className="hidden md:flex flex-col items-end text-white bg-white/10 px-3 py-2 rounded-lg border border-white/20">
              <div className="text-xs font-semibold text-white/90">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-white/70">
                {currentTime.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
