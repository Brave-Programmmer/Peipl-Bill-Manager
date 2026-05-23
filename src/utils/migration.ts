import type { Invoice, InvoiceItem } from './types';
import { parseNumeric } from './formatters';

export const migrateOldInvoice = (oldData: any): Invoice => {
  // Normalize items
  const items = (oldData.items || []).map((item: any): InvoiceItem => {
    // Check for "dates" vs "srNoDate" vs "dates" array
    // In some old versions, srNoDate might be a string but we need it as a string array for the new model
    const srNoDate = Array.isArray(item.srNoDate) 
      ? item.srNoDate 
      : [item.srNoDate || (item.dates && item.dates[0]) || ''];

    const qtyArr = Array.isArray(item.quantity) ? item.quantity : [item.quantity];
    const rateArr = Array.isArray(item.rate) ? item.rate : [item.rate];
    const maxLen = Math.max(qtyArr.length, rateArr.length);

    // Recalculate amounts if they look wrong or are missing
    const amounts: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      const q = parseNumeric(qtyArr[i]);
      const r = parseNumeric(rateArr[i]);
      amounts.push(Number((q * r).toFixed(2)));
    }

    const cgstRate = Number(item.cgstRate) || 9;
    const sgstRate = Number(item.sgstRate) || 9;
    const igstRate = Number(item.igstRate) || 0;

    const cgstAmounts = amounts.map(a => Number(((a * cgstRate) / 100).toFixed(2)));
    const sgstAmounts = amounts.map(a => Number(((a * sgstRate) / 100).toFixed(2)));
    const igstAmounts = amounts.map(a => Number(((a * igstRate) / 100).toFixed(2)));
    const totalsGST = amounts.map((a, i) => Number((a + (cgstAmounts[i] || 0) + (sgstAmounts[i] || 0) + (igstAmounts[i] || 0)).toFixed(2)));

    return {
      id: item.id || Math.random().toString(36).slice(2, 11),
      description: item.description || '',
      subDescriptions: item.subDescriptions || [],
      sacHsn: Array.isArray(item.sacHsn) ? item.sacHsn : [item.sacHsn || ''],
      quantity: qtyArr,
      unit: item.unit || 'PCS',
      rate: rateArr.map(Number),
      amount: amounts,
      cgstRate,
      cgstAmount: cgstAmounts,
      sgstRate,
      sgstAmount: sgstAmounts,
      igstRate,
      igstAmount: igstAmounts,
      totalWithGST: totalsGST,
      dates: Array.isArray(item.dates) ? item.dates : [item.dates || ''],
      srNoDate: srNoDate,
      refNo: Array.isArray(item.refNo) ? item.refNo : [item.refNo || ''],
    };
  });

  // Calculate totals if missing or for consistency
  const totalTaxableValue = items.reduce((acc: number, item: InvoiceItem) => 
    acc + item.amount.reduce((a: number, b: number) => a + (Number(b) || 0), 0), 0);
  const totalCGST = items.reduce((acc: number, item: InvoiceItem) => 
    acc + item.cgstAmount.reduce((a: number, b: number) => a + (Number(b) || 0), 0), 0);
  const totalSGST = items.reduce((acc: number, item: InvoiceItem) => 
    acc + item.sgstAmount.reduce((a: number, b: number) => a + (Number(b) || 0), 0), 0);
  const totalIGST = items.reduce((acc: number, item: InvoiceItem) => 
    acc + (item.igstAmount?.reduce((a: number, b: number) => a + (Number(b) || 0), 0) || 0), 0);
  
  const grandTotal = totalTaxableValue + totalCGST + totalSGST + totalIGST;

  return {
    billNumber: oldData.billNumber || '',
    date: oldData.date || new Date().toISOString().split('T')[0],
    customerName: oldData.customerName || '',
    plantName: oldData.plantName || '',
    customerAddress: oldData.customerAddress || '',
    customerGST: oldData.customerGST || '',
    vendorCode: oldData.vendorCode || '102237',
    orderNumber: oldData.orderNumber || oldData.orderNo || '',
    orderDate: oldData.orderDate || '',
    outlineAgreement: oldData.outlineAgreement || '4600002141',
    gemSellerId: oldData.gemSellerId || 'RXON210002099996',
    jobsheetNo: oldData.jobsheetNo || oldData.jobsheetNumber || 'ATTACHED',
    items,
    taxMode: (totalIGST > 0) ? 'IGST' : 'GST',
    totalTaxableValue: Number(totalTaxableValue.toFixed(2)),
    totalCGST: Number(totalCGST.toFixed(2)),
    totalSGST: Number(totalSGST.toFixed(2)),
    totalIGST: Number(totalIGST.toFixed(2)),
    grandTotal: Math.round(grandTotal),
    amountInWords: oldData.amountInWords || '',
    status: oldData.status || 'saved',
    gemUploaded: oldData.gemUploaded || false,
  };
};
