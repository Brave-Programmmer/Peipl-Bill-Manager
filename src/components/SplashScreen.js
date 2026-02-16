import { useState, useEffect } from "react";

async function realAppLoading() {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = "./logo.png";
    img.onload = resolve;
    img.onerror = resolve;
  });
}

export default function SplashScreen({ onComplete }) {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTip, setLoadingTip] = useState("Initializing application...");

  useEffect(() => {
    setShow(true);
    
    // Simulate loading steps with progress
    const loadingSteps = [
      { progress: 20, tip: "Loading components..." },
      { progress: 40, tip: "Preparing workspace..." },
      { progress: 60, tip: "Loading templates..." },
      { progress: 80, tip: "Finalizing setup..." },
      { progress: 100, tip: "Ready to launch!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setLoadingProgress(step.progress);
        setLoadingTip(step.tip);
        currentStep++;
      } else {
        clearInterval(interval);
        realAppLoading().then(() => {
          setLoaded(true);
          setTimeout(onComplete, 800);
        });
      }
    }, 300);

    return () => clearInterval(interval);
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

        {/* Loading Progress Bar */}
        <div className="mt-8 w-64">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{loadingTip}</span>
            <span>{loadingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>

        {/* Loading Status */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <span className="text-sm text-gray-500">
              {loaded ? "Launched!" : "Loading resources…"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
