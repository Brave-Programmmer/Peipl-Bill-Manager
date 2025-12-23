"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function WelcomeGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the welcome guide
    const hasSeenGuide = localStorage.getItem("hasSeenWelcomeGuide");
    if (!hasSeenGuide) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const steps = [
    {
      title: "👋 Welcome to PEIPL Bill Maker!",
      description:
        "Let's take a quick tour to get you started. This will only take 30 seconds!",
      icon: "🎉",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "📋 Step 1: Company Information",
      description:
        "First, click the sidebar toggle to enter your company details. This information will be saved and used for all your bills.",
      icon: "🏢",
      color: "from-green-500 to-emerald-500",
      highlight: "company-info",
    },
    {
      title: "📝 Step 2: Fill Bill Details",
      description:
        "Enter the bill number (auto-generated), customer name, address, and other details in the form fields.",
      icon: "✍️",
      color: "from-purple-500 to-pink-500",
      highlight: "bill-details",
    },
    {
      title: "➕ Step 3: Add Items",
      description:
        'Click "Add New Row" to add items to your bill. You can add multiple items and edit them easily.',
      icon: "📦",
      color: "from-orange-500 to-red-500",
      highlight: "items-table",
    },
    {
      title: "🎯 Step 4: Generate Bill",
      description:
        'Once you\'ve added all items, click "Generate Professional Bill" to create your invoice. You can then print, save, or export it!',
      icon: "🚀",
      color: "from-indigo-500 to-purple-500",
      highlight: "generate-button",
    },
    {
      title: "✅ You're All Set!",
      description:
        "That's it! You're ready to create professional bills. Click the 📚 User Manual button anytime for detailed help.",
      icon: "🎊",
      color: "from-pink-500 to-rose-500",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcomeGuide", "true");
    setIsVisible(false);
    toast.success("Welcome! Start creating your first bill 🎉", {
      duration: 4000,
      icon: "👋",
    });
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-[#019b98] to-[#136664] transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className={`bg-gradient-to-br ${step.color} p-8 text-white`}>
          <div className="text-6xl mb-4 text-center animate-bounce-in">
            {step.icon}
          </div>
          <h2 className="text-3xl font-bold text-center mb-3">{step.title}</h2>
          <p className="text-lg text-center text-white/90">
            {step.description}
          </p>
        </div>

        <div className="p-6 bg-gray-50">
          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-[#019b98]"
                    : index < currentStep
                      ? "w-2 bg-[#019b98]"
                      : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-2 bg-gradient-to-r from-[#019b98] to-[#136664] hover:from-[#136664] hover:to-[#019b98] text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {currentStep === steps.length - 1
                  ? "Get Started! 🚀"
                  : "Next →"}
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>You can always access the User Manual from the main screen 📚</p>
          </div>
        </div>
      </div>
    </div>
  );
}
