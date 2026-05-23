import type { Invoice, CompanyDetails } from './utils/types';

export interface IElectronAPI {
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  selectFolder: () => Promise<string | null>;
  scanInvoices: (paths: string[]) => Promise<any[]>;
  scanGemPdfs: (paths: string[]) => Promise<any[]>;
  selectFile: () => Promise<{ path: string; content: any } | null>;
  saveFile: (data: { content: any; filePath?: string }) => Promise<string | null>;
  printToPDF: (data: { invoice: Invoice; company: CompanyDetails }) => Promise<string | null>;
  printWindow: (data: { invoice: Invoice; company: CompanyDetails }) => Promise<boolean>;
  getPrintData: () => { invoice: Invoice; company: CompanyDetails } | null;
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<void>;
  onFileOpen: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
