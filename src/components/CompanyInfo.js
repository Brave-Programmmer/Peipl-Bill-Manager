import { useState, memo } from "react";
import CustomerInfo from "./CustomerInfo";

// Hamburger menu icon
function AnimatedHamburger({ open }) {
  // simple animated hamburger => X using two lines and one fading
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        transform={open ? "translate(0,6) rotate(45 12 12)" : undefined}
        style={{ transition: "transform 160ms ease, opacity 160ms ease" }}
      />
      <rect
        x="3"
        y="12"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        style={{ opacity: open ? 0 : 1, transition: "opacity 120ms ease" }}
      />
      <rect
        x="3"
        y="18"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        transform={open ? "translate(0,-6) rotate(-45 12 12)" : undefined}
        style={{ transition: "transform 160ms ease, opacity 160ms ease" }}
      />
    </svg>
  );
}

const defaultCompany = {
  name: "PUJARI ENGINEERS INDIA (P) LTD.",
  services:
    "ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING • SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS",
  address:
    "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701.",
  phone: "9820027556",
  email: "spujari79@gmail.com",
  gst: "27AADCP2938G1ZD",
  pan: "AADCP2938G",
};

export default function CompanyInfo({
  billData,
  setBillData,
  companyInfo,
  setCompanyInfo,
  sidebarOpen: externalSidebarOpen,
  onToggleSidebar: externalToggleSidebar,
  hideMenuButton = false,
}) {
  // Use external state if provided, otherwise use internal state
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const sidebarOpen =
    externalSidebarOpen !== undefined
      ? externalSidebarOpen
      : internalSidebarOpen;
  const toggleSidebar =
    externalToggleSidebar ||
    (() => setInternalSidebarOpen(!internalSidebarOpen));

  return (
    <div>
      {/* Backdrop for small screens */}
      <div
        className={`fixed inset-0 bg-black z-30 transition-opacity ${
          sidebarOpen
            ? "opacity-40 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } md:hidden`}
        onClick={() => toggleSidebar()}
        aria-hidden
      />

      {/* Hamburger Menu Button - Only show if not controlled by header/titlebar */}
      {!hideMenuButton && (
        <button
          onClick={() => toggleSidebar()}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="fixed top-4 left-4 z-50 bg-gradient-to-br from-[#019b98] to-[#0a7a78] border-2 border-white/30 rounded-xl p-2.5 shadow-xl transition-all duration-300 hover:from-[#0a7a78] hover:to-[#056064] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:ring-offset-2"
          style={{
            boxShadow: sidebarOpen
              ? "0 8px 32px rgba(1, 155, 152, 0.4)"
              : "0 4px 20px rgba(1, 155, 152, 0.3)",
            left: sidebarOpen ? 200 : 16,
          }}
        >
          <AnimatedHamburger open={sidebarOpen} />
        </button>
      )}

      {/* Enhanced Sidebar */}
      <aside
        className={`fixed left-0 bg-gradient-to-br from-white via-gray-50 to-white border-r-4 border-[#019b98] shadow-2xl z-40 transition-all duration-300 ease-out ${
          sidebarOpen ? "translate-x-0 w-80" : "-translate-x-full w-80"
        }`}
        style={{
          top:
            typeof window !== "undefined" && window.electronAPI ? "40px" : "0",
          height:
            typeof window !== "undefined" && window.electronAPI
              ? "calc(100vh - 40px)"
              : "100vh",
          boxShadow: sidebarOpen
            ? "0 20px 60px rgba(1, 155, 152, 0.15), 0 0 0 1px rgba(1, 155, 152, 0.1)"
            : undefined,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Sidebar Header */}
          <div className="p-6 border-b-2 border-[#019b98] bg-gradient-to-r from-[#019b98] to-[#0a7a78] shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 7h10M7 12h10M7 17h7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight m-0">
                    Billing Panel
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Company & Bill Settings
                  </p>
                </div>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => toggleSidebar()}
                className="md:hidden w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all"
                aria-label="Close sidebar"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced Sidebar Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Enhanced Company Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#019b98]/10 flex items-center justify-center">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#019b98]"
                    >
                      <path d="M20 7h-4M4 7h4M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Company Details
                  </h3>
                </div>
                <EditCompanyButton
                  companyInfo={companyInfo}
                  setCompanyInfo={setCompanyInfo}
                />
              </div>
              <div className="p-4 bg-gradient-to-br from-[#019b98]/5 to-[#019b98]/10 rounded-xl border-2 border-[#019b98]/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#019b98] flex items-center justify-center flex-shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 7h-4M4 7h4M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {companyInfo?.name || defaultCompany.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        GSTIN:
                      </span>
                      <span className="text-xs font-mono text-[#019b98] bg-white/50 px-2 py-0.5 rounded">
                        {companyInfo?.gst || defaultCompany.gst}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Bill Details Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Bill Details
                </h3>
              </div>
              <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-5 rounded-xl border-2 border-blue-200/50 shadow-sm">
                <LabeledInput
                  label="Bill Number"
                  value={billData?.billNumber}
                  placeholder="PEIPLCH2526/001"
                  onChange={(v) => setBillData({ ...billData, billNumber: v })}
                />
                <LabeledInput
                  label="Bill Date"
                  type="date"
                  value={billData?.date}
                  onChange={(v) => setBillData({ ...billData, date: v })}
                />
                <LabeledInput
                  label="Order No."
                  value={billData?.orderNo}
                  placeholder="e.g., GEMC-511687712601789"
                  onChange={(v) => setBillData({ ...billData, orderNo: v })}
                />
              </div>
            </div>

            {/* Enhanced Customer Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-purple-600"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Customer Information
                </h3>
              </div>
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-5 rounded-xl border-2 border-purple-200/50 shadow-sm">
                <CustomerInfo billData={billData} setBillData={setBillData} />
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar Footer */}
          <div className="p-5 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#019b98]"
              >
                <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2H9m0-7V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
              <p className="text-xs font-semibold text-gray-600 text-center">
                © {new Date().getFullYear()} Pujari Engineers
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* -------------------- Company Edit -------------------- */
function EditCompanyButton({ companyInfo, setCompanyInfo }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(companyInfo || defaultCompany);

  const start = () => {
    setDraft(companyInfo || defaultCompany);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () => {
    setCompanyInfo(draft);
    setEditing(false);
  };

  return (
    <>
      {!editing ? (
        <button
          onClick={start}
          className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.2 7.8l4 4M3 21l3.75-1 11.13-11.13a2.12 2.12 0 0 0-3-3L3 17.25V21z" />
          </svg>
          Edit
        </button>
      ) : (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 w-full max-w-md rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.2 7.8l4 4M3 21l3.75-1 11.13-11.13a2.12 2.12 0 0 0-3-3L3 17.25V21z" />
                </svg>
                Edit Company Details
              </h3>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                <LabeledInput
                  label="Name"
                  value={draft.name}
                  onChange={(v) => setDraft({ ...draft, name: v })}
                />
                <LabeledInput
                  label="Services"
                  value={draft.services}
                  onChange={(v) => setDraft({ ...draft, services: v })}
                />
                <LabeledInput
                  label="Address"
                  value={draft.address}
                  onChange={(v) => setDraft({ ...draft, address: v })}
                />
                <LabeledInput
                  label="Phone"
                  value={draft.phone}
                  onChange={(v) => setDraft({ ...draft, phone: v })}
                />
                <LabeledInput
                  label="Email"
                  value={draft.email}
                  onChange={(v) => setDraft({ ...draft, email: v })}
                />
                <LabeledInput
                  label="GSTIN"
                  value={draft.gst}
                  onChange={(v) => setDraft({ ...draft, gst: v })}
                />
                <LabeledInput
                  label="PAN"
                  value={draft.pan}
                  onChange={(v) => setDraft({ ...draft, pan: v })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={cancel}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const MemoEditCompanyButton = memo(EditCompanyButton);

/* -------------------- Inputs -------------------- */
function LabeledInput({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm 
                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:border-[#019b98]
                 shadow-sm hover:border-gray-400 transition-all duration-200"
      />
    </div>
  );
}
