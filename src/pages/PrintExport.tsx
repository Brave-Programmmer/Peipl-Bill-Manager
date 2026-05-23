import React, { useEffect, useState } from 'react';
import { IndustrialInvoice } from '../templates/IndustrialInvoice';
import type { Invoice, CompanyDetails } from '../utils/types';

export const PrintExport: React.FC = () => {
  const [data, setData] = useState<{ invoice: Invoice; company: CompanyDetails } | null>(null);

  useEffect(() => {
    const loadData = () => {
      if (window.electron?.getPrintData) {
        const printData = window.electron.getPrintData();
        if (printData) {
          setData(printData);
        }
      }
    };
    
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Preparing Invoice...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex justify-center overflow-visible">
      <div className="print-area">
        <IndustrialInvoice invoice={data.invoice} company={data.company} />
      </div>
      <style>{`
        body { background: white !important; margin: 0; padding: 0; }
        .print-area { width: 210mm; background: white; }
        @page { size: A4; margin: 0; }
      `}</style>
    </div>
  );
};
