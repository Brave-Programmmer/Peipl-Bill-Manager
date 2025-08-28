"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Initializing System...",
    "Loading Components...",
    "Preparing Bill Templates...",
    "Setting Up Database...",
    "Finalizing Configuration...",
    "Ready to Launch!",
  ];

  useEffect(() => {
    // Show content after a brief delay
    const timer = setTimeout(() => setShowContent(true), 500);

    // Simulate loading progress with step changes
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 800);
          return 100;
        }

        const newProgress = prev + Math.random() * 12;

        // Update current step based on progress
        if (newProgress < 20) setCurrentStep(0);
        else if (newProgress < 40) setCurrentStep(1);
        else if (newProgress < 60) setCurrentStep(2);
        else if (newProgress < 80) setCurrentStep(3);
        else if (newProgress < 95) setCurrentStep(4);
        else setCurrentStep(5);

        return newProgress;
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 animate-pulse"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div
        className={`text-center transition-all duration-1000 relative z-10 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 group hover:bg-white/20 transition-all duration-500 animate-pulse rounded-full">
            <img
              src="./logo.png"
              alt="Pujari Engineers Logo"
              width={90}
              height={90}
              className="object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Company Name */}
        <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in tracking-tight">
          Pujari Engineers India Pvt Ltd
        </h1>

        {/* Tagline */}
        <p className="text-2xl text-blue-100 mb-12 animate-fade-in-delay font-medium tracking-wide">
          Professional Bill Maker & Management System
        </p>

        {/* Current Step */}
        <div className="mb-8">
          <p className="text-blue-200 text-lg font-semibold animate-pulse">
            {steps[currentStep]}
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-96 mx-auto mb-8">
          <div className="bg-white/20 backdrop-blur-sm h-4 overflow-hidden shadow-inner border border-white/30">
            <div
              className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 h-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Progress Text */}
        <p className="text-blue-100 text-xl font-bold mb-8">
          Loading... {Math.round(progress)}%
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-indigo-300 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-purple-300 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Version Info */}
        <div className="mt-12 text-blue-200 text-sm">
          <p>Version 2.0 • Made by Brave Programmer</p>
          <p className="mt-1">© 2024 Pujari Engineers India Pvt Ltd</p>
        </div>
      </div>
    </div>
  );
}
