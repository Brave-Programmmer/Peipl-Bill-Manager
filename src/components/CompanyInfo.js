import { useState } from "react";
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
}) {
  // Sidebar should not auto-open by default
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      {/* Backdrop for small screens */}
      <div
        className={`fixed inset-0 bg-black z-30 transition-opacity ${sidebarOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"} md:hidden`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* Hamburger Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        className="fixed top-4 left-4 z-50 bg-[#019b98] border-2 border-[#311703] rounded-full p-2 shadow-lg transition-all duration-200 hover:bg-[#311703] hover:border-[#019b98] focus:outline-none"
        style={{
          boxShadow: sidebarOpen ? "0 4px 24px #019b9833" : undefined,
          left: sidebarOpen ? 200 : 16,
        }}
      >
        <AnimatedHamburger open={sidebarOpen} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r-4 border-[#019b98] shadow-2xl z-40 transition-all duration-300 ease-out ${
          sidebarOpen ? "translate-x-0 w-80" : "-translate-x-full w-80"
        }`}
        style={{ boxShadow: sidebarOpen ? "0 8px 32px #019b9833" : undefined }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-[#019b98] bg-[#019b98]/10 shadow-2xl">
            <h2 className="text-lg font-bold text-[#019b98] tracking-wide">
              Billing Panel
            </h2>
          </div>

          {/* Sidebar Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* Company Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Company Details
                </h3>
                <EditCompanyButton
                  companyInfo={companyInfo}
                  setCompanyInfo={setCompanyInfo}
                />
              </div>
              <div className="p-3 bg-[#019b98]/10 rounded-lg border border-[#019b98]/40">
                <p className="text-sm font-semibold text-[#311703]">
                  {companyInfo?.name || defaultCompany.name}
                </p>
                <p className="text-xs text-[#019b98] mt-1">
                  GSTIN: {companyInfo?.gst || defaultCompany.gst}
                </p>
              </div>
            </div>

            {/* Bill Details Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Bill Details
              </h3>
              <div className="space-y-4 bg-[#019b98]/5 p-4 rounded-lg border border-[#019b98]/20">
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

            {/* Customer Info Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Customer Information
              </h3>
              <div className="bg-[#019b98]/5 p-4 rounded-lg border border-[#019b98]/20">
                <CustomerInfo billData={billData} setBillData={setBillData} />
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#019b98]/20 bg-[#019b98]/5">
            <p className="text-xs text-[#019b98] text-center">
              © {new Date().getFullYear()} Pujari Engineers
            </p>
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
      {!editing
        ? <button
            onClick={start}
            className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Edit
          </button>
        : <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 p-6 border border-gray-300 w-96 rounded-lg shadow-xl space-y-4">
              <h3 className="text-base font-bold text-gray-700">
                Edit Company
              </h3>
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
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={cancel}
                  className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>}
    </>
  );
}

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
        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 text-sm 
                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 shadow-sm transition"
      />
    </div>
  );
}
