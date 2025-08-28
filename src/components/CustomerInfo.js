import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CustomerInfo({ billData, setBillData }) {
  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Section Header with Presets */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">👤</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Customer Information
              </h3>
              <p className="text-gray-600 text-xs">
                Enter the billing details for your customer
              </p>
            </div>
          </div>
          <CustomerPresetsToolbarSimple billData={billData} />
        </div>

        {/* Customer Form */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-xl border border-blue-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={billData.customerName}
                  onChange={(e) =>
                    setBillData({ ...billData, customerName: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-sm hover:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Plant Name
                </label>
                <input
                  type="text"
                  placeholder="Enter plant name"
                  value={billData.plantName || ""}
                  onChange={(e) =>
                    setBillData({ ...billData, plantName: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-sm hover:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Address
                </label>
                <textarea
                  placeholder="Enter customer address"
                  value={billData.customerAddress}
                  onChange={(e) =>
                    setBillData({
                      ...billData,
                      customerAddress: e.target.value,
                    })
                  }
                  className="w-full border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 resize-none text-sm hover:border-blue-400"
                  rows="4"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={billData.customerPhone}
                  onChange={(e) =>
                    setBillData({ ...billData, customerPhone: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-sm hover:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  GST Number
                </label>
                <input
                  type="text"
                  placeholder="Enter GST number"
                  value={billData.customerGST}
                  onChange={(e) =>
                    setBillData({ ...billData, customerGST: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white text-gray-900 font-semibold placeholder-gray-500 text-sm hover:border-blue-400"
                />
              </div>

              {/* Status/Presets Box */}
              <CustomerPresetLoader setBillData={setBillData} billData={billData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerPresetsToolbarSimple({ billData }) {
  const [name, setName] = useState("");
  const [presets, setPresets] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Load presets on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("customerPresets") || "[]");
      setPresets(saved);
    } catch {}
  }, []);

  // Save preset
  const savePreset = () => {
    try {
      if (!name.trim()) return toast.error("Enter preset name");
      const preset = {
        id: Date.now(),
        name: name.trim(),
        customerName: billData.customerName || "",
        plantName: billData.plantName || "",
        customerAddress: billData.customerAddress || "",
        customerPhone: billData.customerPhone || "",
        customerGST: billData.customerGST || "",
      };

      if (!preset.customerName) {
        return toast.error("Customer name is required to save preset");
      }

      const saved = JSON.parse(localStorage.getItem("customerPresets") || "[]");

      if (saved.some((p) => p.name === preset.name)) {
        const confirmUpdate = window.confirm(
          `Preset "${preset.name}" already exists. Update it?`
        );
        if (!confirmUpdate) return;
      }

      const updated = [...saved.filter((p) => p.name !== preset.name), preset];
      localStorage.setItem("customerPresets", JSON.stringify(updated));
      setPresets(updated);
      setName("");
      toast.success("Preset saved successfully");
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("Failed to save preset. Please try again.");
    }
  };

  // Delete preset
  const deletePreset = (preset) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${preset.name}"?`);
    if (!confirmDelete) return;
    
    const updated = presets.filter((p) => p.id !== preset.id);
    localStorage.setItem("customerPresets", JSON.stringify(updated));
    setPresets(updated);
    setSelectedPreset(null);
    toast.success(`Preset "${preset.name}" deleted`);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 text-xs">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Preset name"
            className="w-40 border-2 border-gray-300 px-3 py-2 bg-white text-gray-900 font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
        </div>
        <button
          onClick={savePreset}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
        >
          Save Preset
        </button>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 flex items-center space-x-2"
          >
            <span>Presets</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? "transform rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isDropdownOpen && presets.length > 0 && (
            <div className="absolute right-0 mt-2 w-56 shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
              <div className="py-1">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="group relative flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer"
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <span className="flex-grow">{preset.name}</span>
                    <div className="hidden group-hover:flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerPresetLoader({ billData, setBillData }) {
  const [presets, setPresets] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load presets on mount + when they change in localStorage
  useEffect(() => {
    const load = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("customerPresets") || "[]");
        setPresets(saved);
      } catch {}
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const loadPreset = (preset) => {
    if (!preset) return;
    
    setBillData({
      ...billData,
      customerName: preset.customerName || "",
      plantName: preset.plantName || "",
      customerAddress: preset.customerAddress || "",
      customerPhone: preset.customerPhone || "",
      customerGST: preset.customerGST || "",
    });
    
    setIsDropdownOpen(false);
    toast.success(`Preset "${preset.name}" loaded`);
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border border-gray-200 shadow-sm">
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-medium  hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500  animate-pulse"></div>
            <span className="text-sm font-semibold">Load Customer Preset</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isDropdownOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        
        {isDropdownOpen && presets.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto  shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
            {presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer group transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                  <span className="hidden group-hover:block text-xs text-blue-600">Click to load</span>
                </div>
                {preset.customerName && (
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {preset.customerName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {presets.length === 0 && (
          <p className="mt-2 text-xs text-gray-500 text-center">
            No presets saved yet. Create one above.
          </p>
        )}
      </div>
    </div>
  );
}
