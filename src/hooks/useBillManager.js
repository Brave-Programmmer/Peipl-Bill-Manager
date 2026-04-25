import { useState, useCallback, useMemo, useEffect } from "react";
import {
  calculateSubtotal,
  calculateTotalCGST,
  calculateTotalSGST,
  calculateTotal,
} from "../utils/billCalculations";
import { getNextBillNumber } from "../utils/idGenerator";

export function useBillManager() {
  const [billData, setBillData] = useState({
    billNumber: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "RASHTRIYA CHEMICALS & FERTILIZERS LTD",
    plantName: "AMMONIA V PLANT",
    customerAddress: "TROMBAY UNIT\nMUMBAI.400 074",
    customerPhone: "",
    customerGST: "27AAACR2831H1ZK",
    items: [
      {
        id: 1,
        description: "",
        sacHsn: "",
        quantity: 1,
        unit: "PCS",
        rate: 0,
        amount: 0,
        cgstRate: 9,
        cgstAmount: 0,
        sgstRate: 9,
        sgstAmount: 0,
        totalWithGST: 0,
        dates: [new Date().toISOString().split("T")[0]],
      },
    ],
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: "PUJARI ENGINEERS INDIA (P) LTD.",
    services:
      "ONLINE LEAK SEALING • INSULATION HOT TIGHTING • METAL STITCHING • SPARE PARTS SUPPLIERS & LABOUR SUPPLIERS",
    address:
      "B-21, Flat No.101, Siddeshwar Co-op Hsg. Soc; Sector-9, Gharonda, Ghansoli, Navi, Mumbai -400 701.",
    phone: "9820027556",
    email: "spujari79@gmail.com",
    gst: "27AADCP2938G1ZD",
    pan: "AADCP2938G",
  });

  // Initialize bill number (client-side only)
  useEffect(() => {
    setBillData((prev) => ({
      ...prev,
      billNumber: getNextBillNumber(),
    }));
  }, []);

  // Load company info from localStorage
  useEffect(() => {
    try {
      const savedCompanyInfo = JSON.parse(
        localStorage.getItem("companyInfo") || "null",
      );
      if (savedCompanyInfo) {
        setCompanyInfo(savedCompanyInfo);
      }
    } catch (e) {
      console.error("Failed to load company info", e);
    }
  }, []);

  // Save company info to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    } catch (e) {
      console.error("Failed to save company info", e);
    }
  }, [companyInfo]);

  const calculateSubtotal = useMemo(() => {
    return calculateSubtotal(billData.items);
  }, [billData.items]);

  const calculateTotalCGST = useMemo(() => {
    return calculateTotalCGST(billData.items);
  }, [billData.items]);

  const calculateTotalSGST = useMemo(() => {
    return calculateTotalSGST(billData.items);
  }, [billData.items]);

  const calculateTotal = useMemo(() => {
    return calculateTotal(billData.items);
  }, [billData.items]);

  return {
    billData,
    setBillData,
    companyInfo,
    setCompanyInfo,
    calculateSubtotal,
    calculateTotalCGST,
    calculateTotalSGST,
    calculateTotal,
  };
}
