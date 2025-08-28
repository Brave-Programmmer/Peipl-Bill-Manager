import { useState, useEffect } from 'react';

const defaultCompany = {
  name: 'PUJARI ENGINEERS INDIA (P) LTD.',
  services: 'ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING • SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS',
  address: 'B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701.',
  phone: '9820027556',
  email: 'spujari79@gmail.com',
  gst: '27AADCP2938G1ZD',
  pan: 'AADCP2938G',
};

export default function CompanyInfo({ billData, setBillData, companyInfo, setCompanyInfo }) {
  return (
    <div className="p-6">
      <CompanyHeader companyInfo={companyInfo} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        <CompanyLeft companyInfo={companyInfo} />
        <CompanyRight billData={billData} setBillData={setBillData} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
      </div>
    </div>
  );
}

function CompanyHeader({ companyInfo }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
        {companyInfo?.name || defaultCompany.name}
      </h2>
    </div>
  );
}

function CompanyLeft({ companyInfo }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Services */}
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <div className="w-3 h-3 bg-blue-500 mt-2 flex-shrink-0"></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Core Services</h3>
            <p className="text-gray-700 font-medium leading-relaxed text-sm">
              {companyInfo?.services || defaultCompany.services}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-500">
          <div className="w-3 h-3 bg-gray-500 mt-2 flex-shrink-0"></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Registered Address</h3>
            <p className="text-gray-700 font-medium leading-relaxed text-sm">
              {companyInfo?.address || defaultCompany.address}
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="📞 Mobile" value={companyInfo?.phone || defaultCompany.phone} color="green" />
          <InfoCard label="✉️ Email" value={companyInfo?.email || defaultCompany.email} color="purple" />
          <InfoCard label="🏢 GSTIN" value={companyInfo?.gst || defaultCompany.gst} color="orange" />
          <InfoCard label="📋 PAN" value={companyInfo?.pan || defaultCompany.pan} color="red" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, color }) {
  const colorMap = {
    green: 'from-green-50 to-emerald-50 border-green-500',
    purple: 'from-purple-50 to-violet-50 border-purple-500',
    orange: 'from-orange-50 to-amber-50 border-orange-500',
    red: 'from-red-50 to-pink-50 border-red-500',
  };
  const dotColor = {
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }[color];

  return (
    <div className={`flex items-center space-x-4 p-4 bg-gradient-to-r ${colorMap[color]} border-l-4`}>
      <div className={`w-3 h-3 ${dotColor} flex-shrink-0`}></div>
      <div>
        <p className="text-gray-600 text-xs font-medium">{label}</p>
        <p className="text-gray-900 font-bold text-sm">{value}</p>
      </div>
    </div>
  );
}

function CompanyRight({ billData, setBillData, companyInfo, setCompanyInfo }) {
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  const generateBillNumber = () => {
    try {
      setIsGeneratingBill(true);
      const existingBills = JSON.parse(localStorage.getItem('savedBills') || '[]');

      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      const fyStart = month <= 3 ? year - 1 : year;
      const fyEnd = fyStart + 1;
      const fyString = `${fyStart.toString().slice(-2)}${fyEnd.toString().slice(-2)}`;
      const fyPrefix = `PEIPLCH${fyString}/`;

      const currentFYBills = existingBills.filter(bill => bill.billNumber?.startsWith(fyPrefix));

      let maxNumber = 0;
      currentFYBills.forEach(bill => {
        const parts = (bill.billNumber || '').split('/');
        const billNum = parseInt(parts[1], 10);
        if (!isNaN(billNum) && billNum > maxNumber) {
          maxNumber = billNum;
        }
      });

      const nextNumber = (maxNumber + 1).toString().padStart(3, '0'); // allow 001+
      const newBillNumber = `${fyPrefix}${nextNumber}`;
      setBillData(prev => ({ ...prev, billNumber: newBillNumber }));
      return newBillNumber;
    } catch (error) {
      console.error('Error generating bill number:', error);
      const fallback = 'PEIPLCH2526/001';
      setBillData(prev => ({ ...prev, billNumber: fallback }));
      return fallback;
    } finally {
      setIsGeneratingBill(false);
    }
  };

  useEffect(() => {
    if (!billData?.billNumber) {
      generateBillNumber();
    }
  }, []); // runs once

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-wide">TAX INVOICE</h3>
            <div className="w-12 h-1 bg-white mx-auto mt-2"></div>
          </div>
          <EditCompanyButton companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
        </div>

        <div className="space-y-4">
          {/* Bill No */}
          <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-blue-100 font-semibold text-sm">Bill No:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={billData?.billNumber || ''}
                onChange={(e) => setBillData({ ...billData, billNumber: e.target.value })}
                className="bg-white/20 border border-white/30 px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/70 text-sm text-center min-w-48"
                placeholder="PEIPLCH2526/001"
              />
              <button
                onClick={generateBillNumber}
                className="px-2 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors duration-200"
                title="Generate new bill number"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center p-3 bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-blue-100 font-semibold text-sm">Date:</span>
            <input
              type="date"
              value={billData?.date || ''}
              onChange={(e) => setBillData({ ...billData, date: e.target.value })}
              className="bg-white/20 border border-white/30 px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/50 text-sm text-center min-w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div>
      {!editing ? (
        <button onClick={start} className="bg-white/10 text-white px-3 py-2 border border-white/30 hover:bg-white/20 text-sm">
          Edit Company
        </button>
      ) : (
        <div className="bg-white text-gray-900 p-4 border border-gray-300 w-80">
          <div className="space-y-2">
            <LabeledInput label="Name" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
            <LabeledInput label="Services" value={draft.services} onChange={v => setDraft({ ...draft, services: v })} />
            <LabeledInput label="Address" value={draft.address} onChange={v => setDraft({ ...draft, address: v })} />
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="Phone" value={draft.phone} onChange={v => setDraft({ ...draft, phone: v })} />
              <LabeledInput label="Email" value={draft.email} onChange={v => setDraft({ ...draft, email: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput label="GSTIN" value={draft.gst} onChange={v => setDraft({ ...draft, gst: v })} />
              <LabeledInput label="PAN" value={draft.pan} onChange={v => setDraft({ ...draft, pan: v })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-3">
            <button onClick={cancel} className="px-3 py-1 bg-gray-200 text-gray-800 text-sm">Cancel</button>
            <button onClick={save} className="px-3 py-1 bg-blue-600 text-white text-sm">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-700">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-gray-300 px-2 py-1 bg-white text-gray-900 text-sm"
      />
    </div>
  );
}
