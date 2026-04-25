export default function CustomerInfo({ billData, setBillData }) {
  return (
    <div className="space-y-6">
      <div className="form-group">
        <label htmlFor="customerName">Customer/Client Name</label>
        <input
          id="customerName"
          type="text"
          placeholder="e.g. Reliance Industries"
          value={billData.customerName || ""}
          onChange={(e) =>
            setBillData({ ...billData, customerName: e.target.value })
          }
          className="w-full"
        />
      </div>

      <div className="form-group">
        <label htmlFor="customerAddress">Billing Address</label>
        <textarea
          id="customerAddress"
          rows="2"
          placeholder="Customer's full office address..."
          value={billData.customerAddress || ""}
          onChange={(e) =>
            setBillData({ ...billData, customerAddress: e.target.value })
          }
          className="w-full resize-none"
        />
      </div>

      <div className="form-row form-row-2">
        <div className="form-group">
          <label htmlFor="billNumber">Invoice #</label>
          <input
            id="billNumber"
            type="text"
            placeholder="PEIPL/24-25/001"
            value={billData.billNumber || ""}
            onChange={(e) =>
              setBillData({ ...billData, billNumber: e.target.value })
            }
            className="w-full"
          />
        </div>
        <div className="form-group">
          <label htmlFor="billDate">Invoice Date</label>
          <input
            id="billDate"
            type="date"
            value={billData.date || ""}
            onChange={(e) => setBillData({ ...billData, date: e.target.value })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
