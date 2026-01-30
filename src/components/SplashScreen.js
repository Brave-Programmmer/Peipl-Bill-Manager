"use client";

import { useState, useEffect } from "react";

async function realAppLoading() {
  await new Promise((resolve) => {
    const img = new window.Image();
    img.src = "./logo.png";
    img.onload = resolve;
    img.onerror = resolve;
  });

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

export default function SplashScreen({ onComplete }) {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 300);

    realAppLoading().then(() => {
      setLoaded(true);
      setTimeout(() => onComplete?.(), 900);
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Soft animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),transparent_60%)] animate-pulse" />

      {/* Main card */}
      <div
        className={`relative z-10 flex flex-col items-center transition-all duration-1000 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Logo container */}
        <div className="relative flex items-center justify-center w-52 h-52 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl">
          <img
            src="./logo.png"
            alt="Pujari Engineers Logo"
            className="w-36 h-36 object-contain animate-[float_4s_ease-in-out_infinite]"
          />
        </div>

        {/* Company Name */}
        <h1 className="mt-8 text-center text-2xl md:text-4xl font-semibold tracking-wide text-gray-800">
          PUJARI ENGINEERS
        </h1>
        <p className="mt-1 text-sm md:text-base text-gray-500 tracking-wide">
          India Pvt. Ltd.
        </p>

        {/* Loading indicator */}
        <div className="mt-8 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <span className="text-sm text-gray-500">
            {loaded ? "Launching…" : "Loading resources…"}
          </span>
        </div>
      </div>

      {/* Floating animation */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
