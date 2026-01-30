"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UserManual({ isVisible, onClose }) {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isVisible) return null;

  const sections = [
    {
      id: "file-associations",
      title: "📂 File Associations",
      icon: "📂",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            File Associations & Opening Bills
          </h2>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
            <h3 className="font-bold text-green-800 mb-2">✨ New Feature: File Associations</h3>
            <p className="text-green-700">
              PEIPL Bill Assistant now supports file associations! Double-click saved bill files to open them directly.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔗 How File Associations Work
              </h3>
              <p className="text-gray-600 mb-3">
                Bill files (.peiplbill and .json) are automatically registered to open with PEIPL Bill Assistant.
              </p>
              
              <div className="bg-blue-50 p-3 rounded mb-3">
                <p className="text-blue-800 font-semibold mb-2">Supported File Types:</p>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1 ml-4">
                  <li>.peiplbill - PEIPL Bill format (recommended)</li>
                  <li>.json - Standard JSON bill format</li>
                </ul>
              </div>

              <p className="text-gray-600 text-sm">
                📝 Example: Double-click <code className="bg-gray-200 px-1 rounded">bill_peiplch2526_001_2025-09-30.peiplbill</code>
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ⚙️ Setting Up File Associations
              </h3>
              
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-gray-700">Step 1: Administrator Rights</p>
                  <p className="text-gray-600 text-sm">
                    First-time setup requires administrator privileges to register file associations with Windows.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-gray-700">Step 2: Run with Admin</p>
                  <p className="text-gray-600 text-sm">
                    Right-click the PEIPL Bill Assistant shortcut and select "Run as administrator" once.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-gray-700">Step 3: Confirm Setup</p>
                  <p className="text-gray-600 text-sm">
                    The application will automatically register file associations (this happens once).
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <p className="font-semibold text-gray-700 text-green-700">✓ All Set!</p>
                  <p className="text-gray-600 text-sm">
                    You can now double-click any bill file to open it directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                3️⃣ Ways to Open Bill Files
              </h3>

              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-gray-700">Method 1: Double-Click</p>
                  <p className="text-gray-600 text-sm">
                    Double-click any .peiplbill or .json file to open it instantly (fastest!)
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <p className="font-semibold text-gray-700">Method 2: Drag & Drop</p>
                  <p className="text-gray-600 text-sm">
                    Drag files directly onto the PEIPL Bill Assistant window to load them
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-3">
                  <p className="font-semibold text-gray-700">Method 3: Open Button</p>
                  <p className="text-gray-600 text-sm">
                    Click "Open Bill" button in the app and browse to select a file
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h4>
              <ul className="space-y-1 text-yellow-700 text-sm">
                <li>• File associations work automatically after first admin run</li>
                <li>• Right-click on any bill file and select "Open with" to verify</li>
                <li>• Drag & drop works even before file associations are set up</li>
                <li>• All three methods load the complete bill data instantly</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "getting-started",
      title: "🚀 Getting Started",
      icon: "🚀",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Getting Started with PEIPL Bill Assistant
          </h2>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-800 mb-2">Welcome! 👋</h3>
            <p className="text-blue-700">
              PEIPL Bill Assistant is a professional invoicing application designed
              for creating, managing, and printing bills with ease. Built with a modern, 
              intuitive interface and powerful features.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-700">
              Quick Start Guide
            </h3>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Step 1: Fill Company Information
              </h4>
              <p className="text-gray-600 mb-2">
                Click the sidebar toggle to enter your company details:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Company Name</li>
                <li>Address</li>
                <li>Phone & Email</li>
                <li>GST Number</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Step 2: Enter Bill Details
              </h4>
              <p className="text-gray-600 mb-2">
                Fill in the bill information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Bill Number (auto-generated)</li>
                <li>Customer Name & Address</li>
                <li>Date</li>
                <li>Customer GST Number</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Step 3: Add Items
              </h4>
              <p className="text-gray-600 mb-2">
                Click "Add New Row" to add items to your bill:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Description</li>
                <li>Quantity</li>
                <li>Rate</li>
                <li>GST is calculated automatically</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Step 4: Generate Bill
              </h4>
              <p className="text-gray-600 mb-2">
                Click "Generate Professional Bill" to create your invoice.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Review all details before generating!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ui-design",
      title: "🎨 Modern UI & Design",
      icon: "🎨",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Modern UI & Design System
          </h2>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-4">
            <h3 className="font-bold text-purple-800 mb-2">🎯 New Design System</h3>
            <p className="text-purple-700">
              PEIPL Bill Assistant features a completely redesigned modern interface with 
              professional colors, smooth animations, and improved accessibility.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🎨 Color Scheme
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-lg bg-[#0d9488] shadow-md"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Primary Teal</p>
                    <p className="text-gray-600 text-sm">#0d9488 - Main actions & elements</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-lg bg-[#10b981] shadow-md"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Success Green</p>
                    <p className="text-gray-600 text-sm">#10b981 - Confirmations</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-lg bg-[#ef4444] shadow-md"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Danger Red</p>
                    <p className="text-gray-600 text-sm">#ef4444 - Destructive actions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-lg bg-[#f59e0b] shadow-md"></div>
                  <div>
                    <p className="font-semibold text-gray-800">Warning Amber</p>
                    <p className="text-gray-600 text-sm">#f59e0b - Warnings & cautions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                🔘 Button Styles
              </h3>
              
              <p className="text-gray-600 mb-3">
                Buttons are styled with 8 different variants for different actions:
              </p>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 bg-[#0d9488] text-white rounded-lg font-medium shadow-md">
                    Primary
                  </button>
                  <button className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg font-medium shadow-md">
                    Secondary
                  </button>
                  <button className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium shadow-md">
                    Success
                  </button>
                  <button className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg font-medium shadow-md">
                    Warning
                  </button>
                  <button className="px-4 py-2 bg-[#ef4444] text-white rounded-lg font-medium shadow-md">
                    Danger
                  </button>
                  <button className="px-4 py-2 border-2 border-[#0d9488] text-[#0d9488] rounded-lg font-medium">
                    Outline
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                    Ghost
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mt-3">
                💡 Each button also comes in 3 sizes: small, default, and large
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ✨ UI Features
              </h3>
              
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Smooth Transitions:</strong> Animations at 0.25s (fast), 0.4s (normal), 0.6s (slow)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Professional Shadows:</strong> 6-level shadow hierarchy for depth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Focus Rings:</strong> Clear keyboard navigation indicators</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Hover Effects:</strong> Interactive feedback on all clickable elements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Responsive Design:</strong> Perfect on mobile, tablet, and desktop</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Accessibility:</strong> WCAG AA compliant with proper contrast</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-[#0d9488] rounded-lg p-4">
              <h4 className="font-semibold text-[#0d9488] mb-2">
                🌟 Modern Design Benefits
              </h4>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• Consistent visual language throughout the app</li>
                <li>• Professional appearance that's pleasant to use</li>
                <li>• Fast performance with smooth animations</li>
                <li>• Works perfectly on all screen sizes</li>
                <li>• Better user experience with improved readability</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "creating-bills",
      title: "📝 Creating Bills",
      icon: "📝",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Creating Bills
          </h2>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Adding Items
              </h3>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    ➕ Add New Row
                  </h4>
                  <p className="text-gray-600">
                    Adds a single empty row to the items table.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Use this for adding items one by one.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">
                    🔢 Bulk Add Rows
                  </h4>
                  <p className="text-gray-600">
                    Add multiple rows at once (up to 100).
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Useful for large invoices with many items.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Editing Items
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Click any cell to edit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Press Tab to move to next cell</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Press Enter to move down</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Drag rows to reorder</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Removing Items
              </h3>
              <p className="text-gray-600 mb-2">
                Click the ❌ button on any row to remove it.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Warning: This action cannot be undone!
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Automatic Calculations
              </h3>
              <p className="text-gray-600 mb-2">
                The following are calculated automatically:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li>Taxable Value = Quantity × Rate</li>
                <li>CGST (9%) = Taxable Value × 0.09</li>
                <li>SGST (9%) = Taxable Value × 0.09</li>
                <li>Total = Taxable Value + CGST + SGST</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "printing",
      title: "🖨️ Printing Bills",
      icon: "🖨️",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Printing Bills
          </h2>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-4">
            <h3 className="font-bold text-green-800 mb-2">
              Print System Overview
            </h3>
            <p className="text-green-700">
              PEIPL Bill Assistant uses a professional printing system that ensures
              your bills print perfectly on A4 paper.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                How to Print
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-700">Generate Bill</p>
                    <p className="text-gray-600 text-sm">
                      Click "Generate Professional Bill" button
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Click Print Button
                    </p>
                    <p className="text-gray-600 text-sm">
                      Click the "🖨️ Print" button in the bill preview
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Print Dialog Opens
                    </p>
                    <p className="text-gray-600 text-sm">
                      Browser print dialog opens automatically
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-gray-700">
                      Select Printer & Print
                    </p>
                    <p className="text-gray-600 text-sm">
                      Choose your printer and click "Print"
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Print Settings
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700 font-medium">Paper Size:</span>
                  <span className="text-gray-600">A4 (210 × 297 mm)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700 font-medium">
                    Orientation:
                  </span>
                  <span className="text-gray-600">Portrait</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700 font-medium">Margins:</span>
                  <span className="text-gray-600">None (0)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700 font-medium">Scale:</span>
                  <span className="text-gray-600">100%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-medium">
                    Background Graphics:
                  </span>
                  <span className="text-green-600 font-semibold">
                    ON (Enable this!)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">
                💡 Pro Tips
              </h4>
              <ul className="space-y-1 text-yellow-700 text-sm">
                <li>• Enable "Background graphics" for colors to print</li>
                <li>• Use 100% scale (no shrinking)</li>
                <li>• Set margins to "None" for best results</li>
                <li>• Multi-page bills print with automatic page breaks</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "saving",
      title: "💾 Saving Bills",
      icon: "💾",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Saving Bills
          </h2>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Save as JSON
              </h3>
              <p className="text-gray-600 mb-3">
                Click the "💾 Save JSON" button to save your bill.
              </p>

              <div className="bg-blue-50 p-3 rounded mb-3">
                <p className="text-blue-800 font-semibold mb-2">
                  What gets saved:
                </p>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1 ml-4">
                  <li>All bill details</li>
                  <li>All items</li>
                  <li>Company information</li>
                  <li>Calculated totals</li>
                  <li>Amount in words</li>
                  <li>Timestamp</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-700 font-semibold mb-1">
                  Filename Format:
                </p>
                <code className="text-sm bg-gray-200 px-2 py-1 rounded">
                  bill_[billnumber]_[date].json
                </code>
                <p className="text-gray-600 text-sm mt-2">
                  Example: bill_peiplch2526_001_2025-09-30.json
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Export as PDF
              </h3>
              <p className="text-gray-600 mb-3">
                Click the "📄 PDF" button to export as PDF.
              </p>

              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">
                    High-quality PDF (3x resolution)
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Perfect for archiving</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">
                    Can be emailed to customers
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">Multi-page support</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Opening Saved Bills
              </h3>
              <p className="text-gray-600 mb-3">
                Three ways to open saved bills:
              </p>

              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <p className="font-semibold text-gray-700">
                    Method 1: Double-Click
                  </p>
                  <p className="text-gray-600 text-sm">
                    Double-click any bill_*.json file
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-3">
                  <p className="font-semibold text-gray-700">
                    Method 2: Drag & Drop
                  </p>
                  <p className="text-gray-600 text-sm">
                    Drag file onto the application window
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-3">
                  <p className="font-semibold text-gray-700">
                    Method 3: Open Bill Button
                  </p>
                  <p className="text-gray-600 text-sm">
                    Click "Open Bill" and select file
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">
                💡 Backup Tip
              </h4>
              <p className="text-green-700 text-sm">
                Bills are automatically backed up to localStorage (last 50
                bills). However, always save important bills as JSON files for
                permanent storage!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "keyboard-shortcuts",
      title: "⌨️ Keyboard Shortcuts",
      icon: "⌨️",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Keyboard Shortcuts
          </h2>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-4">
            <p className="text-blue-800">
              Use these keyboard shortcuts to work faster and more efficiently!
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                File Operations
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Open Bill</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl+O
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Save Bill</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl+S
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Print</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl+P
                  </kbd>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Navigation
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Next Cell</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Tab
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Previous Cell</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Shift+Tab
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Move Down</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Enter
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Exit Fullscreen</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    ESC
                  </kbd>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">View</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Zoom In</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl++
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Zoom Out</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl+-
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Reset Zoom</span>
                  <kbd className="px-3 py-1 bg-gray-200 rounded font-mono text-sm">
                    Ctrl+0
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "troubleshooting",
      title: "🔧 Troubleshooting",
      icon: "🔧",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Troubleshooting
          </h2>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                ❌ Print doesn't work
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-700">Solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check if popup blocker is enabled (allow popups)</li>
                  <li>Try using a different browser</li>
                  <li>Enable "Background graphics" in print settings</li>
                  <li>Set scale to 100%</li>
                  <li>Set margins to "None"</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                ❌ Colors don't print
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-700">Solution:</p>
                <p>
                  Enable "Background graphics" or "Print backgrounds" in your
                  browser's print dialog.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                ❌ Content is cut off
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-700">Solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Set scale to 100% (not "Fit to page")</li>
                  <li>Set margins to "None"</li>
                  <li>Use A4 paper size</li>
                  <li>Check printer settings</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                ❌ Can't open saved bill
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-700">Solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Make sure file starts with "bill_" and ends with ".json"
                  </li>
                  <li>
                    Check if file is corrupted (try opening in text editor)
                  </li>
                  <li>Try drag & drop instead of double-click</li>
                  <li>Use "Open Bill" button and browse for file</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                ❌ Calculations are wrong
              </h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-semibold text-gray-700">Solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check if quantity and rate are numbers</li>
                  <li>Refresh the page and try again</li>
                  <li>Clear browser cache</li>
                  <li>Make sure GST rates are correct (9% CGST + 9% SGST)</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">
                💡 Still Having Issues?
              </h4>
              <p className="text-green-700 text-sm">
                Try refreshing the page (F5) or restarting the application. Most
                issues can be resolved with a simple refresh!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tips",
      title: "💡 Tips & Tricks",
      icon: "💡",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Tips & Tricks
          </h2>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-indigo-800 mb-3">
              ✨ Latest Features & Improvements
            </h3>
            <ul className="space-y-2 text-indigo-700">
              <li className="flex items-start">
                <span className="text-lg mr-2">📂</span>
                <span><strong>File Associations:</strong> Double-click saved bills to open them instantly</span>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2">🎨</span>
                <span><strong>Modern Design:</strong> New professional UI with smooth animations</span>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2">🔘</span>
                <span><strong>Better Buttons:</strong> 8 button variants with improved styling</span>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2">📱</span>
                <span><strong>Responsive:</strong> Looks great on all devices and screen sizes</span>
              </li>
              <li className="flex items-start">
                <span className="text-lg mr-2">♿</span>
                <span><strong>Accessible:</strong> WCAG AA compliant with keyboard navigation</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-blue-800 mb-2">
                Use Keyboard Shortcuts
              </h3>
              <p className="text-blue-700 text-sm">
                Press Ctrl+O to open bills, Ctrl+S to save, and Tab to navigate
                between cells quickly.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="text-3xl mb-2">💾</div>
              <h3 className="font-bold text-green-800 mb-2">Save Regularly</h3>
              <p className="text-green-700 text-sm">
                Save your bills frequently to avoid losing data. Use Ctrl+S for
                quick saves.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-bold text-purple-800 mb-2">
                Use Fullscreen Mode
              </h3>
              <p className="text-purple-700 text-sm">
                Click the Fullscreen button for more space when working with
                large invoices.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-bold text-orange-800 mb-2">
                Drag to Reorder
              </h3>
              <p className="text-orange-700 text-sm">
                Drag rows to reorder items in your bill. No need to delete and
                re-add!
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-lg p-4">
              <div className="text-3xl mb-2">🔢</div>
              <h3 className="font-bold text-pink-800 mb-2">
                Bulk Add for Large Bills
              </h3>
              <p className="text-pink-700 text-sm">
                Use "Bulk Add Rows" when you need to add many items at once.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <div className="text-3xl mb-2">📄</div>
              <h3 className="font-bold text-yellow-800 mb-2">Export as PDF</h3>
              <p className="text-yellow-700 text-sm">
                Export bills as PDF for easy sharing via email or archiving.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-indigo-800 mb-3">
              🎯 Pro Workflow
            </h3>
            <ol className="space-y-2 text-indigo-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Set up company info once (it's saved automatically)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Use Bulk Add for multiple items</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Fill items using Tab key to navigate</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Review totals (calculated automatically)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">5.</span>
                <span>Generate bill and save as JSON</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">6.</span>
                <span>Export as PDF for customer</span>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">📚 User Manual</h1>
              <p className="text-white/90">
                Complete guide to using PEIPL Bill Assistant
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Close Manual"
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="🔍 Search manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <nav className="p-4 space-y-2">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-[#0d9488] text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <span className="font-semibold text-sm">
                      {section.title}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {filteredSections.find((s) => s.id === activeSection)?.content || (
              <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl">No results found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Version 2.5</span> • Last updated:
            January 2026 • Modern UI included
          </div>
       
        </div>
      </div>
    </div>
  );
}
