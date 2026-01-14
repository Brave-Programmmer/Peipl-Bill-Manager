"use client";

import { useState, useEffect } from "react";

export default function Header({ onToggleSidebar, sidebarOpen }) {
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
      className={`bg-gradient-to-r from-[#0f766e] via-[#138d84] to-[#0d9488] shadow-2xl no-print relative overflow-hidden animate-slide-in-up ${isElectron ? "mt-10" : ""}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14b8a6]/5 to-[#2d3436]/10 animate-gradient-shift"></div>
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-4 sm:py-6">
          {/* Left Section: Menu Button (if not Electron), Logo & Company Info */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Hamburger Menu Button (only show if not Electron) */}
            {!isElectron && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200 rounded-lg group cursor-pointer flex-shrink-0"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
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

            <div className="flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-md flex items-center justify-center overflow-hidden group animate-float bg-white/10 rounded-xl shadow-lg">
                <img
                  src="./logo.png"
                  alt="Pujari Engineers Logo"
                  width={64}
                  height={64}
                  className="object-contain w-12 h-12 sm:w-14 sm:h-14 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                />
              </div>
            </div>

            <div
              className="space-y-0.5 sm:space-y-1 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                Pujari Engineers
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                Bill Maker & Management System
              </p>
            </div>
          </div>

          {/* Right Section: Status Info & Time */}
          <div
            className="flex items-center space-x-4 sm:space-x-6 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Current Time */}
            <div className="hidden sm:flex flex-col items-end text-white">
              <div className="text-xs font-medium text-white/80">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-white/60">
                {currentTime.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs sm:text-sm text-white font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-lg"></span>
                <span className="hidden sm:inline">System Online</span>
                <span className="sm:hidden">Online</span>
              </span>
              <span className="text-white/50">•</span>
              <span className="text-white/80">v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
