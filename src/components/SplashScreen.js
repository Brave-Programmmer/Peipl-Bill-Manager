"use client";

import { useState, useEffect } from "react";

// Actually load resources: logo image, fonts, etc.
async function realAppLoading() {
  // Load logo image
  await new Promise((resolve) => {
    const img = new window.Image();
    img.src = "./logo.png";
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
  // Optionally, load fonts (example for web fonts)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  // You can add more resource loading here (API, other images)
}

export default function SplashScreen({ onComplete }) {
  const [showContent, setShowContent] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    const textTimer = setTimeout(() => setShowText(true), 700);

    // Actually load resources
    realAppLoading().then(() => {
      setTimeout(() => {
        onComplete?.();
      }, 700); // keep splash for a bit after loading
    });

    return () => {
      clearTimeout(timer);
      clearTimeout(textTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center z-50">
      {/* Background Effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 animate-pulse"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Logo */}
      <div
        className={`transition-all duration-1000 relative z-10 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        <div className="w-48 h-48 md:w-56 md:h-56 bg-white shadow-xl border border-gray-200 flex items-center justify-center rounded-2xl hover:shadow-2xl transition-all duration-500">
          <img
            src="./logo.png"
            alt="Company Logo"
            width={160}
            height={160}
            className="object-contain transition-transform duration-700 hover:scale-110"
          />
        </div>
      </div>

      {/* Company Name */}
      <h1
        className={`mt-8 text-2xl md:text-4xl font-bold text-gray-800 tracking-wide transition-all duration-1000 ${
          showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        PUJARI ENGINEERS INDIA PVT LTD
      </h1>
    </div>
  );
}
