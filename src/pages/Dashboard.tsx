import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  TrendingUp, 
  FileText, 
  IndianRupee,
  Plus,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { migrateOldInvoice } from '../utils/migration';
import clsx from 'clsx';

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  gstCollected: number;
  uniqueClients: number;
  gemCount: number;
  nonGemCount: number;
}

export const Dashboard: React.FC = () => {
  const { scanPaths, gemPaths, setCurrentInvoice } = useInvoiceStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [gemPdfs, setGemPdfs] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFY, setSelectedFY] = useState<string>('');
  const [showAllBills, setShowAllBills] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  const handleManualGemToggle = async (inv: any) => {
    const updatedInvoice = {
      ...inv.content,
      gemUploaded: !inv.content.gemUploaded
    };
    
    try {
      if (window.electron?.saveFile) {
        await window.electron.saveFile({ 
          content: updatedInvoice, 
          filePath: inv.path 
        });
        
        // Update local state
        setInvoices(prev => prev.map(item => 
          item.path === inv.path ? { ...item, content: updatedInvoice } : item
        ));
      }
    } catch (err) {
      console.error('Failed to toggle GeM status:', err);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleScan = async () => {
    if (!window.electron) return;
    setIsScanning(true);
    try {
      const [invResults, gemResults] = await Promise.all([
        window.electron.scanInvoices(scanPaths),
        window.electron.scanGemPdfs(gemPaths)
      ]);
      
      const migratedInvoices = invResults.map((item: any) => ({
        ...item,
        content: migrateOldInvoice(item.content)
      }));

      setInvoices(migratedInvoices);
      setGemPdfs(gemResults);

      console.log('=== DASHBOARD SCAN DEBUG REPORT ===');
      console.log('--- JSON BILLS FOUND ---');
      migratedInvoices.forEach((inv: any) => {
        console.log(`Bill No: ${inv.content.billNumber} | FY: ${inv.fy} | Path: ${inv.path}`);
      });

      console.log('--- GeM PDFs FOUND ---');
      gemResults.forEach((pdf: any) => {
        console.log(`PDF Bill No: ${pdf.billNumber} | FY: ${pdf.fy} | File: ${pdf.fileName}`);
      });
      console.log('====================================');
    } catch (err) {
      console.error('Dashboard scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    handleScan();
  }, [scanPaths, gemPaths]);

  const financialYears = useMemo(() => {
    const years = new Set<string>(invoices.map(inv => inv.fy));
    return Array.from(years).sort().reverse();
  }, [invoices]);

  useEffect(() => {
    if (!selectedFY && financialYears.length > 0) {
      setSelectedFY(financialYears[0]);
    }
  }, [financialYears, selectedFY]);

  const filteredInvoices = useMemo(() => {
    if (!selectedFY) return [];
    
    let result = invoices.filter(inv => inv.fy === selectedFY);
    
    // Add GeM status to each invoice for easier rendering
    const resultsWithStatus = result.map(inv => {
      const billParts = inv.content.billNumber.split('/');
      const lastPart = billParts[billParts.length - 1];
      const jsonBillNoMatch = lastPart.match(/(\d+)/);
      const jsonBillNo = jsonBillNoMatch ? parseInt(jsonBillNoMatch[1], 10).toString() : '';

      const hasGemPdf = gemPdfs.some(pdf => {
        const pdfBillNo = parseInt(pdf.billNumber, 10).toString();
        const fyMatch = (inv.fy === 'Unknown' || pdf.fy === 'Unknown' || pdf.fy === inv.fy);
        return pdfBillNo === jsonBillNo && fyMatch;
      });

      return { ...inv, hasGemPdf: hasGemPdf || inv.content.gemUploaded };
    });

    // If not showing all, filter for pending only
    const filtered = showAllBills ? resultsWithStatus : resultsWithStatus.filter(inv => !inv.hasGemPdf);

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortConfig.key) {
        case 'billNumber':
          valA = a.content.billNumber;
          valB = b.content.billNumber;
          break;
        case 'orderNumber':
          valA = a.content.orderNumber || '';
          valB = b.content.orderNumber || '';
          break;
        case 'date':
          valA = a.content.date;
          valB = b.content.date;
          break;
        case 'grandTotal':
          valA = a.content.grandTotal;
          valB = b.content.grandTotal;
          break;
        case 'plantName':
          valA = a.content.plantName || '';
          valB = b.content.plantName || '';
          break;
        case 'orderNumber':
          valA = a.content.orderNumber || '';
          valB = b.content.orderNumber || '';
          break;
        default:
          valA = a.content.date;
          valB = b.content.date;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, selectedFY, gemPdfs, showAllBills, sortConfig]);

  const rowVirtualizer = useVirtualizer({
    count: filteredInvoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 10,
  });

  const dashboardStats = useMemo(() => {
    // We need ALL invoices for stats, but filtered for FY
    const allFyInvoices = !selectedFY ? [] : invoices.filter(inv => inv.fy === selectedFY);
    
    const stats: DashboardStats = {
      totalRevenue: 0,
      totalInvoices: allFyInvoices.length,
      gstCollected: 0,
      uniqueClients: new Set(allFyInvoices.map(inv => inv.content.customerName)).size,
      gemCount: 0,
      nonGemCount: 0
    };

    allFyInvoices.forEach(inv => {
      stats.totalRevenue += inv.content.grandTotal;
      stats.gstCollected += (inv.content.totalCGST + inv.content.totalSGST + inv.content.totalIGST);
      
      const billParts = inv.content.billNumber.split('/');
      const lastPart = billParts[billParts.length - 1];
      const jsonBillNoMatch = lastPart.match(/(\d+)/);
      const jsonBillNo = jsonBillNoMatch ? parseInt(jsonBillNoMatch[1], 10).toString() : '';

      const hasGemPdf = gemPdfs.some(pdf => {
        const pdfBillNo = parseInt(pdf.billNumber, 10).toString();
        const fyMatch = (inv.fy === 'Unknown' || pdf.fy === 'Unknown' || pdf.fy === inv.fy);
        return pdfBillNo === jsonBillNo && fyMatch;
      });
      
      if (hasGemPdf) {
        stats.gemCount++;
      } else {
        stats.nonGemCount++;
      }
    });

    return stats;
  }, [invoices, selectedFY, gemPdfs]);

  const stats = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(dashboardStats.totalRevenue), 
      icon: IndianRupee, 
      color: 'bg-emerald-500',
      trend: !selectedFY ? 'Select FY' : `FY ${selectedFY}`
    },
    { 
      label: 'Invoices Count', 
      value: dashboardStats.totalInvoices.toString(), 
      icon: FileText, 
      color: 'bg-blue-500',
      trend: `${dashboardStats.gemCount} GeM Uploads`,
      breakdown: [
        { label: 'GeM Bills', value: dashboardStats.gemCount, color: 'text-emerald-600' },
        { label: 'Pending', value: dashboardStats.nonGemCount, color: 'text-amber-600' }
      ]
    },
    { 
      label: 'GST Collected', 
      value: formatCurrency(dashboardStats.gstCollected), 
      icon: TrendingUp, 
      color: 'bg-purple-500',
      trend: 'Total Tax',
      breakdown: [
        { label: 'CGST', value: formatCurrency((!selectedFY ? [] : invoices.filter(inv => inv.fy === selectedFY)).reduce((acc, inv) => acc + (inv.content.totalCGST || 0), 0)), color: 'text-blue-600' },
        { label: 'SGST', value: formatCurrency((!selectedFY ? [] : invoices.filter(inv => inv.fy === selectedFY)).reduce((acc, inv) => acc + (inv.content.totalSGST || 0), 0)), color: 'text-purple-600' },
        { label: 'IGST', value: formatCurrency((!selectedFY ? [] : invoices.filter(inv => inv.fy === selectedFY)).reduce((acc, inv) => acc + (inv.content.totalIGST || 0), 0)), color: 'text-orange-600' }
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-accent/30 p-1 rounded-xl border border-border">
            <button
              onClick={() => setShowAllBills(false)}
              className={clsx(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                !showAllBills ? "bg-white dark:bg-zinc-800 shadow-sm text-primary-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setShowAllBills(true)}
              className={clsx(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                showAllBills ? "bg-white dark:bg-zinc-800 shadow-sm text-primary-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Bills
            </button>
          </div>
          <select 
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="bg-accent/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 ring-primary-500/20 transition-all outline-none"
          >
            {!selectedFY && <option value="">Select FY</option>}
            {financialYears.map(fy => (
              <option key={fy} value={fy}>{`FY ${fy}`}</option>
            ))}
          </select>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="p-2.5 bg-accent hover:bg-accent/80 rounded-xl transition-all disabled:opacity-50 shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={isScanning ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => {
              setCurrentInvoice(null);
              navigate('/editor');
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20 active:scale-95 shrink-0"
          >
            <Plus size={20} />
            New Bill
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group border border-primary-500/5 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={stat.color + " w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"}>
                  <stat.icon size={24} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-full">
                  {stat.trend}
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 tracking-tight">{stat.value}</h3>
              
              {stat.breakdown && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                  {stat.breakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                      <span className={clsx("text-xs font-black", item.color)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Background decoration */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Recent Invoices */}
        <div className="glass-card rounded-3xl overflow-hidden border border-primary-500/5 flex flex-col h-[600px]">
          <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold">{showAllBills ? 'Financial Year Records' : 'Pending GeM Uploads'}</h2>
            <div className={clsx(
              "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
              showAllBills ? "bg-primary-500/10 text-primary-600" : "bg-amber-500/10 text-amber-600"
            )}>
              {filteredInvoices.length} {showAllBills ? 'Total' : 'Pending'} Bills
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Table Header - Sticky */}
            <div className="bg-accent/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border shrink-0">
              <div className="flex items-center">
                <div 
                  className="px-6 py-4 cursor-pointer hover:text-primary-600 transition-colors w-[150px] shrink-0"
                  onClick={() => handleSort('billNumber')}
                >
                  <div className="flex items-center gap-1">
                    Bill No
                    {sortConfig.key === 'billNumber' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="opacity-30" />}
                  </div>
                </div>
                <div 
                  className="px-6 py-4 cursor-pointer hover:text-primary-600 transition-colors flex-1"
                  onClick={() => handleSort('plantName')}
                >
                  <div className="flex items-center gap-1">
                    Customer / Plant
                    {sortConfig.key === 'plantName' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="opacity-30" />}
                  </div>
                </div>
                <div 
                  className="px-6 py-4 cursor-pointer hover:text-primary-600 transition-colors w-[200px] shrink-0"
                  onClick={() => handleSort('orderNumber')}
                >
                  <div className="flex items-center gap-1">
                    Order No
                    {sortConfig.key === 'orderNumber' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="opacity-30" />}
                  </div>
                </div>
                <div className="px-6 py-4 w-[100px] shrink-0 text-center">FY</div>
                <div 
                  className="px-6 py-4 cursor-pointer hover:text-primary-600 transition-colors w-[150px] shrink-0 text-right"
                  onClick={() => handleSort('grandTotal')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortConfig.key === 'grandTotal' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="opacity-30" />}
                  </div>
                </div>
                <div className="px-6 py-4 w-[140px] shrink-0 text-center">Status</div>
                <div className="px-6 py-4 w-[60px] shrink-0 text-center">Done</div>
                <div className="px-6 py-4 w-[80px] shrink-0 text-right">Actions</div>
              </div>
            </div>

            {/* Virtual Scroll Container */}
            <div 
              ref={parentRef}
              className="flex-1 overflow-auto custom-scrollbar"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const inv = filteredInvoices[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      className="absolute top-0 left-0 w-full border-b border-border hover:bg-accent/30 transition-colors flex items-center group"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="px-6 py-4 font-mono font-bold text-sm whitespace-nowrap w-[150px] shrink-0">
                        {inv.content.billNumber}
                      </div>
                      <div className="px-6 py-4 flex-1 overflow-hidden">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs uppercase truncate">{inv.content.plantName || 'N/A'}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(inv.content.date)}</span>
                        </div>
                      </div>
                      <div className="px-6 py-4 font-mono text-[10px] font-bold text-muted-foreground w-[200px] shrink-0 truncate">
                        {inv.content.orderNumber || '-'}
                      </div>
                      <div className="px-6 py-4 w-[100px] shrink-0 text-center">
                        <span className="text-[10px] font-bold bg-accent px-2 py-1 rounded-lg">FY {inv.fy}</span>
                      </div>
                      <div className="px-6 py-4 font-black text-primary-600 dark:text-primary-400 whitespace-nowrap w-[150px] shrink-0 text-right">
                        {formatCurrency(inv.content.grandTotal)}
                      </div>
                      <div className="px-6 py-4 w-[140px] shrink-0 text-center">
                        {inv.hasGemPdf ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
                            <ShieldCheck size={12} /> GeM Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 whitespace-nowrap">
                            <ShieldAlert size={12} /> Pending GeM
                          </span>
                        )}
                      </div>
                      <div className="px-6 py-4 w-[60px] shrink-0 flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualGemToggle(inv);
                          }}
                          className={clsx(
                            "transition-all",
                            inv.content.gemUploaded ? "text-emerald-500" : "text-muted-foreground hover:text-primary-500"
                          )}
                        >
                          {inv.content.gemUploaded ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                      </div>
                      <div className="px-6 py-4 text-right w-[80px] shrink-0">
                        <button 
                          onClick={() => {
                            setCurrentInvoice(inv.content);
                            navigate('/editor');
                          }}
                          className="text-primary-500 hover:bg-primary-500/10 p-2 rounded-xl transition-all"
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <ShieldCheck size={40} className="text-emerald-500 opacity-40" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      {selectedFY ? `All bills uploaded to GeM for FY ${selectedFY}!` : 'Please select a Financial Year'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
