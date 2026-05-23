import React from "react";
import { useForm } from "react-hook-form";
import {
  Save,
  Building2,
  Landmark,
  Palette,
  FolderSearch,
  Plus,
  Trash2,
  FolderOpen,
  FileText,
} from "lucide-react";
import { useInvoiceStore } from "../store/useInvoiceStore";
import type { CompanyDetails } from "../utils/types";

export const Settings: React.FC = () => {
  const { 
    companyDetails, 
    setCompanyDetails, 
    theme, 
    toggleTheme, 
    scanPaths, 
    addScanPath, 
    removeScanPath,
    gemPaths,
    addGemPath,
    removeGemPath
  } = useInvoiceStore();
  const { register, handleSubmit } = useForm<CompanyDetails>({
    defaultValues: companyDetails
  });

  const onSubmit = (data: CompanyDetails) => {
    setCompanyDetails(data);
    alert("Settings saved successfully!");
  };

  const handleAddFolder = async () => {
    if (window.electron) {
      const path = await window.electron.selectFolder();
      if (path) {
        addScanPath(path);
      }
    }
  };

  const handleAddGemFolder = async () => {
    if (window.electron) {
      const path = await window.electron.selectFolder();
      if (path) {
        addGemPath(path);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your company profile and application preferences.</p>
      </div>

      <div className="space-y-8">
        {/* Bill Storage Paths */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border bg-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderSearch size={20} className="text-blue-500" />
              <h2 className="text-lg font-bold">Bill Storage & Scanning</h2>
            </div>
            <button
              type="button"
              onClick={handleAddFolder}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus size={14} />
              Add Folder
            </button>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              The application will recursively scan these folders for JSON bills.
            </p>
            
            <div className="space-y-2">
              {scanPaths.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-accent/10 rounded-2xl border-2 border-dashed border-border/50">
                  <FolderOpen size={40} className="text-muted-foreground/30 mb-3" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No folders added yet</p>
                </div>
              ) : (
                scanPaths.map((path) => (
                  <div key={path} className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl group hover:bg-accent/40 transition-all border border-transparent hover:border-primary-500/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FolderOpen size={18} className="text-primary-500 shrink-0" />
                      <span className="text-xs font-mono truncate">{path}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScanPath(path)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* GeM Upload Paths */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border bg-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              <h2 className="text-lg font-bold">GeM Upload Scanning</h2>
            </div>
            <button
              type="button"
              onClick={handleAddGemFolder}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Plus size={14} />
              Add GeM Folder
            </button>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan folders for GeM uploaded PDFs (e.g., 31.pdf, 31SUPPORT.pdf).
            </p>
            
            <div className="space-y-2">
              {gemPaths.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-accent/10 rounded-2xl border-2 border-dashed border-border/50">
                  <FileText size={40} className="text-muted-foreground/30 mb-3" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No GeM folders added yet</p>
                </div>
              ) : (
                gemPaths.map((path) => (
                  <div key={path} className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl group hover:bg-accent/40 transition-all border border-transparent hover:border-emerald-500/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FolderOpen size={18} className="text-emerald-500 shrink-0" />
                      <span className="text-xs font-mono truncate">{path}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGemPath(path)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Company Profile */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border bg-accent/20 flex items-center gap-2">
              <Building2 size={20} className="text-primary-500" />
              <h2 className="text-lg font-bold">Company Profile</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Company Name
                </label>
                <input
                  {...register("name")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Address
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  GSTIN
                </label>
                <input
                  {...register("gstin")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  PAN
                </label>
                <input
                  {...register("pan")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Mobile
                </label>
                <input
                  {...register("mobile")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Email
                </label>
                <input
                  {...register("email")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border bg-accent/20 flex items-center gap-2">
              <Landmark size={20} className="text-purple-500" />
              <h2 className="text-lg font-bold">Bank Details</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Bank Name
                </label>
                <input
                  {...register("bankName")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Account Number
                </label>
                <input
                  {...register("accountNo")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  IFSC Code
                </label>
                <input
                  {...register("ifsc")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Branch Name
                </label>
                <input
                  {...register("branch")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Industrial Presets */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border bg-accent/20 flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              <h2 className="text-lg font-bold">Industrial Presets</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Default Outline Agreement
                </label>
                <input
                  {...register("outlineAgreement")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono"
                  placeholder="e.g. 4600002141"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Default GeM Seller ID
                </label>
                <input
                  {...register("gemSellerId")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono"
                  placeholder="e.g. RXON210002099996"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Default Vendor Code
                </label>
                <input
                  {...register("vendorCode")}
                  className="w-full bg-accent/30 border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary-500/20 transition-all font-mono"
                  placeholder="e.g. 102237"
                />
              </div>
              <div className="flex items-end">
                <p className="text-[10px] text-muted-foreground italic">
                  * These values will automatically fill in bills if not specifically provided.
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-border bg-accent/20 flex items-center gap-2">
              <Palette size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold">Appearance & Security</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-14 h-8 rounded-full bg-accent relative p-1 transition-all"
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-primary-500 shadow-md transform transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Auto-Save</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes while editing.
                  </p>
                </div>
                <div className="w-14 h-8 rounded-full bg-primary-500/20 relative p-1">
                  <div className="w-6 h-6 rounded-full bg-primary-500 shadow-md translate-x-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary-500/20 active:scale-95 uppercase tracking-widest"
            >
              <Save size={20} />
              Save All Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
