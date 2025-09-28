export default function CustomerInfo({ billData, setBillData }) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        {/* Section Header with Presets */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">👤</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Customer Details
              </h3>
              <p className="text-xs text-gray-500">Enter billing information</p>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <div className="rounded-lg bg-white">
          <div className="space-y-3">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={billData.customerName || ""}
                  onChange={(e) =>
                    setBillData({ ...billData, customerName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="relative">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Plant Name
                </label>
                <input
                  type="text"
                  placeholder="Enter plant name"
                  value={billData.plantName || ""}
                  onChange={(e) =>
                    setBillData({ ...billData, plantName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400 hover:border-gray-400 transition-colors"
                />
              </div>

              <div className="relative">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Address
                </label>
                <textarea
                  placeholder="Enter customer address"
                  value={billData.customerAddress || ""}
                  onChange={(e) =>
                    setBillData({
                      ...billData,
                      customerAddress: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400 hover:border-gray-400 transition-colors
                           resize-none min-h-[5rem]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={billData.customerPhone || ""}
                  onChange={(e) =>
                    setBillData({ ...billData, customerPhone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400 hover:border-gray-400 transition-colors"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
