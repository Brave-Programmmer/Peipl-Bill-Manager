import { useState, useCallback, useMemo, useEffect } from "react";

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

  // Initialize bill number
  useEffect(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const fyStart = month <= 3 ? year - 1 : year;
    const fyEnd = fyStart + 1;
    const fyString = `${fyStart.toString().slice(-2)}${fyEnd.toString().slice(-2)}`;

    setBillData((prev) => ({
      ...prev,
      billNumber: `PEIPLCH${fyString}/01`,
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
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [billData.items]);

  const calculateTotalCGST = useMemo(() => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const cgstAmount = parseFloat(item.cgstAmount) || 0;
      return sum + cgstAmount;
    }, 0);
  }, [billData.items]);

  const calculateTotalSGST = useMemo(() => {
    if (!billData.items || !Array.isArray(billData.items)) return 0;
    return billData.items.reduce((sum, item) => {
      const sgstAmount = parseFloat(item.sgstAmount) || 0;
      return sum + sgstAmount;
    }, 0);
  }, [billData.items]);

  const calculateTotal = useMemo(() => {
    return calculateSubtotal + calculateTotalCGST + calculateTotalSGST;
  }, [calculateSubtotal, calculateTotalCGST, calculateTotalSGST]);

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
