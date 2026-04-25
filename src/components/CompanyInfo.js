import { useState } from "react";
import CustomerInfo from "./CustomerInfo";

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
  return (
    <div className="space-y-6">
      <div className="form-row form-row-2">
        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            type="text"
            placeholder="e.g. Acme Corp"
            value={companyInfo.name || ""}
            onChange={(e) =>
              setCompanyInfo({ ...companyInfo, name: e.target.value })
            }
            className="w-full"
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyEmail">Email Address</label>
          <input
            id="companyEmail"
            type="email"
            placeholder="billing@acme.com"
            value={companyInfo.email || ""}
            onChange={(e) =>
              setCompanyInfo({ ...companyInfo, email: e.target.value })
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="companyAddress">Business Address</label>
        <textarea
          id="companyAddress"
          rows="2"
          placeholder="123 Business St, Suite 100..."
          value={companyInfo.address || ""}
          onChange={(e) =>
            setCompanyInfo({ ...companyInfo, address: e.target.value })
          }
          className="w-full resize-none"
        />
      </div>

      <div className="form-row form-row-2">
        <div className="form-group">
          <label htmlFor="companyPhone">Phone Number</label>
          <input
            id="companyPhone"
            type="tel"
            placeholder="+91 98765 43210"
            value={companyInfo.phone || ""}
            onChange={(e) =>
              setCompanyInfo({ ...companyInfo, phone: e.target.value })
            }
            className="w-full"
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyGst">GST Number (Optional)</label>
          <input
            id="companyGst"
            type="text"
            placeholder="22AAAAA0000A1Z5"
            value={companyInfo.gst || ""}
            onChange={(e) =>
              setCompanyInfo({ ...companyInfo, gst: e.target.value })
            }
            className="w-full"
          />
        </div>
      </div>
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
        : <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 w-full max-w-md rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
              <div className=" bg-gradient-to-r from-[#019b98] to-[#0a7a78]  px-6 py-4">
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
        className="w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm 
                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:border-[#019b98]
                 shadow-sm hover:border-gray-400 transition-all duration-200"
      />
    </div>
  );
}
